import {cookies} from 'next/headers'
import {createServerClient} from '@supabase/ssr'

import {orderSchema} from '@/lib/validations/order'
import {createOrder,OrderError} from '@/lib/orders/core'

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

export async function POST(req:Request){
  try{
    if(!process.env.DATABASE_URL){
      return Response.json(
        {error:'Banco ainda não configurado'},
        {status:503}
      )
    }

    const user=await getCurrentUser()

    if(!user){
      return Response.json(
        {error:'Entre na sua conta para finalizar o pedido.'},
        {status:401}
      )
    }

    const data=orderSchema.parse(await req.json())

    return Response.json(
      await createOrder(data,user.id),
      {
        status:201,
        headers:{'Cache-Control':'no-store'}
      }
    )
  }catch(e){
    console.error('Falha na criação do pedido',e)

    return Response.json(
      {
        error:e instanceof OrderError
          ? e.message
          : 'Pedido não foi criado. Revise os campos e tente novamente.'
      },
      {
        status:e instanceof OrderError?e.status:422
      }
    )
  }
}