import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase em falta! Verifica o ficheiro .env')
  process.exit(1)
}

export const supabase = createClient(supabaseUrl, supabaseKey)
console.log('✅ Supabase ligado com sucesso!')

dotenv.config()

console.log('URL:', process.env.SUPABASE_URL)
console.log('KEY:', process.env.SUPABASE_KEY ? 'encontrada' : 'NÃO ENCONTRADA')