import type {Metadata,Viewport} from 'next'
import './globals.css'
import './premium.css'
import {CartProvider} from '@/components/cart/CartProvider'
import {Header} from '@/components/site/Header'
import {Footer} from '@/components/site/Footer'
import {getPublicData} from '@/lib/db/public'
export async function generateMetadata():Promise<Metadata>{const published=process.env.SITE_APPROVED==='true',s=(await getPublicData()).settings;return {metadataBase:new URL(process.env.APP_URL||'http://localhost:3000'),title:{default:'Brutus Matão | Hamburgueria em Matão — SP',template:'%s | Brutus Matão'},description:'Brutus Matão, hamburgueria em Matão — SP. Consulte o cardápio quando publicado e acompanhe seu pedido.',robots:{index:published,follow:published},referrer:'no-referrer',icons:published&&s.logo_url?{icon:s.logo_url}:undefined,openGraph:published?{title:'Brutus Matão | Hamburgueria em Matão — SP',description:'Conheça o cardápio da Brutus Matão.',type:'website',images:s.hero_image?[{url:s.hero_image}]:undefined}:undefined}}
export const viewport:Viewport={width:'device-width',initialScale:1}
export default async function RootLayout({children}:{children:React.ReactNode}){const data=await getPublicData();const s=data.settings;const structured=process.env.SITE_APPROVED==='true'&&s.address&&s.phone?{'@context':'https://schema.org','@type':'Restaurant',name:'Brutus Matão',url:process.env.APP_URL,address:{'@type':'PostalAddress',streetAddress:s.address,addressLocality:'Matão',addressRegion:'SP',addressCountry:'BR'},telephone:s.phone}:null;return <html lang="pt-BR"><body>{structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/>}<CartProvider preview={data.preview}><Header ordersOpen={s.orders_open} logo={s.logo_url}/><main>{children}</main><Footer settings={s}/></CartProvider></body></html>}
