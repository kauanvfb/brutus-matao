import 'server-only'
import {Pool, type PoolClient} from 'pg'
let pool:Pool|undefined
export function db(){if(!process.env.DATABASE_URL)throw new Error('Banco não configurado');pool??=new Pool({connectionString:process.env.DATABASE_URL,max:8,ssl:['localhost','127.0.0.1','::1'].includes(new URL(process.env.DATABASE_URL).hostname)?false:{rejectUnauthorized:true}});return pool}
export async function tx<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T>{const client=await db().connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
