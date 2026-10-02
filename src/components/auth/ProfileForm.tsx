'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'

function formatPhone(value:string){
  let digits=value.replace(/\D/g,'')

  // Se já vier com 55 salvo no banco, remove para formatar
  if(digits.startsWith('55')){
    digits=digits.slice(2)
  }

  // DDD + celular/telefone
  digits=digits.slice(0,11)

  const ddd=digits.slice(0,2)
  const first=digits.slice(2,7)
  const last=digits.slice(7,11)

  if(!digits){
    return '+55 '
  }

  if(digits.length<=2){
    return `+55 (${ddd}`
  }

  if(digits.length<=7){
    return `+55 (${ddd}) ${digits.slice(2)}`
  }

  return `+55 (${ddd}) ${first}-${last}`
}

export function ProfileForm({
  initialName,
  initialPhone
}:{
  initialName:string
  initialPhone:string
}){
  const router=useRouter()

  const [editing,setEditing]=useState(false)
  const [name,setName]=useState(initialName)
  const [phone,setPhone]=useState(
  formatPhone(initialPhone)
)
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')

  async function save(){
  setLoading(true)
  setMessage('')

  try{
    const res=await fetch('/api/profile',{
      method:'PATCH',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        name,
        phone
      })
    })

    const data=await res.json()

    if(!res.ok){
      setMessage(
        data.error||
        'Não foi possível salvar.'
      )
      return
    }

    setMessage('Dados atualizados.')
    setEditing(false)

    router.refresh()
  }catch(error){
    console.error(error)

    setMessage(
      'Não foi possível salvar. Tente novamente.'
    )
  }finally{
    setLoading(false)
  }
}

  if(!editing){
    return(
      <button
        onClick={()=>setEditing(true)}
        className="mt-6 rounded-full bg-[#D97732] px-6 py-3 font-semibold text-white"
      >
        Editar perfil
      </button>
    )
  }

  return(
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="grid gap-5">

        <label className="grid gap-2">
          <span className="text-sm opacity-70">
            Nome
          </span>

          <input
            value={name}
            onChange={e=>setName(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm opacity-70">
            Telefone
          </span>

          <input
  type="tel"
  inputMode="numeric"
  value={phone}
  onChange={e=>
    setPhone(
      formatPhone(e.target.value)
    )
  }
  placeholder="+55 (16) 99999-9999"
  maxLength={19}
  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
/>
</label>

        {message&&(
          <p className="text-sm opacity-70">
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">

          <button
            onClick={save}
            disabled={loading}
            className="rounded-full bg-[#D97732] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading?'Salvando...':'Salvar alterações'}
          </button>

          <button
            onClick={()=>setEditing(false)}
            disabled={loading}
            className="rounded-full border border-white/15 px-6 py-3 font-semibold"
          >
            Cancelar
          </button>

        </div>
      </div>
    </div>
  )
}