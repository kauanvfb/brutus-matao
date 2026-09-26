import {getPublicData} from '@/lib/db/public'
import {CartPreview} from '@/components/checkout/CartPreview'
import {CheckoutForm} from '@/components/checkout/CheckoutForm'
export const metadata={title:'Finalizar pedido',robots:{index:false,follow:false}}
export const dynamic='force-dynamic'
export default async function Checkout(){const data=await getPublicData();const paymentReady=!!process.env.MP_WEBHOOK_SECRET&&((process.env.PAYMENT_MODE==='test'&&!!process.env.MP_TEST_ACCESS_TOKEN)||(process.env.PAYMENT_MODE==='live'&&process.env.ENABLE_LIVE_PAYMENTS==='true'&&!!process.env.MP_ACCESS_TOKEN));return <div className="checkout-page wrap"><span className="kicker">BRUTUS / FINALIZAR</span><h1>Seu pedido.</h1>{data.preview?<CartPreview/>:<CheckoutForm settings={data.settings} paymentReady={paymentReady}/>}</div>}
