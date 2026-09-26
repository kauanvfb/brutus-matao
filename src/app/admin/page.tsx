import {requireStaff} from '@/lib/auth/staff'
import {AdminShell} from '@/components/admin/AdminShell'
import {db} from '@/lib/db/pool'
import {getPublicData} from '@/lib/db/public'
import Link from 'next/link'
import {money} from '@/lib/config/defaults'
export const dynamic='force-dynamic'
export default async function Admin(){
 const staff=await requireStaff()
 const [overview,publicData]=await Promise.all([db().query(`select count(*) total,count(*) filter(where payment_status='pending' and fulfillment_status<>'cancelado') pending,coalesce(sum(total_cents) filter(where payment_status='approved' and fulfillment_status='concluido'),0) paid,coalesce(avg(total_cents) filter(where payment_status='approved' and fulfillment_status='concluido'),0) average,count(*) filter(where fulfillment_status in ('novo','confirmado','em_preparo') and (payment_status='approved' or payment_method='offline')) active from orders where created_at>=(date_trunc('day',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo')`),getPublicData()])
 const x=overview.rows[0]
 return <AdminShell staff={staff} title="Visão geral"><p className="admin-intro">Hoje em Matão · {publicData.settings.orders_open?'Pedidos abertos no horário cadastrado':'Pedidos fechados agora'}. Receita e ticket consideram somente pedidos pagos e concluídos.</p><div className="admin-stat-grid"><div><span>Pedidos hoje</span><strong>{x.total}</strong></div><div><span>Ativos de hoje</span><strong>{x.active}</strong></div><div><span>Pendentes de hoje</span><strong>{x.pending}</strong></div><div><span>Receita de hoje</span><strong>{money(Number(x.paid))}</strong></div><div><span>Ticket médio de hoje</span><strong>{money(Math.round(Number(x.average)))}</strong></div></div><div className="admin-welcome"><h2>Operação da loja.</h2><p>Pedidos online só avançam após confirmação oficial do pagamento. A lista de pedidos também inclui os dias anteriores.</p><Link className="button button-accent" href="/admin/pedidos">Abrir pedidos ↗</Link></div></AdminShell>
}
