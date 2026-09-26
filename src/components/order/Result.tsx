'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
export function Result({reference}:{reference:string}){const [token,setToken]=useState('');useEffect(()=>{const handle=requestAnimationFrame(()=>setToken(localStorage.getItem(`brutus-order-${reference}`)||''));return()=>cancelAnimationFrame(handle)},[reference]);return token?<Link className="button button-accent" href={`/pedido/${reference}?token=${token}`}>Ver estado do pedido ↗</Link>:<p>Abra o link privado entregue na confirmação do pedido para acompanhar.</p>}
