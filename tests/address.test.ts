import {describe,it,expect} from 'vitest'
import {normalizeCityName} from '@/lib/address/cep'

describe('normalização da cidade de entrega',()=>{
 it('ignora acentos, caixa e espaços extras',()=>{
  expect(normalizeCityName('  Matão  ')).toBe('matao')
  expect(normalizeCityName('SÃO   PAULO')).toBe('sao paulo')
 })
})
