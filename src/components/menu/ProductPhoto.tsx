import Image from 'next/image'
import {localProductImages,menuPhotos,portionPhotos} from '@/data/catalog'
/** Uses the local product photo first, with the supplied menu crop as fallback. */
export function ProductPhoto({productId,url,name}:{productId:string;url:string|null;name:string}){
  const crop=menuPhotos[productId]
  const portionCrop=portionPhotos[productId]
  const clipId=`product-crop-${productId}`
  const imageUrl=url||localProductImages[productId]
  if(imageUrl)return <div className="product-photo-image"><Image src={imageUrl} alt={name} fill sizes="(max-width:600px) 100vw, 33vw"/></div>
  if(portionCrop)return <div className="portion-photo-crop"><svg viewBox={portionCrop.join(' ')} role="img" aria-label={name} preserveAspectRatio="xMidYMid meet"><defs><clipPath id={clipId}><rect x={portionCrop[0]} y={portionCrop[1]} width={portionCrop[2]} height={portionCrop[3]}/></clipPath></defs><image href="/images/porcoes/porcoes-original.png" width="337" height="101" clipPath={`url(#${clipId})`}/></svg></div>
  if(crop)return <div className="menu-photo-crop"><svg viewBox={crop.join(' ')} role="img" aria-label={name} preserveAspectRatio="xMidYMid meet"><defs><clipPath id={clipId}><rect x={crop[0]} y={crop[1]} width={crop[2]} height={crop[3]}/></clipPath></defs><image href="/images/cardapio-original.png" width="412" height="844" clipPath={`url(#${clipId})`}/></svg></div>
  return <div className="photo-placeholder"><span>BRUTUS</span><small>FOTO EM BREVE</small></div>
}
