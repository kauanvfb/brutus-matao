import {z} from 'zod'
import {startPayment} from '@/lib/payments/mercadopago'
import {OrderError} from '@/lib/orders/core'
export async function POST(req:Request){try{const data=z.object({reference:z.string().regex(/^BR-[A-F\d]{16}$/),token:z.string().regex(/^[a-f\d]{64}$/)}).parse(await req.json());return Response.json(await startPayment(data.reference,data.token),{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof OrderError?e.message:'Não foi possível iniciar o pagamento'},{status:e instanceof OrderError?e.status:422})}}
