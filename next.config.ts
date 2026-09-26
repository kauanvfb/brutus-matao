import type {NextConfig} from 'next'
const host=process.env.NEXT_PUBLIC_SUPABASE_URL?new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname:null
const config:NextConfig={images:{remotePatterns:host?[{protocol:'https',hostname:host,pathname:'/storage/v1/object/public/brutus-public/**'}]:[]}}
export default config
