import {beforeAll,afterAll,it,expect} from 'vitest'
import {PGlite} from '@electric-sql/pglite'
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto'
import {existsSync,readFileSync,readdirSync} from 'node:fs'
import {menuProducts} from '@/data/catalog'
let pg:PGlite
beforeAll(async()=>{
 pg=new PGlite({extensions:{pgcrypto}})
 await pg.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[])")
 for(const file of readdirSync('supabase/migrations').sort())await pg.exec(readFileSync(`supabase/migrations/${file}`,'utf8'))
 await pg.exec(readFileSync('supabase/cardapio-brutus.sql','utf8'))
},30000)
afterAll(async()=>{await pg?.close()})
it('importa os 12 lanches, 4 porções e 4 bebidas sem duplicar nem abrir pedidos ao repetir',async()=>{
 await pg.exec(readFileSync('supabase/cardapio-brutus.sql','utf8'))
 const products=await pg.query<{id:string;price_cents:number}>('select id,price_cents from products')
 expect(products.rows).toHaveLength(20)
 for(const p of menuProducts)expect(products.rows.find(row=>row.id===p.id)?.price_cents).toBe(p.price_cents)
 expect((await pg.query("select id from products where slug like 'combo-%'")).rows).toHaveLength(0)
 expect((await pg.query("select id from categories where slug='combos'")).rows).toHaveLength(0)
 expect((await pg.query("select id from categories where slug in ('lanches','porcoes','bebidas')")).rows).toHaveLength(3)
 expect((await pg.query("select product_id from product_option_groups where group_id='99ed29e5-ea9a-50dd-9992-6170500989d3'")).rows).toHaveLength(12)
 expect((await pg.query("select id from option_choices where group_id='99ed29e5-ea9a-50dd-9992-6170500989d3' and price_cents=500")).rows).toHaveLength(3)
 expect((await pg.query<{value:boolean}>("select value from site_settings where key='orders_open'")).rows[0].value).toBe(false)
})
it('integra as fotos dos lanches, porções e imagens simbólicas das bebidas',()=>{
 const burgers=menuProducts.filter(product=>product.category_id==='66b07f24-a0b1-5176-9040-1d90d9342c59')
 const withPhoto=burgers.filter(product=>product.image_url)
 expect(withPhoto).toHaveLength(10)
 for(const product of withPhoto)expect(existsSync(`public${product.image_url}`)).toBe(true)
 expect(burgers.filter(product=>!product.image_url).map(product=>product.slug)).toEqual(['brutus-junior','blend-caramelizado'])
 expect(existsSync('public/images/porcoes/porcoes-original.png')).toBe(true)
 for(const product of menuProducts.filter(product=>product.category_id==='262947bb-2e7d-5e13-a037-505a8cdba1be'))expect(existsSync(`public${product.image_url}`)).toBe(true)
})
