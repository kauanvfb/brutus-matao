import {cookies} from 'next/headers'
import {redirect} from 'next/navigation'
import {createServerClient} from '@supabase/ssr'
import {ProfileForm} from '@/components/auth/ProfileForm'

import {db} from '@/lib/db/pool'

export const metadata={
  title:'Meu perfil',
  robots:{
    index:false,
    follow:false
  }
}

async function getCurrentUser(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if(!url||!key)return null

  const jar=await cookies()

  const supabase=createServerClient(url,key,{
    cookies:{
      getAll(){
        return jar.getAll()
      },
      setAll(values){
        try{
          values.forEach(({name,value,options})=>{
            jar.set(name,value,options)
          })
        }catch{}
      }
    }
  })

  const {
    data:{user},
    error
  }=await supabase.auth.getUser()

  if(error||!user)return null

  return user
}

export default async function ProfilePage(){
  const user=await getCurrentUser()

  if(!user){
    redirect('/entrar?redirect=/perfil')
  }

  const result=await db().query<{
    name:string|null
    phone:string|null
  }>(
    `
      select
        name,
        phone
      from profiles
      where user_id=$1
      limit 1
    `,
    [user.id]
  )

  const profile=result.rows[0]

  return(
    <main className="order-page wrap">
      <span className="kicker">
        BRUTUS / MINHA CONTA
      </span>

      <h1>
        Meu perfil.
      </h1>

      <p className="mt-3 max-w-xl opacity-70">
        Confira os dados vinculados à sua conta.
      </p>

      <div className="mt-8 grid gap-4">

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm opacity-60">
            Nome
          </p>

          <p className="mt-2 text-lg font-semibold">
            {profile?.name||'Não informado'}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm opacity-60">
            E-mail
          </p>

          <p className="mt-2 text-lg font-semibold">
            {user.email}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm opacity-60">
            Telefone
          </p>

          <p className="mt-2 text-lg font-semibold">
            {profile?.phone||'Não informado'}
          </p>
        </div>

      </div>
      <ProfileForm
  initialName={profile?.name||''}
  initialPhone={profile?.phone||''}
/>
    </main>
  )
}