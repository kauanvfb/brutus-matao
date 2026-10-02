import {beforeAll,afterAll,describe,it,expect} from 'vitest'
import {PGlite} from '@electric-sql/pglite'
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto'
import {readFileSync,readdirSync} from 'node:fs'
import type {PoolClient} from 'pg'
import {priceCart,persistOrder,getTrackedOrder} from '@/lib/orders/core'
import {cents,providerState,validateWebhook,applyOfficialPayment} from '@/lib/payments/mercadopago'
import {createHmac,randomUUID} from 'node:crypto'
const cat='aaaaaaaa-0000-4000-8000-000000000001',prod='aaaaaaaa-0000-4000-8000-000000000002',choice='aaaaaaaa-0000-4000-8000-000000000004'
let pg:PGlite;const client=()=>pg as unknown as PoolClient
const cart=()=>({items:[{productId:prod,quantity:2,choices:[choice]}],method:'pickup' as const})
beforeAll(async()=>{
 pg=new PGlite({extensions:{pgcrypto}})
 await pg.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[])")
 for(const file of readdirSync('supabase/migrations').sort())await pg.exec(readFileSync(`supabase/migrations/${file}`,'utf8'))
 await pg.exec("set app.brutus_environment='development'");await pg.exec(readFileSync('supabase/seed.dev.sql','utf8'))
 await pg.exec(`update categories set approved=true where id='${cat}'; update products set approved=true where id='${prod}'; update site_settings set value='true'::jsonb where key in ('orders_open','pickup_enabled','offline_payment_enabled'); update site_settings set value='"Rua de Teste, 1"'::jsonb where key='address'; update service_modes set enabled=true where mode='pickup'`)
 const dow=(await pg.query<{day:number}>("select extract(dow from current_timestamp at time zone 'America/Sao_Paulo')::int as day")).rows[0].day
 await pg.query('insert into opening_hours(day_of_week,opens_at,closes_at,enabled) values($1,$2,$3,true) on conflict(day_of_week) do update set opens_at=excluded.opens_at,closes_at=excluded.closes_at,enabled=true',[dow,'00:00','23:59'])
 process.env.TRACKING_SECRET='local-test-secret-32-bytes-do-not-publish'
},30000)
afterAll(async()=>{await pg?.close()})
describe('preço e segurança do pedido com SQL real',()=>{
 it('recalcula adicional e quantidade usando o banco',async()=>{const q=await priceCart(client(),cart());expect(q.totalCents).toBe(6580);expect(q.lines[0].choices[0].label).toContain('DEMO')})
 it('recusa grupo obrigatório sem escolha',async()=>{await expect(priceCart(client(),{...cart(),items:[{productId:prod,quantity:1,choices:[]}]})).rejects.toThrow('Revise as opções')})
 it('recusa produto indisponível e loja fechada',async()=>{await pg.exec(`update products set available=false where id='${prod}'`);await expect(priceCart(client(),cart())).rejects.toThrow('saiu do cardápio');await pg.exec(`update products set available=true where id='${prod}'; update site_settings set value='false'::jsonb where key='orders_open'`);await expect(priceCart(client(),cart())).rejects.toThrow('não está recebendo');await pg.exec("update site_settings set value='true'::jsonb where key='orders_open'")})
 it('recusa cidade fora da área e inclui a taxa fixa cadastrada',async()=>{await pg.exec("update site_settings set value='true'::jsonb where key='delivery_enabled'; update service_modes set enabled=true where mode='delivery'; insert into delivery_areas(label,city,city_key,state,fee_cents,active) values('Matão - SP','Matão','matao','SP',500,true)");const fora=async()=>({postalCode:'14800000',street:'',district:'',city:'Araraquara',state:'SP'});await expect(priceCart(client(),{...cart(),method:'delivery',postalCode:'14800000'},fora)).rejects.toThrow('não entrega');const matao=async()=>({postalCode:'15990000',street:'',district:'',city:'Matão',state:'SP'});const q=await priceCart(client(),{...cart(),method:'delivery',postalCode:'15990000'},matao);expect(q.totalCents).toBe(7080)})
 it('cria snapshot, repete sem duplicar e impede mesma chave com outro valor',async()=>{const data={...cart(),expectedTotalCents:6580,idempotencyKey:randomUUID(),name:'Pessoa Teste',phone:'16999999999',paymentMethod:'offline' as const};const first=await persistOrder(client(),data);const second=await persistOrder(client(),data);expect(second).toEqual({...first,repeated:true});const count=await pg.query<{n:number}>('select count(*)::int n from orders');expect(count.rows[0].n).toBe(1);const snapshot=await pg.query<{product_name:string;line_cents:number}>('select product_name,line_cents from order_items');expect(snapshot.rows[0].line_cents).toBe(6580);await expect(persistOrder(client(),{...data,name:'Outra Pessoa'})).rejects.toThrow('Chave de repetição')})
 it('exige nova revisão se o total mudou',async()=>{await expect(persistOrder(client(),{...cart(),expectedTotalCents:1,idempotencyKey:randomUUID(),name:'Pessoa Teste',phone:'16999999999',paymentMethod:'offline'})).rejects.toThrow('valores mudaram')})
 it('rejeita transição inválida no PostgreSQL',async()=>{await expect(pg.exec("update orders set fulfillment_status='concluido'")).rejects.toThrow('Transição')})
})
describe('integração de pagamento isolada',()=>{
 it('só aprova após consulta oficial, valida valor/referência e ignora evento duplicado',async()=>{process.env.PAYMENT_MODE='test';process.env.MP_TEST_ACCESS_TOKEN='local-only';process.env.MP_WEBHOOK_SECRET='local-only';await pg.exec("update site_settings set value='true'::jsonb where key='online_payment_enabled'");const data={...cart(),expectedTotalCents:6580,idempotencyKey:randomUUID(),name:'Pessoa Teste',phone:'16999999999',email:'teste@example.test',paymentMethod:'online' as const};const order=await persistOrder(client(),data);await pg.query('update payments set provider_order_id=$1 where order_id=(select id from orders where reference=$2)',['ORD-DEMO',order.reference]);const official={id:'ORD-DEMO',external_reference:order.reference,status:'processed',status_detail:'accredited',total_amount:'65.80',total_paid_amount:'65.80',currency:'BRL',last_updated_date:'2026-09-25T10:00:00Z'};await expect(applyOfficialPayment(client(),{...official,total_amount:'1.00'})).rejects.toThrow('divergente');await expect(applyOfficialPayment(client(),{...official,external_reference:'OUTRO'})).rejects.toThrow('divergente');const before=await pg.query<{payment_status:string}>('select payment_status from orders where reference=$1',[order.reference]);expect(before.rows[0].payment_status).toBe('pending');await applyOfficialPayment(client(),official);await applyOfficialPayment(client(),official);const updated=await pg.query<{payment_status:string}>('select payment_status from orders where reference=$1',[order.reference]);const events=await pg.query<{n:number}>("select count(*)::int n from payment_events where provider_event_id like 'ORD-DEMO:%'");expect(updated.rows[0].payment_status).toBe('approved');expect(events.rows[0].n).toBe(1)})
 it('não confunde retorno com pagamento e interpreta estados oficiais',()=>{expect(providerState('created','created')).toBe('pending');expect(providerState('processed','accredited')).toBe('approved');expect(providerState('processed','refunded')).toBe('refunded');expect(providerState('failed','high_risk')).toBe('rejected');expect(cents('70.80')).toBe(7080);expect(()=>cents('70.805')).toThrow()})
 it('aceita assinatura válida e rejeita assinatura inválida/replay antigo',()=>{process.env.MP_WEBHOOK_SECRET='test-webhook-secret';const id='ORD123',requestId=randomUUID(),ts=String(Date.now()),manifest=`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`,sig=createHmac('sha256',process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');const req=new Request('https://localhost/api/webhooks/mercadopago?data.id='+id,{headers:{'x-request-id':requestId,'x-signature':`ts=${ts},v1=${sig}`}});expect(()=>validateWebhook(req,id)).not.toThrow();expect(()=>validateWebhook(req,'ORD124')).toThrow();const bad=new Request(req.url,{headers:{'x-request-id':requestId,'x-signature':`ts=1,v1=${sig}`}});expect(()=>validateWebhook(bad,id)).toThrow()})
})

describe('controles adicionais de operação',()=>{
 it('soma variantes do mesmo produto ao aplicar o limite',async()=>{
  await pg.exec(`update products set max_per_order=3 where id='${prod}'`)
  await expect(priceCart(client(),{...cart(),items:[...cart().items,...cart().items]})).rejects.toThrow('Limite de unidades')
  await pg.exec(`update products set max_per_order=null where id='${prod}'`)
 })
 it('protege o link privado por token, validade e revogação',async()=>{
  const order=await persistOrder(client(),{...cart(),expectedTotalCents:6580,idempotencyKey:randomUUID(),name:'Pessoa Teste',phone:'16999999999',paymentMethod:'offline'})
  expect(await getTrackedOrder(order.reference,'0'.repeat(64),client())).toBeNull()
  expect((await getTrackedOrder(order.reference,order.token,client()))?.reference).toBe(order.reference)
  await pg.query('update order_access_tokens set expires_at=now()-interval \'1 second\' where order_id=(select id from orders where reference=$1)',[order.reference])
  expect(await getTrackedOrder(order.reference,order.token,client())).toBeNull()
  await pg.query('update order_access_tokens set expires_at=now()+interval \'1 day\',revoked_at=now() where order_id=(select id from orders where reference=$1)',[order.reference])
  expect(await getTrackedOrder(order.reference,order.token,client())).toBeNull()
 })
 it('impede produção online sem pagamento, mesmo com escrita direta',async()=>{
  const order=await persistOrder(client(),{...cart(),expectedTotalCents:6580,idempotencyKey:randomUUID(),name:'Pessoa Teste',phone:'16999999999',email:'teste@example.test',paymentMethod:'online'})
  await expect(pg.query("update orders set fulfillment_status='confirmado' where reference=$1",[order.reference])).rejects.toThrow('não aprovado')
 })
})
