import {AdminLogin} from '@/components/admin/AdminLogin'
export const metadata={title:'Acesso da equipe',robots:{index:false,follow:false}}
export default function Login(){return <div className="login-page"><div className="login-card"><span className="kicker">ACESSO RESTRITO</span><h1>Equipe Brutus.</h1><p>Entre com uma conta criada e autorizada pela administração.</p><AdminLogin/></div></div>}
