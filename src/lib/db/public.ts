import 'server-only'
import {db} from './pool'
import {menuCategories,menuProducts} from '@/data/catalog'
import {defaults} from '@/lib/config/defaults'
import type {PublicData, Product, SiteSettings} from '@/types'
export async function getPublicData():Promise<PublicData>{
 const preview=!process.env.DATABASE_URL&&process.env.SITE_APPROVED!=='true'
 const empty:PublicData={categories:preview?menuCategories:[],products:preview?menuProducts:[],settings:defaults,gallery:[],testimonials:[],configured:!!process.env.DATABASE_URL,preview,error:false}
 if(!process.env.DATABASE_URL)return empty
 try{
  const [settings,categories,products,groups,gallery,testimonials,operation]=await Promise.all([
   db().query<{key:keyof SiteSettings;value:unknown}>('select key,value from site_settings'),
   db().query('select id,name,slug,description from categories where active and approved order by sort_order,name'),
   db().query('select p.id,p.name,p.slug,p.description,p.price_cents,p.category_id,p.featured,p.available,p.max_per_order,(select url from product_images where product_id=p.id and approved order by sort_order limit 1) image_url from products p join categories c on c.id=p.category_id where p.active and p.approved and (p.available or p.show_when_unavailable) and c.active and c.approved order by p.sort_order,p.name'),
   db().query('select pog.product_id,g.id,g.title,g.min_select,g.max_select,coalesce(json_agg(json_build_object(\'id\',ch.id,\'label\',ch.label,\'price_cents\',ch.price_cents) order by ch.sort_order) filter (where ch.id is not null),\'[]\'::json) choices from product_option_groups pog join option_groups g on g.id=pog.group_id left join option_choices ch on ch.group_id=g.id and ch.active where g.active group by pog.product_id,g.id'),
   db().query('select id,url,caption from gallery_media where approved order by sort_order limit 12'),
   db().query('select id,author,quote,source,date::text from testimonials where approved order by date desc limit 6'),
   db().query(`select coalesce((select e.open and local_t::time>=e.opens_at and local_t::time<e.closes_at from opening_exceptions e where e.day=local_t::date),(select h.enabled and local_t::time>=h.opens_at and local_t::time<h.closes_at from opening_hours h where h.day_of_week=extract(dow from local_t)::int),false) accepting from (select now() at time zone 'America/Sao_Paulo' local_t) local_clock`)
  ])
  const s={...defaults};for(const row of settings.rows){if(row.key in s)(s as Record<string,unknown>)[row.key]=row.value}
  s.orders_open=Boolean(s.orders_open&&operation.rows[0]?.accepting)
  const map=new Map<string,Product['groups']>();for(const row of groups.rows){const v=map.get(row.product_id)||[];v.push({id:row.id,title:row.title,min_select:row.min_select,max_select:row.max_select,choices:row.choices});map.set(row.product_id,v)}
  return {settings:s,categories:categories.rows,products:products.rows.map(p=>({...p,groups:map.get(p.id)||[]})),gallery:gallery.rows,testimonials:testimonials.rows,configured:true,preview:false,error:false}
 }catch(error){console.error('Falha ao consultar conteúdo público',error);return {...empty,error:true}}
}
