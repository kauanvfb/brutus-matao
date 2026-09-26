import {requireStaff} from '@/lib/auth/staff'
import {db} from '@/lib/db/pool'
import {AdminShell} from '@/components/admin/AdminShell'
import {money} from '@/lib/config/defaults'
import {reportPeriod,periodWhere} from '@/lib/reports/period'
export const dynamic='force-dynamic'
export default async function Reports({searchParams}:{searchParams:Promise<{from?:string;to?:string}>}){
 const staff=await requireStaff(true),input=await searchParams
 let period;try{period=reportPeriod(input)}catch{return <AdminShell staff={staff} title="Relatórios"><p role="alert">Período inválido. Use datas válidas e um intervalo de até 366 dias.</p><a href="/admin/relatorios">Voltar aos últimos 30 dias</a></AdminShell>}
 const values=[period.from,period.to]
 const [totals,products]=await Promise.all([
  db().query(`select count(*) filter(where payment_status='approved' and fulfillment_status='concluido') completed,coalesce(sum(total_cents) filter(where payment_status='approved' and fulfillment_status='concluido'),0) revenue,count(*) filter(where fulfillment_status='cancelado') cancelled from orders where ${periodWhere}`,values),
  db().query(`select i.product_name,sum(i.quantity)::int units from order_items i join orders o on o.id=i.order_id where o.payment_status='approved' and o.fulfillment_status='concluido' and ${periodWhere} group by i.product_name order by units desc limit 30`,values)
 ])
 const t=totals.rows[0]
 return <AdminShell staff={staff} title="Relatórios"><form className="admin-toolbar" method="get"><label>De <input aria-label="Data inicial" type="date" name="from" defaultValue={period.from} required/></label><label>Até <input aria-label="Data final" type="date" name="to" defaultValue={period.to} required/></label><button className="button button-dark">Aplicar período</button></form><p className="admin-intro">Datas de criação em Matão. Receita = pedidos concluídos com pagamento aprovado. Pendentes, cancelados e estornados não entram no valor.</p><div className="admin-stat-grid"><div><span>Pagos e concluídos</span><strong>{t.completed}</strong></div><div><span>Receita definida</span><strong>{money(Number(t.revenue))}</strong></div><div><span>Ticket médio</span><strong>{money(Number(t.completed)?Math.round(Number(t.revenue)/Number(t.completed)):0)}</strong></div><div><span>Cancelados</span><strong>{t.cancelled}</strong></div></div><div className="admin-editor"><div className="admin-editor-head"><h2>Produtos vendidos</h2><a href={`/api/admin/report?from=${period.from}&to=${period.to}`}>Exportar CSV ↗</a></div><div className="admin-order-items">{products.rows.length?products.rows.map(p=><p key={p.product_name}>{p.product_name} — {p.units} unidades</p>):<p>Sem vendas válidas no período.</p>}</div></div></AdminShell>
}
