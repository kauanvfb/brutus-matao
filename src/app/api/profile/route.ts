import {cookies} from 'next/headers'
import {createServerClient} from '@supabase/ssr'
import {z} from 'zod'

import {db} from '@/lib/db/pool'

const profileSchema=z.object({
  name:z.string().trim().min(2,'Informe seu nome').max(100),
  phone:z.string().trim().min(8,'Informe um telefone válido').max(20)
})

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

export async function PATCH(req:Request){
  try{
    const user=await getCurrentUser()

    if(!user){
      return Response.json(
        {error:'Você precisa estar logado.'},
        {status:401}
      )
    }

    const data=profileSchema.parse(
      await req.json()
    )

const phoneDigits=data.phone.replace(/\D/g,'')

const nationalPhone=phoneDigits.startsWith('55')
  ? phoneDigits.slice(2)
  : phoneDigits

if(!/^\d{10,11}$/.test(nationalPhone)){
  return Response.json(
    {error:'Informe um telefone válido com DDD.'},
    {status:422}
  )
}

const normalizedPhone=`+55${nationalPhone}`

    await db().query(
      `
        insert into profiles(
          user_id,
          name,
          phone
        )
        values($1,$2,$3)

        on conflict(user_id)
        do update set
          name=excluded.name,
          phone=excluded.phone
      `,
      [
        user.id,
        data.name,
        normalizedPhone
      ]
    )

    return Response.json({
      ok:true
    })
  }catch(error){
    console.error(
      'Erro ao atualizar perfil',
      error
    )

    if(error instanceof z.ZodError){
      return Response.json(
        {
          error:
            error.issues[0]?.message||
            'Dados inválidos'
        },
        {status:422}
      )
    }

    return Response.json(
      {
        error:'Não foi possível atualizar o perfil.'
      },
      {status:500}
    )
  }
}