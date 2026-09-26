import nextEnv from '@next/env'
import {Pool} from 'pg'
nextEnv.loadEnvConfig(process.cwd())
let missing=false
for(const key of ['DATABASE_URL','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','TRACKING_SECRET','APP_URL']){
 const configured=Boolean(process.env[key])&&(key!=='TRACKING_SECRET'||process.env[key].length>=32)
 console.log(`${configured?'OK':'PENDENTE'}: ${key}`);if(!configured)missing=true
}
if(process.env.PAYMENT_MODE==='test')for(const key of ['MP_TEST_ACCESS_TOKEN','MP_WEBHOOK_SECRET']){const ready=!!process.env[key];console.log(`${ready?'OK':'PENDENTE'}: ${key}`);if(!ready)missing=true}
else console.log('INFO: pagamento sandbox não habilitado; nenhuma cobrança será testada.')
if(process.env.DATABASE_URL){let pool;try{
 const hostname=new URL(process.env.DATABASE_URL).hostname
 pool=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:6000,ssl:['localhost','127.0.0.1','::1'].includes(hostname)?false:{rejectUnauthorized:true}})
 const result=await pool.query("select count(*)::int n from pg_tables where schemaname='public' and tablename in ('orders','payments','staff_members','staff_audit_events') and rowsecurity")
 if(result.rows[0].n!==4){console.log('PENDENTE: aplicar migrations e confirmar RLS.');missing=true}else console.log('OK: banco acessível e tabelas críticas com RLS.')
 const staff=await pool.query("select count(*)::int n from staff_members where role='admin' and active")
 if(!staff.rows[0].n){console.log('PENDENTE: administrador autorizado.');missing=true}else console.log('OK: administrador cadastrado.')
 }catch{console.log('PENDENTE: conexão, migrations ou permissões do banco.');missing=true}finally{await pool?.end()}}
console.log('Aprovação da marca, conta comercial e webhook externo exigem validação humana e teste de ponta a ponta.')
process.exitCode=missing?1:0
