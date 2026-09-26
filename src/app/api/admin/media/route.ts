import {randomUUID} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
import sharp from 'sharp'
import {requireStaffApi} from '@/lib/auth/staff'
export async function POST(req:Request){const auth=await requireStaffApi(req,true,true);if('error'in auth)return auth.error
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return Response.json({error:'Storage do projeto não configurado'},{status:503})
 const form=await req.formData(),file=form.get('file'),approved=form.get('approved');if(!(file instanceof File)||file.size>10*1024*1024||!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||approved!=='true')return Response.json({error:'Selecione uma imagem autorizada de até 10 MB'},{status:422})
 try{const buffer=Buffer.from(await file.arrayBuffer()),processed=await sharp(buffer,{limitInputPixels:50_000_000}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();const path=`approved/${randomUUID()}.webp`;const supabase=createClient(url,key,{auth:{persistSession:false}});const {error}=await supabase.storage.from('brutus-public').upload(path,processed,{contentType:'image/webp',upsert:false});if(error)return Response.json({error:'Falha ao enviar imagem'},{status:502});return Response.json({url:supabase.storage.from('brutus-public').getPublicUrl(path).data.publicUrl})}catch{return Response.json({error:'Arquivo de imagem inválido ou não processável'},{status:422})}}
