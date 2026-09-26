import {describe,expect,it} from 'vitest'
import {BRUTUS_WHATSAPP_NUMBER,buildWhatsAppOrderMessage,whatsappUrl} from '@/lib/whatsapp'

describe('pedido pelo WhatsApp',()=>{
 it('usa o número oficial informado',()=>{
  expect(BRUTUS_WHATSAPP_NUMBER).toBe('5516993165102')
  expect(whatsappUrl()).toBe('https://wa.me/5516993165102')
 })
 it('monta o resumo do carrinho com cliente, entrega e pagamento',()=>{
  const message=buildWhatsAppOrderMessage([{
   key:'produto:',productId:'produto',quantity:2,choices:[],name:'Brutus Brabo',imageUrl:null,unitPriceCents:4200,choiceLabels:['Bacon'],notes:'Remover cebola'
  }],{customerName:'Kauan',fulfillment:'delivery',address:'Rua Teste, 100, Centro',reference:'Perto da praça',payment:'Pix',notes:'Tocar a campainha'})
  expect(message).toContain('*2x Brutus Brabo* — R$ 84,00')
  expect(message).toContain('Opções: Bacon')
  expect(message).toContain('Observação: Remover cebola')
  expect(message).toContain('*Cliente:* Kauan')
  expect(message).toContain('*Recebimento:* Entrega')
  expect(message).toContain('*Endereço:* Rua Teste, 100, Centro')
  expect(message).toContain('*Ponto de referência:* Perto da praça')
  expect(message).toContain('*Pagamento:* Pix')
  expect(message).toContain('*Observações:* Tocar a campainha')
  expect(decodeURIComponent(whatsappUrl(message))).toContain(message)
 })
})
