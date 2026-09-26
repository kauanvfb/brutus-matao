import {SavedOrders} from '@/components/order/SavedOrders'
export const metadata={title:'Meus pedidos',robots:{index:false,follow:false}}
export default function OrdersPage(){return <div className="order-page wrap"><span className="kicker">BRUTUS / PEDIDOS</span><h1>Seus links.</h1><p>Somente os pedidos salvos neste navegador aparecem aqui. Seu telefone não libera acesso a pedidos.</p><SavedOrders/></div>}
