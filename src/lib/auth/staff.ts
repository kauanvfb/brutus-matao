import 'server-only'
import {cookies,headers} from 'next/headers'
import {createServerClient} from '@supabase/ssr'
import {db} from '@/lib/db/pool'
import {redirect} from 'next/navigation'
export type Staff={id:string;role:'admin'|'operator';email:string}
export async function getStaff():Promise<Staff|null>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key||!process.env.DATABASE_URL)return null
 const jar=await cookies();const supabase=createServerClient(url,key,{cookies:{getAll(){return jar.getAll()},setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}}}})
 const {data:{user},error}=await supabase.auth.getUser();if(error||!user)return null
 const role=await db().query<{role:'admin'|'operator'}>('select role from staff_members where user_id=$1 and active',[user.id]);if(!role.rows[0])return null
 return {id:user.id,role:role.rows[0].role,email:user.email||''}
}
export async function requireStaff(admin=false){const staff=await getStaff();if(!staff)redirect('/admin/login');if(admin&&staff.role!=='admin')redirect('/admin');return staff}
export async function requireStaffApi(req:Request,admin=false,mutate=false){const staff=await getStaff();if(!staff||admin&&staff.role!=='admin')return {error:Response.json({error:'Acesso negado'},{status:403})} as const
 if(mutate){const origin=(await headers()).get('origin');const configured=process.env.APP_URL;if(!origin||!configured||new URL(origin).origin!==new URL(configured).origin)return {error:Response.json({error:'Origem inválida'},{status:403})} as const}
 return {staff} as const
}
