'use client'
import {useEffect, useRef} from 'react'
export function Reveal({children}:{children:React.ReactNode}) {
  const root=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const nodes=root.current?.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.08})
    nodes?.forEach(node=>{node.classList.add('reveal-ready');observer.observe(node)})
    return ()=>{observer.disconnect();nodes?.forEach(node=>node.classList.remove('reveal-ready'))}
  },[])
  return <div ref={root}>{children}</div>
}
