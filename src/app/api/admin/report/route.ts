import {requireStaffApi} from '@/lib/auth/staff'
import {db} from '@/lib/db/pool'
import {reportPeriod,periodWhere} from '@/lib/reports/period'
export async function GET(req:Request){
 const auth=await requireStaffApi(req,true);if('error'in auth)return auth.error
 try{const params=new URL(req.url).searchParams,period=reportPeriod({from:params.get('from')||undefined,to:params.get('to')||undefined})
 const rows=await db().query(`select reference,(created_at at time zone 'America/Sao_Paulo')::date::text as day,fulfillment_method,fulfillment_status,payment_status,total_cents from orders where ${periodWhere} order by created_at desc limit 5001`,[period.from,period.to])
 if(rows.rows.length>5000)return Response.json({error:'Mais de 5.000 pedidos. Reduza o período para exportar sem cortes.'},{status:422})
 const csv=['referencia,data,modalidade,status_pedido,status_pagamento,total_centavos',...rows.rows.map(r=>[r.reference,r.day,r.fulfillment_method,r.fulfillment_status,r.payment_status,r.total_cents].join(','))].join('\n')
 return new Response('\uFEFF'+csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="brutus-${period.from}-${period.to}.csv"`,'Cache-Control':'no-store'}})
 }catch{return Response.json({error:'Não foi possível exportar. Confira o período selecionado.'},{status:422})}
}
