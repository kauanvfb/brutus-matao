import type {Category,OptionGroup,Product} from '@/types'
import source from './menu.json'
export const menuCategories:Category[]=source.categories
const extras:OptionGroup={
  id:'99ed29e5-ea9a-50dd-9992-6170500989d3',
  title:'Adicionais',
  min_select:0,
  max_select:3,
  choices:[
    {id:'86a4c38b-cc0a-5384-aad7-3cd574ddf06a',label:'Catupiry',price_cents:500},
    {id:'5a1c5f13-6911-5064-9da0-83df6d8590c0',label:'Cheddar',price_cents:500},
    {id:'f0e55552-2c4e-5c15-b9df-3b5a97af0ce1',label:'Bacon',price_cents:500}
  ]
}
export const menuProducts:Product[]=source.products.map(product=>({
  ...product,
  groups:product.category_id==='66b07f24-a0b1-5176-9040-1d90d9342c59'?[...product.groups,extras]:product.groups
}))
export const menuPhotos:Record<string,number[]>=source.photos
export const portionPhotos:Record<string,number[]>=source.portion_photos
export const localProductImages:Record<string,string>=Object.fromEntries(
  source.products
    .filter(product=>product.image_url)
    .map(product=>[product.id,product.image_url as string])
)
