import Link from 'next/link'
import {cookies} from 'next/headers'
import {redirect} from 'next/navigation'
import {createServerClient} from '@supabase/ssr'
import {CustomerSignOut} from '@/components/auth/CustomerSignOut'

import {db} from '@/lib/db/pool'

export const metadata={
  title:'Meu pedido',
  robots:{
    index:false,
    follow:false
  }
}

const statusLabel:Record<string,string>={
  novo:'Pedido recebido',
  confirmado:'Pedido confirmado',
  em_preparo:'Em preparo',
  pronto_para_retirada:'Pronto para retirada',
  saiu_para_entrega:'Saiu para entrega',
  concluido:'Concluído',
  cancelado:'Cancelado'
}

const paymentLabel:Record<string,string>={
  pending:'Pendente',
  approved:'Pago',
  rejected:'Recusado',
  cancelled:'Cancelado',
  refunded:'Estornado'
}

function money(value:number){
  return new Intl.NumberFormat('pt-BR',{
    style:'currency',
    currency:'BRL'
  }).format(value/100)
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

type ActiveOrder={
  reference:string
  customer_name:string
  fulfillment_method:string
  fulfillment_status:string
  payment_status:string
  total_cents:number
  created_at:string
}

export default async function OrdersPage(){
  const user=await getCurrentUser()

  if(!user){
    redirect('/entrar?redirect=/meus-pedidos')
  }

  const result=await db().query<ActiveOrder>(
    `
      select
        reference,
        customer_name,
        fulfillment_method,
        fulfillment_status,
        payment_status,
        total_cents,
        created_at
      from orders
      where customer_id=$1
        and fulfillment_status not in ('concluido','cancelado')
      order by created_at desc
      limit 1
    `,
    [user.id]
  )

  const order=result.rows[0]

  return(
    <main className="order-page wrap">
      <span className="kicker">
        BRUTUS / MEU PEDIDO
      </span>
<div className="mt-4">
  <CustomerSignOut/>
</div>
      <h1>
        Seu pedido.
      </h1>

      {!order?(
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold">
            Nenhum pedido em andamento
          </h2>

          <p className="mt-3 opacity-70">
            Quando você fizer um pedido, o andamento dele aparecerá aqui.
          </p>

          <Link
            href="/cardapio"
            className="mt-6 inline-flex rounded-full bg-[#D97732] px-6 py-3 font-semibold text-white"
          >
            Ver cardápio
          </Link>
        </div>
      ):(
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-6">
            <p className="text-sm opacity-60">
              Pedido
            </p>

            <h2 className="mt-1 text-2xl font-semibold">
              {order.reference}
            </h2>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="text-sm opacity-60">
                Status
              </p>

              <p className="mt-1 font-semibold">
                {statusLabel[order.fulfillment_status]||
                  order.fulfillment_status}
              </p>
            </div>

            <div>
              <p className="text-sm opacity-60">
                Pagamento
              </p>

              <p className="mt-1 font-semibold">
                {paymentLabel[order.payment_status]||
                  order.payment_status}
              </p>
            </div>

            <div>
              <p className="text-sm opacity-60">
                Modalidade
              </p>

              <p className="mt-1 font-semibold">
                {order.fulfillment_method==='pickup'
                  ? 'Retirada'
                  : 'Entrega'}
              </p>
            </div>

            <div>
              <p className="text-sm opacity-60">
                Total
              </p>

              <p className="mt-1 font-semibold">
                {money(order.total_cents)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/10 p-6">
            <Link
              href={`/pedido/${order.reference}`}
              className="inline-flex rounded-full bg-[#D97732] px-6 py-3 font-semibold text-white"
            >
              Acompanhar pedido
            </Link>

            <Link
              href="/cardapio"
              className="inline-flex rounded-full border border-white/15 px-6 py-3 font-semibold"
            >
              Ver cardápio
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}