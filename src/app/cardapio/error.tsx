'use client'
export default function Error({reset}:{error:Error;reset:()=>void}){return <div className="menu-page wrap"><div className="empty-state" role="alert"><h1>Cardápio indisponível.</h1><p>Não foi possível carregar esta página agora.</p><button className="button button-dark" onClick={reset}>Tentar novamente ↗</button></div></div>}
