import {cartSchema} from '@/lib/validations/order'
import {quote,OrderError} from '@/lib/orders/core'
export async function POST(req:Request){try{if(!process.env.DATABASE_URL)return Response.json({error:'Banco ainda não configurado'},{status:503});const input=cartSchema.parse(await req.json());const q=await quote(input);return Response.json(q,{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof OrderError?e.message:'Confira os dados do pedido'},{status:e instanceof OrderError?e.status:422})}}
