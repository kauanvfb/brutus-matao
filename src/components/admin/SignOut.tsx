'use client'
import {createBrowserClient} from '@supabase/ssr'
export function SignOut(){return <button onClick={async()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(url&&key)await createBrowserClient(url,key).auth.signOut();location.assign('/admin/login')}}>Sair da conta ↗</button>}
