import type {CartLine} from '@/types'
import {money} from '@/lib/config/defaults'

export const BRUTUS_WHATSAPP_NUMBER='5516993165102'
export const BRUTUS_WHATSAPP_DISPLAY='(16) 99316-5102'

type OrderDetails={
  customerName:string
  fulfillment:'pickup'|'delivery'
  address?:string
  reference?:string
  payment:string
  notes?:string
}

const singleLine=(value:string)=>value.replace(/[\r\n]+/g,' ').trim()

export function buildWhatsAppOrderMessage(lines:CartLine[],details:OrderDetails){
  const subtotal=lines.reduce((sum,line)=>sum+line.unitPriceCents*line.quantity,0)
  const items=lines.map(line=>{
    const choices=line.choiceLabels.length?`\n   Opções: ${line.choiceLabels.map(singleLine).join(' · ')}`:''
    const notes=line.notes?.trim()?`\n   Observação: ${singleLine(line.notes)}`:''
    return `*${line.quantity}x ${singleLine(line.name)}* — ${money(line.unitPriceCents*line.quantity)}${choices}${notes}`
  }).join('\n\n')
  const fulfillment=details.fulfillment==='delivery'?'Entrega':'Retirada no local'
  return [
    'Olá, Brutus! Gostaria de fazer este pedido:',
    '',
    '*PEDIDO*',
    items,
    '',
    `*Subtotal estimado:* ${money(subtotal)}`,
    `*Cliente:* ${singleLine(details.customerName)}`,
    `*Recebimento:* ${fulfillment}`,
    details.fulfillment==='delivery'?`*Endereço:* ${singleLine(details.address||'')}`:'',
    details.fulfillment==='delivery'&&details.reference?.trim()?`*Ponto de referência:* ${singleLine(details.reference)}`:'',
    `*Pagamento:* ${singleLine(details.payment)}`,
    details.notes?.trim()?`*Observações:* ${singleLine(details.notes)}`:'',
    '',
    'Por favor, confirmem a disponibilidade, a taxa de entrega e o valor final.'
  ].filter(line=>line!==undefined&&line!==null).join('\n')
}

export function whatsappUrl(message?:string){
  const base=`https://wa.me/${BRUTUS_WHATSAPP_NUMBER}`
  return message?`${base}?text=${encodeURIComponent(message)}`:base
}
