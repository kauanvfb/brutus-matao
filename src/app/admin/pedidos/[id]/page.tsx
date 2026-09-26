import Link from 'next/link'
import {notFound} from 'next/navigation'
import {requireStaff} from '@/lib/auth/staff'
import {db} from '@/lib/db/pool'
import {money} from '@/lib/config/defaults'
import {AdminShell} from '@/components/admin/AdminShell'
import {RevokeAccess} from '@/components/admin/RevokeAccess'
import {PrintButton} from '@/components/admin/PrintButton'

export const dynamic='force-dynamic'
type Item={product_name:string;quantity:number;choices_snapshot:{label:string;price_cents:number}[];line_cents:number;notes:string|null}
type Event={status:string;internal_note:string|null;actor_id:string|null;created_at:string}
export default async function OrderDetail({params}:{params:Promise<{id:string}>}){
 const staff=await requireStaff();const {id}=await params
 if(!/^[0-9a-f-]{36}$/i.test(id))notFound()
 const [order,items,events]=await Promise.all([
  db().query('select * from orders where id=$1',[id]),
  db().query<Item>('select product_name,quantity,choices_snapshot,line_cents,notes from order_items where order_id=$1 order by id',[id]),
  db().query<Event>('select status,internal_note,actor_id,created_at from order_status_events where order_id=$1 order by created_at,id',[id])
 ])
 if(!order.rows[0])notFound();const o=order.rows[0],address=o.delivery_address as Record<string,string>|null
 return <AdminShell staff={staff} title="Ficha do pedido"><div className="admin-print-controls"><Link href="/admin/pedidos">← Voltar aos pedidos</Link><PrintButton/></div>{staff.role==='admin'&&<RevokeAccess id={id}/>}<article className="admin-print-sheet"><header><span className="kicker">BRUTUS MATÃO / PEDIDO</span><h2>{o.reference}</h2><p>{new Date(o.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · {o.fulfillment_method==='delivery'?'Entrega':'Retirada'} · {o.fulfillment_status}</p></header><div className="print-grid"><div><h3>Atendimento</h3><p>{o.customer_name}<br/>{o.customer_phone}</p>{address&&<p>{address.street}, {address.number}{address.complement?` · ${address.complement}`:''}<br/>{address.district} · {address.city} · {address.postalCode}{address.reference&&<><br/>Referência: {address.reference}</>}</p>}{o.notes&&<p>Observação: {o.notes}</p>}</div><div><h3>Pagamento</h3><p>{o.payment_method==='online'?'Online':'No atendimento'} · {o.payment_status}</p><p>Subtotal {money(o.subtotal_cents)}<br/>Taxa {money(o.delivery_fee_cents)}<br/><strong>Total {money(o.total_cents)}</strong></p></div></div><h3>Itens</h3>{items.rows.map((i,index)=><div className="print-item" key={index}><strong>{i.quantity} × {i.product_name}</strong><span>{money(i.line_cents)}</span>{i.choices_snapshot.length>0&&<small>{i.choices_snapshot.map(c=>c.label).join(' · ')}</small>}{i.notes&&<small>Obs.: {i.notes}</small>}</div>)}<h3>Histórico de produção</h3><ol className="print-events">{events.rows.map((e,index)=><li key={index}><time>{new Date(e.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</time> · {e.status}{e.actor_id&&<small> · equipe {e.actor_id.slice(0,8)}</small>}{e.internal_note&&<p>Nota interna: {e.internal_note}</p>}</li>)}</ol></article></AdminShell>
}
