'use client'

import {useRouter} from 'next/navigation'
import {createBrowserClient} from '@supabase/ssr'

export function CustomerSignOut(){
  const router=useRouter()

  async function signOut(){
    const supabase=createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.auth.signOut()

    router.push('/')
    router.refresh()
  }

  return(
    <button
      onClick={signOut}
      className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
    >
      Sair da conta
    </button>
  )
}