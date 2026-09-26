import {getPublicData} from '@/lib/db/public'
import {Catalog} from '@/components/menu/Catalog'
export const dynamic='force-dynamic'
export const metadata={title:'Cardápio'}
export default async function MenuPage(){
 const data=await getPublicData()
 return <div className="menu-page"><div className="menu-heading wrap"><span className="kicker">BRUTUS / CARDÁPIO</span><h1>Escolha com<br/><em>vontade.</em></h1><p>Lanches de personalidade, preparados para matar a fome de verdade. Encontre sua próxima escolha.</p>{data.settings.notice&&<div className="notice">{data.settings.notice}</div>}{data.preview?<div className="notice">Prévia do pedido: explore os produtos e monte seu carrinho. A finalização ainda não está disponível.</div>:!data.settings.orders_open&&<div className="notice">Pedidos estão fechados no momento. Você ainda pode consultar o cardápio.</div>}<a href="/images/cardapio-original.png" target="_blank" rel="noreferrer" className="text-link menu-original-link">Ver cardápio enviado ↗</a></div><Catalog categories={data.categories} products={data.products} open={data.settings.orders_open||data.preview} error={data.error}/></div>
}
