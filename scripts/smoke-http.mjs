import {spawn} from 'node:child_process'
const port='3127',origin=`http://127.0.0.1:${port}`
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{env:{...process.env,DATABASE_URL:'',NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_ANON_KEY:'',SITE_APPROVED:'false',PAYMENT_MODE:'disabled'},stdio:['ignore','pipe','pipe']})
let log='';child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b)
try{
 let ready=false
 for(let i=0;i<40;i++){if(child.exitCode!==null)throw Error('Servidor encerrou: '+log.slice(-1000));try{const res=await fetch(origin,{signal:AbortSignal.timeout(1500)});if(res.ok){ready=true;break}}catch{}await new Promise(resolve=>setTimeout(resolve,250))}
 if(!ready)throw Error('Servidor não iniciou no prazo.')
 for(const [path,status,method] of [['/',200,'GET'],['/cardapio',200,'GET'],['/checkout',200,'GET'],['/admin/login',200,'GET'],['/admin',307,'GET'],['/api/admin/orders',403,'GET'],['/api/orders',503,'POST'],['/api/quote',503,'POST'],['/api/webhooks/mercadopago',400,'POST'],['/api/webhooks/mercadopago?data.id=TEST',401,'POST'],['/videos/brutus-abertura.mp4',200,'HEAD'],['/images/cardapio-original.png',200,'HEAD']]){
  const res=await fetch(origin+path,{method,redirect:'manual',headers:method==='POST'?{'Content-Type':'application/json'}:undefined,body:method==='POST'?(path.includes('?data.id=')?JSON.stringify({type:'order',data:{id:'TEST'}}):'{}'):undefined})
  if(res.status!==status)throw Error(`${method} ${path}: esperado ${status}; recebido ${res.status}`)
  console.log(`OK ${method} ${path}: ${status}`)
 }
}finally{child.kill('SIGTERM')}
