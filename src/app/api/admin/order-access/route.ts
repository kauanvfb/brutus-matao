import {z} from 'zod'
import {requireStaffApi} from '@/lib/auth/staff'
import {tx} from '@/lib/db/pool'
export async function POST(req:Request){
 const auth=await requireStaffApi(req,true,true);if('error'in auth)return auth.error
 try{const {id}=z.object({id:z.uuid()}).parse(await req.json());await tx(async client=>{
  const result=await client.query('update order_access_tokens set revoked_at=now() where order_id=$1 and revoked_at is null returning order_id',[id])
  if(result.rows.length)await client.query("insert into staff_audit_events(actor_id,action,order_id) values($1,'revoke_order_access',$2)",[auth.staff.id,id])
 });return Response.json({ok:true})}catch{return Response.json({error:'Não foi possível revogar o link.'},{status:422})}
}
