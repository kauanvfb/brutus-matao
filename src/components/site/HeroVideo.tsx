'use client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {Pause,Play,ArrowDown} from 'lucide-react'
const source='/videos/brutus-abertura.mp4'
export function HeroVideo({headline}:{headline:string}){
  const video=useRef<HTMLVideoElement>(null),section=useRef<HTMLElement>(null),manuallyPaused=useRef(false)
  const [playing,setPlaying]=useState(false),[failed,setFailed]=useState(false)
  useEffect(()=>{
    const el=video.current,box=section.current;if(!el||!box)return
    const motion=matchMedia('(prefers-reduced-motion: reduce)');let visible=true,active=true
    const sync=()=>{if(!active)return;if(motion.matches||document.hidden||!visible||manuallyPaused.current){el.pause();return}if(!el.getAttribute('src'))el.src=source;void el.play().catch(()=>{})}
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()},{threshold:.1})
    observer.observe(box);motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync()
    return()=>{active=false;el.pause();observer.disconnect();motion.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync)}
  },[])
  function toggle(){const el=video.current;if(!el)return;if(!el.paused){manuallyPaused.current=true;el.pause()}else{manuallyPaused.current=false;if(!el.getAttribute('src'))el.src=source;void el.play().catch(()=>setPlaying(false))}}
  return <section ref={section} className="video-hero" aria-label="Brutus Matão">
    <div className="video-poster" aria-hidden="true"/>
    <video ref={video} className={failed?'hero-video video-failed':'hero-video'} muted loop playsInline preload="none" poster="/poster.webp" aria-hidden="true" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>{setFailed(true);setPlaying(false)}}/>
    <div className="hero-shade"/>
    <div className="hero-content wrap"><div className="hero-eyebrow"><span className="eyebrow-line"/>HAMBURGUERIA · MATÃO, SP</div><h1>{headline==='A fome pede Brutus.'?<>A fome pede<br/><em>Brutus.</em></>:headline}</h1><p>Da primeira vontade à última mordida. Sua próxima boa escolha começa aqui.</p><div className="hero-actions"><Link href="/cardapio" className="button button-accent">Ver cardápio <span aria-hidden="true">↗</span></Link><a href="#escolhas" className="hero-secondary">Escolhas da casa ↓</a></div></div>
    <div className="hero-footer wrap"><span>BRUTUS MATÃO · VÍDEO CONCEITUAL</span><div className="video-hero-controls"><button type="button" className="video-toggle" onClick={toggle} disabled={failed} aria-label={playing?'Pausar animação':'Reproduzir animação'}>{playing?<Pause size={15}/>:<Play size={15}/>}<span>{failed?'Vídeo indisponível':playing?'Pausar':'Reproduzir'}</span></button><a href="#sobre" className="hero-scroll" aria-label="Conheça a Brutus"><ArrowDown size={17}/></a></div></div>
  </section>
}
