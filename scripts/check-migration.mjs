import {readFileSync,readdirSync} from 'node:fs'
import {PGlite} from '@electric-sql/pglite'
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto'
const db=new PGlite({extensions:{pgcrypto}})
try{
 await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);")
 for(const file of readdirSync('supabase/migrations').sort())await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'))
 const seed=readFileSync('supabase/seed.dev.sql','utf8')
 try{await db.exec(seed);throw Error('Seed was allowed without opt-in')}catch(e){if(e.message==='Seed was allowed without opt-in')throw e}
 await db.exec("set app.brutus_environment='development'")
 await db.exec(seed)
 const categories=await db.query('select count(*)::int as count from categories where approved');if(categories.rows[0].count!==0)throw Error('Demo category was public')
 const existing=await db.query("select count(*)::int as count from categories where slug='demo-lanches'");if(existing.rows[0].count!==1)throw Error('Dev seed did not insert')
 await db.exec("set role anon")
 const hidden=await db.query('select count(*)::int as count from categories');if(hidden.rows[0].count!==0)throw Error('RLS leaked unapproved category')
 try{await db.query('select * from orders');throw Error('Guest could read orders')}catch(e){if(e.message==='Guest could read orders')throw e}
 try{await db.query("insert into staff_members(user_id,role) values('aaaaaaaa-0000-4000-8000-000000000001','admin')");throw Error('Guest could create admin')}catch(e){if(e.message==='Guest could create admin')throw e}
 await db.exec('reset role')
 await db.exec("update categories set approved=true where slug='demo-lanches'; update products set approved=true where slug='demo-lanche-de-teste'; set role anon")
 const visible=await db.query('select name from products');if(visible.rows.length!==1)throw Error('Approved product not public')
 await db.exec('reset role')
 await db.exec("insert into auth.users(id) values('bbbbbbbb-0000-4000-8000-000000000001'),('bbbbbbbb-0000-4000-8000-000000000002'); insert into staff_members(user_id,role) values('bbbbbbbb-0000-4000-8000-000000000002','admin'); insert into orders(reference,idempotency_key,request_hash,customer_id,customer_name,customer_phone,fulfillment_method,payment_method,subtotal_cents,total_cents) values('BR-CLIENTE0000001',gen_random_uuid(),'hash','bbbbbbbb-0000-4000-8000-000000000001','Cliente A','16999999999','pickup','offline',0,0),('BR-CLIENTE0000002',gen_random_uuid(),'hash','bbbbbbbb-0000-4000-8000-000000000002','Cliente B','16999999999','pickup','offline',0,0)")
 await db.exec("set request.jwt.claim.sub='bbbbbbbb-0000-4000-8000-000000000001'; set role authenticated")
 const own=await db.query('select reference from orders');if(own.rows.length!==1||own.rows[0].reference!=='BR-CLIENTE0000001')throw Error('Customer could see another order')
 try{await db.query('select internal_note from order_status_events');throw Error('Customer could read internal notes')}catch(e){if(e.message==='Customer could read internal notes')throw e}
 const staff=await db.query('select * from staff_members');if(staff.rows.length!==0)throw Error('Ordinary user could see staff record')
 try{await db.query("update staff_members set role='admin'");throw Error('Ordinary user could mutate staff')}catch(e){if(e.message==='Ordinary user could mutate staff')throw e}
 await db.exec('reset role')
 console.log('Migration SQL, isolated seed, RLS guest reads/writes: passed')
}finally{await db.close()}
