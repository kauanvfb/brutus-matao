'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
export function SavedOrders(){const [links,setLinks]=useState<{reference:string;token:string}[]>([]);useEffect(()=>{const handle=requestAnimationFrame(()=>{const saved=Object.keys(localStorage).filter(k=>/^brutus-order-BR-[A-F\d]{16}$/.test(k)).map(k=>({reference:k.replace('brutus-order-',''),token:localStorage.getItem(k)||''}));setLinks(saved)});return()=>cancelAnimationFrame(handle)},[]);return <div className="saved-links">{links.length?links.map(l=><Link key={l.reference} href={`/pedido/${l.reference}?token=${l.token}`}>{l.reference} ↗</Link>):<p>Não há links salvos neste navegador. Guarde o endereço recebido ao finalizar o pedido.</p>}</div>}
