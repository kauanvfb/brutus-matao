import 'server-only'
import {createHash,createHmac,randomUUID} from 'node:crypto'
import type {PoolClient} from 'pg'
import type {CartInput,OrderInput} from '@/lib/validations/order'
import {db,tx} from '@/lib/db/pool'
export class OrderError extends Error{constructor(message:string,public status=422){super(message)}}
type PricedLine={productId:string;name:string;quantity:number;baseCents:number;unitCents:number;lineCents:number;choices:{id:string;label:string;price_cents:number}[];notes?:string}
type Quoted={lines:PricedLine[];subtotalCents:number;deliveryFeeCents:number;totalCents:number;deliveryAreaId:string|null}
export function trackToken(id:string,key:string){const secret=process.env.TRACKING_SECRET;if(!secret||secret.length<32)throw new OrderError('Segredo de acompanhamento não configurado',503);return createHmac('sha256',secret).update(`${id}:${key}`).digest('hex')}
export function tokenHash(token:string){return createHash('sha256').update(token).digest('hex')}
export function requestHash(data:OrderInput){return createHash('sha256').update(JSON.stringify(data)).digest('hex')}
export async function priceCart(client:PoolClient,data:CartInput):Promise<Quoted>{
 const settings=await client.query<{key:string;value:boolean|string|null}>("select key,value from site_settings where key in ('orders_open','pickup_enabled','delivery_enabled','address')")
 const flags=Object.fromEntries(settings.rows.map(r=>[r.key,r.value]))
 if(flags.orders_open!==true)throw new OrderError('A loja não está recebendo pedidos agora')
 if(data.method==='pickup'&&(!flags.pickup_enabled||!flags.address))throw new OrderError('Retirada não habilitada ou endereço não confirmado')
 if(data.method==='delivery'&&!flags.delivery_enabled)throw new OrderError('Entrega indisponível')
 const local=await client.query<{day:number;today:string;local_time:string}>("select extract(dow from current_timestamp at time zone 'America/Sao_Paulo')::int as day,(current_timestamp at time zone 'America/Sao_Paulo')::date::text as today,(current_timestamp at time zone 'America/Sao_Paulo')::time::text as local_time")
 const {day,today,local_time}=local.rows[0];const ex=await client.query('select * from opening_exceptions where day=$1',[today]);const hours=ex.rows.length?ex.rows[0]: (await client.query('select enabled as open,opens_at,closes_at from opening_hours where day_of_week=$1',[day])).rows[0]
 if(!hours?.open||!hours.opens_at||!hours.closes_at)throw new OrderError('Fora do horário de pedidos')
 const now=local_time.slice(0,8),start=String(hours.opens_at).slice(0,8),end=String(hours.closes_at).slice(0,8)
 if(start<end?(now<start||now>=end):(now<start&&now>=end))throw new OrderError('Fora do horário de pedidos')
 const mode=await client.query<{minimum_cents:number}>('select minimum_cents from service_modes where mode=$1 and enabled',[data.method]);if(!mode.rows.length)throw new OrderError('Modalidade não habilitada')
 let fee=0,areaId:string|null=null
 if(data.method==='delivery'){if(!data.postalCode)throw new OrderError('Informe o CEP para verificar entrega');const area=await client.query<{id:string;fee_cents:number}>('select id,fee_cents from delivery_areas where active and zip_start<=$1 and zip_end>=$1 order by (zip_end-zip_start),id limit 1',[Number(data.postalCode)]);if(!area.rows.length)throw new OrderError('Este CEP está fora da área cadastrada');fee=area.rows[0].fee_cents;areaId=area.rows[0].id}
 const lines:PricedLine[]=[]
 for(const item of data.items){
  const p=await client.query<{id:string;name:string;price_cents:number;max_per_order:number|null}>('select p.id,p.name,p.price_cents,p.max_per_order from products p join categories c on c.id=p.category_id where p.id=$1 and p.active and p.approved and p.available and c.active and c.approved',[item.productId]);if(!p.rows.length)throw new OrderError('Um produto saiu do cardápio. Revise seu carrinho')
  if(data.items.filter(line=>line.productId===item.productId).reduce((n,line)=>n+line.quantity,0)>(p.rows[0].max_per_order||20))throw new OrderError(`Limite de unidades para ${p.rows[0].name}`)
  if(new Set(item.choices).size!==item.choices.length)throw new OrderError('Opções repetidas são inválidas')
  const groups=await client.query<{id:string;title:string;min_select:number;max_select:number}>('select g.id,g.title,g.min_select,g.max_select from option_groups g join product_option_groups pog on pog.group_id=g.id where pog.product_id=$1 and g.active',[item.productId]);
  const choices=item.choices.length?await client.query<{id:string;label:string;price_cents:number;group_id:string}>('select oc.id,oc.label,oc.price_cents,oc.group_id from option_choices oc join option_groups g on g.id=oc.group_id join product_option_groups pog on pog.group_id=g.id where pog.product_id=$1 and oc.active and g.active and oc.id=any($2::uuid[])',[item.productId,item.choices]):{rows:[]}
  if(choices.rows.length!==item.choices.length)throw new OrderError('Uma personalização não está mais disponível')
  for(const g of groups.rows){const n=choices.rows.filter(c=>c.group_id===g.id).length;if(n<g.min_select||n>g.max_select)throw new OrderError(`Revise as opções de ${g.title}`)}
  const unit=p.rows[0].price_cents+choices.rows.reduce((n,c)=>n+c.price_cents,0);lines.push({productId:item.productId,name:p.rows[0].name,quantity:item.quantity,baseCents:p.rows[0].price_cents,unitCents:unit,lineCents:unit*item.quantity,choices:choices.rows.map(({id,label,price_cents})=>({id,label,price_cents})),notes:item.notes?.trim()||undefined})
 }
 const subtotal=lines.reduce((n,l)=>n+l.lineCents,0);if(subtotal<mode.rows[0].minimum_cents)throw new OrderError('Pedido abaixo do valor mínimo configurado')
 if(subtotal+fee>100000000)throw new OrderError('Valor acima do limite para pedidos')
 return {lines,subtotalCents:subtotal,deliveryFeeCents:fee,totalCents:subtotal+fee,deliveryAreaId:areaId}
}
export async function quote(data:CartInput){const client=await db().connect();try{return await priceCart(client,data)}finally{client.release()}}
export async function persistOrder(client:PoolClient,data:OrderInput){
 await client.query('select pg_advisory_xact_lock(hashtext($1))',[data.idempotencyKey]);const hash=requestHash(data)
 const existing=await client.query<{id:string;reference:string;request_hash:string}>('select id,reference,request_hash from orders where idempotency_key=$1',[data.idempotencyKey]);if(existing.rows.length){if(existing.rows[0].request_hash!==hash)throw new OrderError('Chave de repetição já usada com outro pedido',409);return {reference:existing.rows[0].reference,token:trackToken(existing.rows[0].id,data.idempotencyKey),repeated:true}}
 const setting=await client.query<{key:string;value:boolean}>("select key,value from site_settings where key in ('offline_payment_enabled','online_payment_enabled')");const enabled=Object.fromEntries(setting.rows.map(x=>[x.key,x.value]));if(data.paymentMethod==='offline'&&!enabled.offline_payment_enabled)throw new OrderError('Pagamento no local não habilitado');if(data.paymentMethod==='online'&&(!enabled.online_payment_enabled||!['test','live'].includes(process.env.PAYMENT_MODE||'')||!process.env.MP_WEBHOOK_SECRET||!(process.env.PAYMENT_MODE==='test'?process.env.MP_TEST_ACCESS_TOKEN:process.env.MP_ACCESS_TOKEN)))throw new OrderError('Pagamento online ainda não está configurado');if(data.paymentMethod==='online'&&process.env.PAYMENT_MODE==='live'&&process.env.ENABLE_LIVE_PAYMENTS!=='true')throw new OrderError('Pagamento em produção desabilitado')
 const quoted=await priceCart(client,data);if(quoted.totalCents!==data.expectedTotalCents)throw new OrderError('Os valores mudaram. Volte à modalidade e confira o resumo novamente',409);const id=randomUUID(),reference=`BR-${id.replace(/-/g,'').slice(0,16).toUpperCase()}`,token=trackToken(id,data.idempotencyKey)
 await client.query('insert into orders(id,reference,idempotency_key,request_hash,customer_name,customer_phone,customer_email,fulfillment_method,payment_method,delivery_address,delivery_area_id,notes,subtotal_cents,delivery_fee_cents,total_cents) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',[id,reference,data.idempotencyKey,hash,data.name,data.phone,data.email||null,data.method,data.paymentMethod,data.method==='delivery'?JSON.stringify(data.address):null,quoted.deliveryAreaId,data.notes||null,quoted.subtotalCents,quoted.deliveryFeeCents,quoted.totalCents])
 for(const l of quoted.lines)await client.query('insert into order_items(order_id,product_id,product_name,quantity,base_cents,choices_snapshot,unit_cents,line_cents,notes) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,l.productId,l.name,l.quantity,l.baseCents,JSON.stringify(l.choices),l.unitCents,l.lineCents,l.notes||null])
 await client.query('insert into order_status_events(order_id,status) values($1,$2)',[id,'novo'])
 await client.query('insert into order_access_tokens(order_id,token_hash,expires_at) values($1,$2,now()+interval \'30 days\')',[id,tokenHash(token)])
 await client.query('insert into payments(order_id,provider,status,amount_cents,provider_idempotency_key) values($1,$2,$3,$4,$5)',[id,data.paymentMethod==='online'?'mercadopago':'offline','pending',quoted.totalCents,randomUUID()])
 return {reference,token,repeated:false}
}
export async function createOrder(data:OrderInput){return tx(client=>persistOrder(client,data))}
export async function getTrackedOrder(reference:string,token:string,connection:Pick<PoolClient,'query'>=db()){if(!/^[a-f\d]{64}$/.test(token))return null;const r=await connection.query('select o.reference,o.fulfillment_status,o.payment_status,o.fulfillment_method,o.payment_method,o.subtotal_cents,o.delivery_fee_cents,o.total_cents,o.created_at,o.notes,oi.product_name,oi.quantity,oi.unit_cents,oi.line_cents,oi.choices_snapshot,oi.notes item_notes from orders o join order_access_tokens t on t.order_id=o.id left join order_items oi on oi.order_id=o.id where o.reference=$1 and t.token_hash=$2 and t.expires_at>now() and t.revoked_at is null',[reference,tokenHash(token)]);if(!r.rows.length)return null;const events=await connection.query('select status,created_at from order_status_events where order_id=(select id from orders where reference=$1) order by created_at',[reference]);return {reference,fulfillmentStatus:r.rows[0].fulfillment_status,paymentStatus:r.rows[0].payment_status,method:r.rows[0].fulfillment_method,paymentMethod:r.rows[0].payment_method,subtotalCents:r.rows[0].subtotal_cents,feeCents:r.rows[0].delivery_fee_cents,totalCents:r.rows[0].total_cents,createdAt:r.rows[0].created_at,items:r.rows.map(row=>({name:row.product_name,quantity:row.quantity,unitCents:row.unit_cents,lineCents:row.line_cents,choices:row.choices_snapshot,notes:row.item_notes})),events:events.rows}}
