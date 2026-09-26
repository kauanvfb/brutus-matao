import {processNotification,validateWebhook} from '@/lib/payments/mercadopago'
import {OrderError} from '@/lib/orders/core'
export async function POST(req:Request){const dataId=new URL(req.url).searchParams.get('data.id')||'';try{const body=await req.json();if(!dataId||dataId!==body?.data?.id||!['order','orders_v2'].includes(body.type))return Response.json({error:'Evento inválido'},{status:400});validateWebhook(req,dataId)}catch{return Response.json({error:'Assinatura inválida'},{status:401})}
 try{await processNotification(dataId);return Response.json({received:true})}catch(e){console.error('Falha ao verificar notificação de pagamento',e);return Response.json({error:e instanceof OrderError?e.message:'Tente novamente'},{status:e instanceof OrderError?e.status:500})}}
