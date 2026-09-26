import {requireStaff} from '@/lib/auth/staff'
import {AdminShell} from '@/components/admin/AdminShell'
import {OrdersPanel} from '@/components/admin/OrdersPanel'
export const dynamic='force-dynamic'
export default async function Orders(){const staff=await requireStaff();return <AdminShell staff={staff} title="Pedidos"><OrdersPanel/></AdminShell>}
