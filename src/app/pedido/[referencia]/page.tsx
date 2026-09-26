import {Tracking} from '@/components/order/Tracking'
export const metadata={title:'Acompanhar pedido',robots:{index:false,follow:false}}
export default async function OrderPage({params,searchParams}:{params:Promise<{referencia:string}>;searchParams:Promise<{token?:string}>}){const [{referencia},{token}]=await Promise.all([params,searchParams]);return <div className="order-page wrap"><span className="kicker">BRUTUS / ACOMPANHAMENTO</span><h1>Seu pedido.</h1><Tracking reference={referencia} initialToken={token||''}/></div>}
