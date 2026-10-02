'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
type Field={key:string;label:string;type?:'text'|'textarea'|'number'|'money'|'checkbox'|'date'|'time'|'select'|'image';options?:{value:string;label:string}[]}
type Entry=Record<string,unknown>
type Props={title:string;entity:string;rows:Entry[];fields:Field[];initial:Entry;allowCreate?:boolean;allowDelete?:boolean;deleteLabel?:string;entryLabelKey?:string;entryLabelMap?:Record<string,string>}

function identity(record:Entry){return record.id??record.key??record.mode??record.day_of_week??record.day??null}

export function EntityEditor({title,entity,rows,fields,initial,allowCreate=true,allowDelete=false,deleteLabel='Excluir registro',entryLabelKey,entryLabelMap}:Props){
 const router=useRouter(),[record,setRecord]=useState<Entry>(initial),[error,setError]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState('')
 const selected=identity(record)
 function change(key:string,value:unknown){setRecord(v=>({...v,[key]:value}));setError('')}
 const edit=(row:Entry)=>{setRecord({...row});setFile(null);setPreview('');setError('');setSuccess('')}
 function labelFor(row:Entry){
  if(entryLabelKey){const raw=row[entryLabelKey];const mapped=entryLabelMap?.[String(raw)];if(mapped)return mapped;if(raw!==undefined&&raw!==null)return String(raw)}
  return String(row.name??row.title??row.label??row.key??row.mode??row.day??row.day_of_week??row.id??'Registro')
 }
 async function remove(){
  if(selected===null)return
  if(!confirm(`Tem certeza que deseja ${deleteLabel.toLowerCase()}?`))return
  setBusy(true);setError('');setSuccess('')
  try{
   const response=await fetch('/api/admin/manage',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({entity,record})})
   const body=await response.json();if(!response.ok)throw Error(body.error||'Não foi possível excluir')
   edit(initial);setSuccess(body.deactivated?'Registro usado em pedidos antigos: foi desativado para preservar o histórico.':'Registro excluído.');router.refresh()
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setSuccess('');try{const next={...record};if(file){if(!next.approved)throw Error('Confirme a autorização da imagem antes de publicar');const form=new FormData();form.set('file',file);form.set('approved','true');const up=await fetch('/api/admin/media',{method:'POST',body:form});const data=await up.json();if(!up.ok)throw Error(data.error);next.url=data.url}
  const res=await fetch('/api/admin/manage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entity,record:next})}),body=await res.json();if(!res.ok)throw Error(body.error||'Falha ao salvar');setSuccess('Salvo no banco. Recarregando dados.');setFile(null);setPreview('');setRecord(body.record??next);router.refresh()}catch(err){setError((err as Error).message)}finally{setBusy(false)}}
 return <section className="admin-editor"><div className="admin-editor-head"><h2>{title}</h2>{allowCreate&&<button onClick={()=>edit(initial)}>+ Novo</button>}</div><div className="admin-editor-body"><div className="admin-entries">{rows.length?rows.map((r,i)=>{const rowId=identity(r);return <button key={String(rowId??i)} className={selected===rowId?'active':''} onClick={()=>edit(r)}><strong>{labelFor(r)}</strong><small>{r.approved===false?'Rascunho':r.active===false||r.enabled===false?'Inativo':'Editar'}</small></button>}):<p>Sem registros cadastrados.</p>}</div><form className="admin-form" onSubmit={save}>{Boolean(record.id)&&<span className="admin-id">ID: {String(record.id)}</span>}{fields.map(f=><label className="input-field" key={f.key}>{f.label}{f.type==='checkbox'?<input type="checkbox" checked={Boolean(record[f.key])} onChange={e=>change(f.key,e.target.checked)}/>:f.type==='select'?<select value={String(record[f.key]??'')} onChange={e=>change(f.key,e.target.value)}>{(f.options||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:f.type==='textarea'?<textarea value={String(record[f.key]??'')} onChange={e=>change(f.key,e.target.value)}/>:f.type==='image'?<><input type="url" placeholder="URL HTTPS da imagem aprovada" value={String(record[f.key]??'')} onChange={e=>change(f.key,e.target.value)}/><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{const nextFile=e.target.files?.[0]||null;setFile(nextFile);if(nextFile)setPreview(URL.createObjectURL(nextFile))}}/>{(preview||record[f.key])&&<img className="admin-image-preview" alt="Prévia da imagem selecionada" src={String(preview||record[f.key])}/>}<small>Para enviar arquivo, marque “Aprovado” e confirme que a Brutus autorizou a publicação.</small></>:<input type={f.type==='money'||f.type==='number'?'number':f.type||'text'} step={f.type==='money'?'0.01':f.type==='number'?'1':undefined} value={f.type==='money'?Number(record[f.key]||0)/100:String(record[f.key]??'')} onChange={e=>change(f.key,f.type==='money'?Math.round(Number(e.target.value)*100):f.type==='number'?(e.target.value===''?null:Number(e.target.value)):e.target.value)}/>}</label>)}{error&&<p className="field-error" role="alert">{error}</p>}{success&&<p role="status">{success}</p>}<button disabled={busy} className="button button-accent">{busy?'Salvando…':'Salvar alterações ↗'}</button>{entity==='product_option_groups'&&<button type="button" disabled={busy} className="button button-outline" onClick={remove}>Remover vínculo selecionado</button>}{allowDelete&&selected!==null&&<button type="button" disabled={busy} className="button button-outline" onClick={remove}>{deleteLabel}</button>}</form></div></section>
}
