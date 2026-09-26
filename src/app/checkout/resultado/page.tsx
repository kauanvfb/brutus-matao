import Link from 'next/link'
import {Result} from '@/components/order/Result'
export const metadata={title:'Retorno do pagamento',robots:{index:false,follow:false}}
export default async function ResultPage({searchParams}:{searchParams:Promise<{ref?:string;retorno?:string}>}){const params=await searchParams;return <div className="order-page wrap"><span className="kicker">BRUTUS / PAGAMENTO</span><h1>Pagamento em verificação.</h1><p>A volta ao site não confirma a cobrança. O estado verdadeiro aparece no acompanhamento após a notificação do provedor.</p><Result reference={params.ref||''}/><Link href="/cardapio" className="text-link">Ir para o cardápio ↗</Link></div>}
