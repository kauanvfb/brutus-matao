import type {MetadataRoute} from 'next'
export default function sitemap():MetadataRoute.Sitemap{if(process.env.SITE_APPROVED!=='true')return [];const base=process.env.APP_URL||'http://localhost:3000';return [{url:base,changeFrequency:'weekly',priority:1},{url:`${base}/cardapio`,changeFrequency:'daily',priority:.9}]}
