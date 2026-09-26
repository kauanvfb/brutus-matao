'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Menu,X,ShoppingBag} from 'lucide-react'
import {useCart} from '@/components/cart/CartProvider'
export function Header({ordersOpen,logo}:{ordersOpen:boolean;logo:string|null}){
 const pathname=usePathname()
 const [scrolled,setScrolled]=useState(false),[open,setOpen]=useState(false);const {lines,setDrawer}=useCart()
 useEffect(()=>{const onScroll=()=>setScrolled(scrollY>48);onScroll();addEventListener('scroll',onScroll,{passive:true});return()=>removeEventListener('scroll',onScroll)},[])
 const links=[['Início','/'],['Cardápio','/cardapio'],['A Brutus','/#sobre'],['Como pedir','/#como-pedir'],['Contato','/#contato']]
 return <header className={`header ${scrolled||pathname!=='/'?'header-solid':''}`}><div className="header-inner wrap"><Link className="wordmark" href="/" onClick={()=>setOpen(false)} aria-label="Brutus Matão, início">{logo?<img src={logo} alt="Brutus Matão"/>:<><span>BRUTUS<span className="mark-dot">.</span></span><small>MATÃO / SP</small></>}</Link>
  <nav className="desktop-nav" aria-label="Navegação principal">{links.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav>
  <div className="header-end"><Link className="header-order" href={ordersOpen?'/cardapio':'/cardapio'}>{ordersOpen?'Fazer pedido':'Ver cardápio'} <span aria-hidden>↗</span></Link><button className="icon-button cart-trigger" aria-label={`Abrir carrinho (${lines.length} itens)`} onClick={()=>setDrawer(true)}><ShoppingBag size={21}/>{lines.length>0&&<span className="cart-count">{lines.reduce((a,l)=>a+l.quantity,0)}</span>}</button><button className="icon-button mobile-toggle" aria-label={open?'Fechar menu':'Abrir menu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div>
  {open&&<nav className="mobile-nav" aria-label="Navegação móvel">{links.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}<span aria-hidden>↗</span></Link>)}</nav>}</header>
}
