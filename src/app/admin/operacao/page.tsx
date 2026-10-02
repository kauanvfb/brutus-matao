import {requireStaff} from '@/lib/auth/staff'
import {db} from '@/lib/db/pool'
import {AdminShell} from '@/components/admin/AdminShell'
import {EntityEditor} from '@/components/admin/EntityEditor'
import {SettingsPanel} from '@/components/admin/SettingsPanel'
export const dynamic='force-dynamic'

const weekdayNames:Record<string,string>={'0':'Domingo','1':'Segunda-feira','2':'Terça-feira','3':'Quarta-feira','4':'Quinta-feira','5':'Sexta-feira','6':'Sábado'}
const ufOptions=['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(value=>({value,label:value}))

export default async function Operations(){
 const staff=await requireStaff(true)
 const [hours,exceptions,modes,areas,settings]=await Promise.all(['opening_hours','opening_exceptions','service_modes','delivery_areas','site_settings'].map(t=>db().query(`select * from ${t} order by ${t==='opening_hours'?'day_of_week':t==='opening_exceptions'?'day':t==='service_modes'?'mode':t==='site_settings'?'key':'coalesce(city,label)'}`)))
 const hourRows=Array.from({length:7},(_,day)=>{const row=hours.rows.find(r=>Number(r.day_of_week)===day);return row?{...row,opens_at:String(row.opens_at).slice(0,5),closes_at:String(row.closes_at).slice(0,5)}:{day_of_week:day,opens_at:'18:00',closes_at:'23:00',enabled:false}})
 return <AdminShell staff={staff} title="Operação"><p className="admin-intro">Defina quando a Brutus recebe pedidos, quais modalidades estão ativas e uma taxa fixa por cidade atendida.</p>
  <SettingsPanel rows={settings.rows.filter(r=>['orders_open','pickup_enabled','delivery_enabled','online_payment_enabled','offline_payment_enabled','address','notice'].includes(r.key))}/>
  <EntityEditor title="Modalidades" entity="service_modes" rows={modes.rows} initial={{mode:'pickup',enabled:false,minimum_cents:0}} fields={[{key:'mode',label:'Modalidade',type:'select',options:[{value:'pickup',label:'Retirada'},{value:'delivery',label:'Entrega'}]},{key:'enabled',label:'Ativa',type:'checkbox'},{key:'minimum_cents',label:'Valor mínimo (R$)',type:'money'}]}/>
  <EntityEditor title="Horários da semana" entity="opening_hours" rows={hourRows} initial={{day_of_week:0,opens_at:'18:00',closes_at:'23:00',enabled:false}} allowCreate={false} entryLabelKey="day_of_week" entryLabelMap={weekdayNames} fields={[{key:'opens_at',label:'Abre às',type:'time'},{key:'closes_at',label:'Fecha às',type:'time'},{key:'enabled',label:'Aberto neste dia',type:'checkbox'}]}/>
  <EntityEditor title="Exceções de horário" entity="opening_exceptions" rows={exceptions.rows} initial={{day:new Date().toISOString().slice(0,10),open:false,opens_at:null,closes_at:null,reason:null}} allowDelete deleteLabel="Excluir exceção" fields={[{key:'day',label:'Data',type:'date'},{key:'open',label:'Aberto nesta data',type:'checkbox'},{key:'opens_at',label:'Abre às (se aberto)',type:'time'},{key:'closes_at',label:'Fecha às (se aberto)',type:'time'},{key:'reason',label:'Aviso interno'}]}/>
  <EntityEditor title="Cidades e taxas de entrega" entity="delivery_areas" rows={areas.rows} initial={{city:'Matão',state:'SP',fee_cents:0,active:true}} allowDelete deleteLabel="Excluir cidade" fields={[{key:'city',label:'Cidade'},{key:'state',label:'UF',type:'select',options:ufOptions},{key:'fee_cents',label:'Taxa fixa de entrega (R$)',type:'money'},{key:'active',label:'Ativa',type:'checkbox'}]}/>
 </AdminShell>
}
