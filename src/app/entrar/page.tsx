'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Modo = 'entrar' | 'cadastro'

export default function EntrarPage() {
  const router = useRouter()

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  const [modo, setModo] = useState<Modo>('entrar')
  const [aguardandoCodigo, setAguardandoCodigo] = useState(false)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  function limparAvisos() {
    setErro('')
    setMensagem('')
  }

  function trocarModo(novoModo: Modo) {
    setModo(novoModo)
    setAguardandoCodigo(false)
    setCodigo('')
    limparAvisos()
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    limparAvisos()
    setCarregando(true)

    try {
      if (modo === 'cadastro') {
        if (!nome.trim()) {
          throw new Error('Informe seu nome.')
        }

        if (!telefone.trim()) {
          throw new Error('Informe seu telefone.')
        }

        if (senha.length < 8) {
          throw new Error('A senha precisa ter pelo menos 8 caracteres.')
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: {
              name: nome.trim(),
              phone: telefone.trim(),
            },
          },
        })

        if (error) {
          throw error
        }

        if (data.session) {
          router.push('/')
          router.refresh()
          return
        }

        setAguardandoCodigo(true)
        setMensagem(
          `Enviamos um código de confirmação para ${email.trim()}.`
        )

        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      })

      if (error) {
        throw error
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível continuar.'
      )
    } finally {
      setCarregando(false)
    }
  }

  async function confirmarCodigo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    limparAvisos()
    setCarregando(true)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: codigo.trim(),
        type: 'email',
      })

      if (error) {
        throw error
      }

      setMensagem('E-mail confirmado com sucesso.')

      router.push('/')
      router.refresh()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Código inválido ou expirado.'
      )
    } finally {
      setCarregando(false)
    }
  }

  async function reenviarCodigo() {
    limparAvisos()
    setCarregando(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      })

      if (error) {
        throw error
      }

      setMensagem('Enviamos um novo código para seu e-mail.')
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível reenviar o código.'
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#171512] px-4 py-12 text-[#171512]">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-[#F3E9D9]/70 transition hover:text-[#F3E9D9]"
        >
          ← Voltar para a Brutus
        </Link>

        <section className="bg-[#F3E9D9] p-7 shadow-2xl sm:p-9">
          {aguardandoCodigo ? (
            <>
              <div className="mb-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#D97732]">
                  Brutus Matão
                </p>

                <h1 className="text-4xl font-black uppercase leading-none">
                  Confirmar e-mail
                </h1>

                <p className="mt-3 text-sm text-[#171512]/65">
                  Digite o código que enviamos para:
                </p>

                <p className="mt-1 break-all text-sm font-bold">
                  {email}
                </p>
              </div>

              <form onSubmit={confirmarCodigo} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase">
                    Código de confirmação
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={codigo}
                    onChange={(event) =>
                      setCodigo(event.target.value.replace(/\D/g, ''))
                    }
                    placeholder="Digite o código"
                    maxLength={8}
                    required
                    autoFocus
                    className="w-full border border-[#171512]/25 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.35em] outline-none transition focus:border-[#D97732]"
                  />
                </div>

                {erro && (
                  <div className="border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erro}
                  </div>
                )}

                {mensagem && (
                  <div className="border border-[#D97732]/40 bg-[#D97732]/10 px-4 py-3 text-sm">
                    {mensagem}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#D97732] px-5 py-4 font-black uppercase tracking-wide transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? 'Confirmando...' : 'Confirmar cadastro'}
                </button>

                <button
                  type="button"
                  disabled={carregando}
                  onClick={reenviarCodigo}
                  className="w-full border border-[#171512]/25 px-5 py-3 text-sm font-bold uppercase transition hover:bg-[#171512]/5 disabled:opacity-50"
                >
                  Reenviar código
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAguardandoCodigo(false)
                    setCodigo('')
                    limparAvisos()
                  }}
                  className="w-full text-sm text-[#171512]/60 underline"
                >
                  Corrigir meu e-mail
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#D97732]">
                  Brutus Matão
                </p>

                <h1 className="text-4xl font-black uppercase leading-none">
                  {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
                </h1>

                <p className="mt-3 text-sm text-[#171512]/65">
                  {modo === 'entrar'
                    ? 'Entre para fazer e acompanhar seu pedido.'
                    : 'Crie sua conta para fazer e acompanhar seus pedidos.'}
                </p>
              </div>

              <div className="mb-7 grid grid-cols-2 border border-[#171512]/20">
                <button
                  type="button"
                  onClick={() => trocarModo('entrar')}
                  className={`px-4 py-3 text-sm font-bold uppercase transition ${
                    modo === 'entrar'
                      ? 'bg-[#171512] text-[#F3E9D9]'
                      : 'hover:bg-[#171512]/5'
                  }`}
                >
                  Entrar
                </button>

                <button
                  type="button"
                  onClick={() => trocarModo('cadastro')}
                  className={`px-4 py-3 text-sm font-bold uppercase transition ${
                    modo === 'cadastro'
                      ? 'bg-[#171512] text-[#F3E9D9]'
                      : 'hover:bg-[#171512]/5'
                  }`}
                >
                  Criar conta
                </button>
              </div>

              <form onSubmit={enviar} className="space-y-4">
                {modo === 'cadastro' && (
                  <>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase">
                        Nome
                      </label>

                      <input
                        type="text"
                        value={nome}
                        onChange={(event) => setNome(event.target.value)}
                        placeholder="Seu nome"
                        autoComplete="name"
                        required
                        className="w-full border border-[#171512]/25 bg-white px-4 py-3 outline-none transition focus:border-[#D97732]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase">
                        Telefone
                      </label>

                      <input
                        type="tel"
                        value={telefone}
                        onChange={(event) => setTelefone(event.target.value)}
                        placeholder="(16) 99999-9999"
                        autoComplete="tel"
                        required
                        className="w-full border border-[#171512]/25 bg-white px-4 py-3 outline-none transition focus:border-[#D97732]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                    autoComplete="email"
                    required
                    className="w-full border border-[#171512]/25 bg-white px-4 py-3 outline-none transition focus:border-[#D97732]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase">
                    Senha
                  </label>

                  <input
                    type="password"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    autoComplete={
                      modo === 'entrar'
                        ? 'current-password'
                        : 'new-password'
                    }
                    minLength={8}
                    required
                    className="w-full border border-[#171512]/25 bg-white px-4 py-3 outline-none transition focus:border-[#D97732]"
                  />
                </div>

                {erro && (
                  <div className="border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erro}
                  </div>
                )}

                {mensagem && (
                  <div className="border border-[#D97732]/40 bg-[#D97732]/10 px-4 py-3 text-sm">
                    {mensagem}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#D97732] px-5 py-4 font-black uppercase tracking-wide transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando
                    ? 'Aguarde...'
                    : modo === 'entrar'
                      ? 'Entrar'
                      : 'Criar minha conta'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-[#171512]/50">
                Sua conta será usada para identificar e acompanhar seus pedidos.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  )
}