import {z} from 'zod'
import {db} from '@/lib/db/pool'
import {requireStaffApi} from '@/lib/auth/staff'
const uuid=z.uuid();const text=z.string().trim().min(1);const nonneg=z.number().int().min(0);const id=uuid.optional()
const schemas={
 categories:z.object({id,name:text.max(90),slug:z.string().regex(/^[a-z0-9-]{2,90}$/),description:z.string().max(500).nullable(),sort_order:z.number().int(),active:z.boolean(),approved:z.boolean()}),
 products:z.object({id,category_id:uuid,name:text.max(120),slug:z.string().regex(/^[a-z0-9-]{2,120}$/),description:z.string().max(1500),price_cents:nonneg.max(10000000),featured:z.boolean(),active:z.boolean(),approved:z.boolean(),available:z.boolean(),show_when_unavailable:z.boolean(),sort_order:z.number().int(),max_per_order:z.number().int().min(1).max(20).nullable()}),
 option_groups:z.object({id,title:text.max(80),min_select:nonneg.max(20),max_select:z.number().int().min(1).max(20),active:z.boolean(),sort_order:z.number().int()}),
 option_choices:z.object({id,group_id:uuid,label:text.max(80),price_cents:nonneg.max(10000000),active:z.boolean(),sort_order:z.number().int()}),
 product_option_groups:z.object({product_id:uuid,group_id:uuid,sort_order:z.number().int()}),
 product_images:z.object({id,product_id:uuid,url:z.url().startsWith('https://'),alt:text.max(160),approved:z.boolean(),sort_order:z.number().int()}),
 gallery_media:z.object({id,url:z.url().startsWith('https://'),caption:text.max(160),approved:z.boolean(),sort_order:z.number().int()}),
 testimonials:z.object({id,author:text.max(120),quote:text.max(1200),source:text.max(120),date:z.iso.date(),approved:z.boolean()}),
 opening_hours:z.object({day_of_week:z.number().int().min(0).max(6),opens_at:z.string().regex(/^\d\d:\d\d(:\d\d)?$/),closes_at:z.string().regex(/^\d\d:\d\d(:\d\d)?$/),enabled:z.boolean()}),
 opening_exceptions:z.object({day:z.iso.date(),open:z.boolean(),opens_at:z.string().regex(/^\d\d:\d\d$/).nullable(),closes_at:z.string().regex(/^\d\d:\d\d$/).nullable(),reason:z.string().max(300).nullable()}),
 service_modes:z.object({mode:z.enum(['pickup','delivery']),enabled:z.boolean(),minimum_cents:nonneg.max(10000000)}),
 delivery_areas:z.object({id,label:text.max(100),zip_start:z.number().int().min(1000000).max(99999999),zip_end:z.number().int().min(1000000).max(99999999),fee_cents:nonneg.max(1000000),active:z.boolean()}),
 site_settings:z.object({key:z.enum(['headline','intro','instagram','address','phone','hero_image','logo_url','orders_open','pickup_enabled','delivery_enabled','online_payment_enabled','offline_payment_enabled','notice']),value:z.unknown()})
}
type Entity=keyof typeof schemas
const keys=Object.keys(schemas) as Entity[]
export async function POST(req:Request){const auth=await requireStaffApi(req,true,true);if('error'in auth)return auth.error
 try{const payload=await req.json();const entity=payload.entity as Entity;if(!keys.includes(entity))throw Error('Entidade inválida');const data=schemas[entity].parse(payload.record) as Record<string,unknown>
 if(entity==='site_settings'){const key=data.key as string,v=data.value;if(key.endsWith('_enabled')||key==='orders_open'){if(typeof v!=='boolean')throw Error('Configuração deve ser booleana')}else if(!(typeof v==='string'||v===null))throw Error('Texto inválido');if(key==='instagram'&&v!=='https://www.instagram.com/brutusmatao/')throw Error('Confirme o perfil oficial antes de alterar');if(['hero_image','logo_url'].includes(key)&&v&&(!String(v).startsWith('https://')))throw Error('Imagem exige URL HTTPS')}
 if(['product_images','gallery_media'].includes(entity)||entity==='site_settings'&&['hero_image','logo_url'].includes(String(data.key))&&data.value){const imageUrl=String(entity==='site_settings'?data.value:data.url);const base=process.env.NEXT_PUBLIC_SUPABASE_URL;if(!base||!imageUrl.startsWith(`${base}/storage/v1/object/public/brutus-public/`))throw Error('Envie primeiro uma imagem aprovada pelo painel')}
 if(entity==='delivery_areas'&&Number(data.zip_start)>Number(data.zip_end))throw Error('Faixa de CEP inválida')
 if(entity==='option_groups'&&Number(data.min_select)>Number(data.max_select))throw Error('Mínimo acima do máximo')
 if(entity==='site_settings'&&data.key==='orders_open'&&data.value===true){const required=await db().query("select (select count(*) from products where active and approved and available) products,(select count(*) from service_modes where enabled) modes");if(!Number(required.rows[0].products)||!Number(required.rows[0].modes))throw Error('Publique produtos e habilite uma modalidade antes de abrir pedidos')}
 const columns=Object.keys(data).filter(k=>data[k]!==undefined);const primary=entity==='product_option_groups'?['product_id','group_id']:entity==='site_settings'?['key']:entity==='opening_hours'?['day_of_week']:entity==='opening_exceptions'?['day']:entity==='service_modes'?['mode']:['id'];const values=columns.map(k=>k==='value'?JSON.stringify(data[k]):data[k]);const conflict=columns.filter(c=>!primary.includes(c)).map(c=>`${c}=excluded.${c}`).join(',');if(!conflict)throw Error('Nada para salvar');const query=`insert into public.${entity}(${columns.join(',')}) values(${columns.map((_,i)=>`$${i+1}`).join(',')}) on conflict (${primary.join(',')}) do update set ${conflict} returning *`;const result=await db().query(query,values);return Response.json({record:result.rows[0]})
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Registro inválido'},{status:422})}
}

export async function DELETE(req:Request){const auth=await requireStaffApi(req,true,true);if('error'in auth)return auth.error
 try{const data=z.object({product_id:uuid,group_id:uuid}).parse(await req.json());await db().query('delete from product_option_groups where product_id=$1 and group_id=$2',[data.product_id,data.group_id]);return Response.json({ok:true})}catch{return Response.json({error:'Vínculo inválido'},{status:422})}
}
