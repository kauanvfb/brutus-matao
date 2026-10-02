import 'server-only'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Pool, type PoolClient } from 'pg'

let pool: Pool | undefined

function getSsl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Banco não configurado')
  }

  const hostname = new URL(process.env.DATABASE_URL).hostname

  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    return false
  }

  const ca = readFileSync(
    join(process.cwd(), 'certs', 'supabase-ca.crt'),
    'utf8'
  )

  return {
    rejectUnauthorized: true,
    ca,
  }
}

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Banco não configurado')
  }

  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    ssl: getSsl(),
  })

  return pool
}

export async function tx<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await db().connect()

  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}