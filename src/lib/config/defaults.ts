import type {SiteSettings} from '@/types'
export const defaults:SiteSettings = {headline:'A fome pede Brutus.',intro:'Mais que matar a fome: fazer da sua pausa o melhor momento do dia. Brutus, em Matão.',instagram:'https://www.instagram.com/brutusmatao/',address:null,phone:'(16) 99316-5102',hero_image:null,logo_url:null,orders_open:false,pickup_enabled:false,delivery_enabled:false,online_payment_enabled:false,offline_payment_enabled:false,notice:null}
export const money=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100)
