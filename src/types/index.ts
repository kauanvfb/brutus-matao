export type Choice = {id:string;label:string;price_cents:number}
export type OptionGroup = {id:string;title:string;min_select:number;max_select:number;choices:Choice[]}
export type Product = {id:string;name:string;slug:string;description:string;price_cents:number;image_url:string|null;category_id:string;featured:boolean;available:boolean;max_per_order:number|null;groups:OptionGroup[]}
export type Category = {id:string;name:string;slug:string;description:string|null}
export type SiteSettings = {headline:string;intro:string;instagram:string;address:string|null;phone:string|null;hero_image:string|null;logo_url:string|null;orders_open:boolean;pickup_enabled:boolean;delivery_enabled:boolean;online_payment_enabled:boolean;offline_payment_enabled:boolean;notice:string|null}
export type CartLine = {key:string;productId:string;quantity:number;choices:string[];name:string;imageUrl:string|null;unitPriceCents:number;choiceLabels:string[];notes?:string}
export type PublicData = {categories:Category[];products:Product[];settings:SiteSettings;gallery:{id:string;url:string;caption:string}[];testimonials:{id:string;author:string;quote:string;source:string;date:string}[];configured:boolean;preview:boolean;error:boolean}
