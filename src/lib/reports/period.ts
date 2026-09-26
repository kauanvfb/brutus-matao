export function reportPeriod(input:{from?:string;to?:string},now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
 const get=(type:string)=>parts.find(p=>p.type===type)?.value
 const today=`${get('year')}-${get('month')}-${get('day')}`
 const before=new Date(`${today}T12:00:00Z`);before.setUTCDate(before.getUTCDate()-29)
 const from=input.from||before.toISOString().slice(0,10),to=input.to||today
 for(const value of [from,to]){const date=new Date(`${value}T12:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw Error('Informe datas válidas.')}
 const days=(Date.parse(to)-Date.parse(from))/86400000
 if(days<0||days>365)throw Error('Escolha um período de até 366 dias, com início anterior ao fim.')
 return {from,to}
}
export const periodWhere="created_at >= ($1::date::timestamp at time zone 'America/Sao_Paulo') and created_at < (($2::date+1)::timestamp at time zone 'America/Sao_Paulo')"
