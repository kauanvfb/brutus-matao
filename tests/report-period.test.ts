import {describe,it,expect} from 'vitest'
import {reportPeriod} from '@/lib/reports/period'
describe('períodos financeiros',()=>{
 it('usa o dia em São Paulo, mesmo quando UTC já mudou',()=>{expect(reportPeriod({},new Date('2026-09-26T01:00:00Z')).to).toBe('2026-09-25')})
 it('recusa datas inexistentes, período invertido e período excessivo',()=>{expect(()=>reportPeriod({from:'2026-02-30',to:'2026-03-02'})).toThrow();expect(()=>reportPeriod({from:'2026-09-25',to:'2026-09-20'})).toThrow();expect(()=>reportPeriod({from:'2020-01-01',to:'2026-01-01'})).toThrow()})
})
