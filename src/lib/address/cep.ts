import 'server-only'

export type CepAddress={postalCode:string;street:string;district:string;city:string;state:string}

export function normalizeCityName(value:string){
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ')
}

function cleanCep(value:string){const cep=value.replace(/\D/g,'');if(!/^\d{8}$/.test(cep))throw new Error('Informe um CEP válido com 8 dígitos');return cep}

async function viaCep(cep:string):Promise<CepAddress|null>{
 const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{cache:'no-store',signal:AbortSignal.timeout(4500)})
 if(!response.ok)return null
 const data=await response.json() as {erro?:boolean;cep?:string;logradouro?:string;bairro?:string;localidade?:string;uf?:string}
 if(data.erro||!data.localidade||!data.uf)return null
 return {postalCode:cep,street:data.logradouro||'',district:data.bairro||'',city:data.localidade,state:data.uf.toUpperCase()}
}

async function brasilApi(cep:string):Promise<CepAddress|null>{
 const response=await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`,{cache:'no-store',signal:AbortSignal.timeout(4500)})
 if(!response.ok)return null
 const data=await response.json() as {street?:string;neighborhood?:string;city?:string;state?:string}
 if(!data.city||!data.state)return null
 return {postalCode:cep,street:data.street||'',district:data.neighborhood||'',city:data.city,state:data.state.toUpperCase()}
}

export async function lookupCep(value:string):Promise<CepAddress>{
 const cep=cleanCep(value)
 try{const address=await viaCep(cep);if(address)return address}catch{}
 try{const address=await brasilApi(cep);if(address)return address}catch{}
 throw new Error('Não foi possível consultar este CEP agora. Confira o CEP e tente novamente.')
}
