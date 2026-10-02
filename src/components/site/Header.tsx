'use client'

import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {usePathname,useRouter} from 'next/navigation'
import {
  Menu,
  X,
  ShoppingBag,
  UserRound,
  Package,
  LogOut,
  ChevronDown
} from 'lucide-react'
import {createBrowserClient} from '@supabase/ssr'

import {useCart} from '@/components/cart/CartProvider'

export function Header({
  ordersOpen,
  logo
}:{
  ordersOpen:boolean
  logo:string|null
}){
  const pathname=usePathname()
  const router=useRouter()

  const [scrolled,setScrolled]=useState(false)
  const [open,setOpen]=useState(false)
  const [accountOpen,setAccountOpen]=useState(false)
  const [logged,setLogged]=useState<boolean|null>(null)

  const accountRef=useRef<HTMLDivElement>(null)

  const [supabase]=useState(()=>{
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  })

  const {lines,setDrawer}=useCart()

  useEffect(()=>{
    const onScroll=()=>setScrolled(scrollY>48)

    onScroll()

    addEventListener(
      'scroll',
      onScroll,
      {passive:true}
    )

    return()=>{
      removeEventListener(
        'scroll',
        onScroll
      )
    }
  },[])

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>{
      setLogged(!!data.user)
    })

    const {
      data:{subscription}
    }=supabase.auth.onAuthStateChange(
      (_event,session)=>{
        setLogged(!!session?.user)
      }
    )

    return()=>{
      subscription.unsubscribe()
    }
  },[supabase])

  useEffect(()=>{
    function outside(event:MouseEvent){
      if(
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ){
        setAccountOpen(false)
      }
    }

    document.addEventListener('mousedown',outside)

    return()=>{
      document.removeEventListener('mousedown',outside)
    }
  },[])

  useEffect(()=>{
    setAccountOpen(false)
    setOpen(false)
  },[pathname])

  async function signOut(){
    await supabase.auth.signOut()

    setLogged(false)
    setAccountOpen(false)

    router.push('/')
    router.refresh()
  }

  const links=[
    ['Início','/'],
    ['Cardápio','/cardapio'],
    ['A Brutus','/#sobre'],
    ['Como pedir','/#como-pedir'],
    ['Contato','/#contato']
  ]

  return(
    <header
      className={`header ${
        scrolled||pathname!=='/'
          ?'header-solid'
          :''
      }`}
    >
      <div className="header-inner wrap">

        <Link
          className="wordmark"
          href="/"
          aria-label="Brutus Matão, início"
        >
          {logo?(
            <img
              src={logo}
              alt="Brutus Matão"
            />
          ):(
            <>
              <span>
                BRUTUS
                <span className="mark-dot">
                  .
                </span>
              </span>

              <small>
                MATÃO / SP
              </small>
            </>
          )}
        </Link>

        <nav
          className="desktop-nav"
          aria-label="Navegação principal"
        >
          {links.map(([label,href])=>(
            <Link
              key={href}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-end">

          {logged===false&&(
            <Link
              className="header-account"
              href="/entrar"
            >
              <UserRound size={17}/>
              Entrar
            </Link>
          )}

          {logged===true&&(
            <div
              className="account-menu"
              ref={accountRef}
            >
              <button
                className="header-account"
                onClick={()=>
                  setAccountOpen(v=>!v)
                }
                aria-expanded={accountOpen}
              >
                <UserRound size={17}/>

                Minha conta

                <ChevronDown
                  size={15}
                  className={
                    accountOpen
                      ?'account-chevron-open'
                      :''
                  }
                />
              </button>

              {accountOpen&&(
                <div className="account-dropdown">

                  <Link
                    href="/meus-pedidos"
                    className="account-dropdown-item"
                  >
                    <Package size={18}/>

                    <div>
                      <strong>
                        Meu pedido
                      </strong>

                      <small>
                        Acompanhar andamento
                      </small>
                    </div>
                  </Link>

                  <Link
                    href="/perfil"
                    className="account-dropdown-item"
                  >
                    <UserRound size={18}/>

                    <div>
                      <strong>
                        Meu perfil
                      </strong>

                      <small>
                        Dados da sua conta
                      </small>
                    </div>
                  </Link>

                  <div className="account-dropdown-line"/>

                  <button
                    className="account-dropdown-item account-logout"
                    onClick={signOut}
                  >
                    <LogOut size={18}/>

                    <div>
                      <strong>
                        Sair da conta
                      </strong>
                    </div>
                  </button>

                </div>
              )}
            </div>
          )}

          <Link
            className="header-order"
            href="/cardapio"
          >
            {ordersOpen
              ?'Fazer pedido'
              :'Ver cardápio'
            }

            <span aria-hidden>
              ↗
            </span>
          </Link>

          <button
            className="icon-button cart-trigger"
            aria-label={`Abrir carrinho (${lines.length} itens)`}
            onClick={()=>setDrawer(true)}
          >
            <ShoppingBag size={21}/>

            {lines.length>0&&(
              <span className="cart-count">
                {lines.reduce(
                  (a,l)=>a+l.quantity,
                  0
                )}
              </span>
            )}
          </button>

          <button
            className="icon-button mobile-toggle"
            aria-label={
              open
                ?'Fechar menu'
                :'Abrir menu'
            }
            aria-expanded={open}
            onClick={()=>setOpen(!open)}
          >
            {open?<X/>:<Menu/>}
          </button>

        </div>
      </div>

      {open&&(
        <nav
          className="mobile-nav"
          aria-label="Navegação móvel"
        >
          {links.map(([label,href])=>(
            <Link
              key={href}
              href={href}
              onClick={()=>setOpen(false)}
            >
              {label}

              <span aria-hidden>
                ↗
              </span>
            </Link>
          ))}

          {logged?(
            <>
              <Link
                href="/meus-pedidos"
                onClick={()=>setOpen(false)}
              >
                Meu pedido
                <span aria-hidden>↗</span>
              </Link>

              <Link
                href="/perfil"
                onClick={()=>setOpen(false)}
              >
                Meu perfil
                <span aria-hidden>↗</span>
              </Link>

              <button
                onClick={signOut}
              >
                Sair da conta
                <span aria-hidden>↗</span>
              </button>
            </>
          ):(
            <Link
              href="/entrar"
              onClick={()=>setOpen(false)}
            >
              Entrar
              <span aria-hidden>↗</span>
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}