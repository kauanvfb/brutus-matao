import {lookupCep} from '@/lib/address/cep'

export async function POST(req:Request){
 try{
  const body=await req.json() as {cep?:unknown}
  if(typeof body.cep!=='string')return Response.json({error:'Informe o CEP'},{status:422})
  return Response.json(await lookupCep(body.cep),{headers:{'Cache-Control':'no-store'}})
 }catch(error){
  return Response.json({error:error instanceof Error?error.message:'Não foi possível consultar o CEP'},{status:422})
 }
}
