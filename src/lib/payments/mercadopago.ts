import 'server-only'
import {WebhookSignatureValidator} from 'mercadopago'
import {tx} from '@/lib/db/pool'
import {OrderError,tokenHash} from '@/lib/orders/core'

const mode=()=>process.env.PAYMENT_MODE||'disabled'
function accessToken(){const value=mode()==='test'?process.env.MP_TEST_ACCESS_TOKEN:mode()==='live'&&process.env.ENABLE_LIVE_PAYMENTS==='true'?process.env.MP_ACCESS_TOKEN:null;if(!value)throw new OrderError('Credenciais de pagamento não configuradas',503);return value}
const format=(cents:number)=>(cents/100).toFixed(2)
export function cents(value:string|number){const raw=String(value);if(!/^\d+(\.\d{1,2})?$/.test(raw))throw new OrderError('Valor devolvido pelo provedor inválido',502);const [whole,fraction='']=raw.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'))}
type MpOrder={id:string;external_reference:string;status:string;status_detail:string;total_amount:string;total_paid_amount:string;currency:string;checkout_url?:string;last_updated_date?:string}
async function mp(path:string,init?:RequestInit):Promise<MpOrder>{const response=await fetch(`https://api.mercadopago.com${path}`,{...init,headers:{accept:'application/json',Authorization:`Bearer ${accessToken()}`,...init?.headers},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new OrderError(`Provedor de pagamento indisponível (${response.status})`,502);return response.json()}
export async function startPayment(reference:string,token:string){return tx(async client=>{
 const r=await client.query<{id:string;reference:string;payment_method:string;payment_status:string;total_cents:number;customer_email:string;provider_order_id:string|null;checkout_url:string|null;provider_idempotency_key:string}>(`select o.id,o.reference,o.payment_method,o.payment_status,o.total_cents,o.customer_email,p.provider_order_id,p.checkout_url,p.provider_idempotency_key from orders o join payments p on p.order_id=o.id join order_access_tokens t on t.order_id=o.id where o.reference=$1 and o.fulfillment_status<>'cancelado' and t.token_hash=$2 and t.revoked_at is null and t.expires_at>now() for update of p`,[reference,tokenHash(token)]);if(!r.rows.length)throw new OrderError('Link de pedido inválido ou expirado',404)
 const p=r.rows[0];if(p.payment_method!=='online'||p.payment_status!=='pending')throw new OrderError('Este pedido não aceita iniciar pagamento',409)
 if(p.checkout_url)return {url:p.checkout_url}
 if(!p.customer_email)throw new OrderError('Email ausente',422)
 const origin=process.env.APP_URL;if(!origin)throw new OrderError('Origem do site não configurada',503)
 const back=(outcome:string)=>`${origin}/checkout/resultado?ref=${encodeURIComponent(reference)}&retorno=${outcome}`
 const body={type:'online',processing_mode:'manual',total_amount:format(p.total_cents),external_reference:reference,payer:{email:p.customer_email},items:[{title:`Pedido ${reference}`,unit_price:format(p.total_cents),quantity:1,unit_measure:'unit',total_amount:format(p.total_cents)}],config:{online:{success_url:back('aprovado'),failure_url:back('recusado'),pending_url:back('pendente'),auto_return:'approved'}}}
 const created=await mp('/v1/orders',{method:'POST',headers:{'Content-Type':'application/json','X-Idempotency-Key':p.provider_idempotency_key},body:JSON.stringify(body)})
 if(created.external_reference!==reference||created.currency!=='BRL'||cents(created.total_amount)!==p.total_cents||!created.checkout_url||!/^https:\/\/(www\.)?mercadopago\.com\.br\//.test(created.checkout_url))throw new OrderError('Resposta de pagamento não confere com o pedido',502)
 await client.query('update payments set provider_order_id=$1,checkout_url=$2,updated_at=now() where order_id=$3',[created.id,created.checkout_url,p.id]);return {url:created.checkout_url}
})}
export function validateWebhook(req:Request,dataId:string){if(!process.env.MP_WEBHOOK_SECRET)throw new OrderError('Webhook não configurado',503);WebhookSignatureValidator.validate({xSignature:req.headers.get('x-signature'),xRequestId:req.headers.get('x-request-id'),dataId,secret:process.env.MP_WEBHOOK_SECRET,toleranceSeconds:300})}
export function providerState(status:string,detail:string){if(status==='processed'&&detail==='accredited')return 'approved';if(status==='refunded'||detail==='refunded'||detail==='partially_refunded')return 'refunded';if(status==='failed')return 'rejected';if(status==='canceled')return 'cancelled';return 'pending'}
export async function processNotification(providerOrderId:string){const official=await mp(`/v1/orders/${encodeURIComponent(providerOrderId)}`);if(official.id!==providerOrderId||official.currency!=='BRL')throw new OrderError('Dados divergentes do provedor',502)
 return tx(client=>applyOfficialPayment(client,official))
}
export async function applyOfficialPayment(client:import('pg').PoolClient,official:MpOrder){if(official.currency!=='BRL')throw new OrderError('Moeda inválida',502);const r=await client.query<{id:string;order_id:string;amount_cents:number;reference:string;payment_status:string}>(`select p.id,p.order_id,p.amount_cents,o.reference,o.payment_status from payments p join orders o on o.id=p.order_id where p.provider_order_id=$1 and p.provider='mercadopago' for update of p`,[official.id]);if(!r.rows.length)throw new OrderError('Pedido do provedor desconhecido',404);const row=r.rows[0];if(row.reference!==official.external_reference||cents(official.total_amount)!==row.amount_cents)throw new OrderError('Referência ou valor divergente',502)
 const state=providerState(official.status,official.status_detail);if(state==='approved'&&cents(official.total_paid_amount)!==row.amount_cents)throw new OrderError('Valor pago não confere',502)
 const eventId=`${official.id}:${official.status}:${official.status_detail}:${official.last_updated_date||''}`
 await client.query('insert into payment_events(payment_id,provider_event_id,provider_status) values($1,$2,$3) on conflict (provider_event_id) do nothing',[row.id,eventId,`${official.status}/${official.status_detail}`])
 if(row.payment_status!==state){await client.query('update payments set status=$1,updated_at=now() where id=$2',[state,row.id]);await client.query('update orders set payment_status=$1 where id=$2',[state,row.order_id])}
 return {state}
}
