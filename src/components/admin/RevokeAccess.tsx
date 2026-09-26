'use client'
import {useState} from 'react'
export function RevokeAccess({id}:{id:string}){const [message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 async function revoke(){if(!confirm('Invalidar o link privado deste pedido? O cliente perderá o acesso pelo link atual.'))return;setBusy(true);try{const response=await fetch('/api/admin/order-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(!response.ok)throw Error('Não foi possível revogar o link.');setMessage('Link revogado. A ação ficou registrada para auditoria.')}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <div className="admin-print-controls"><button className="button button-outline" disabled={busy} onClick={revoke}>Revogar link privado</button><p role="status">{message}</p></div>
}
