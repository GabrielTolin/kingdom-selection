import express from 'express'
import { supabase } from '../supabase.js'

const router = express.Router()

// POST /api/ponto — registar entrada ou saída
router.post('/', async (req, res) => {
  const { funcionario_id, obra_id, tipo, latitude, longitude, precisao } = req.body

  if (!funcionario_id || !tipo) {
    return res.status(400).json({ error: 'funcionario_id e tipo são obrigatórios' })
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo deve ser "entrada" ou "saida"' })
  }

  const { data, error } = await supabase
    .from('registos_ponto')
    .insert([{ funcionario_id, obra_id, tipo, latitude, longitude, precisao }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// GET /api/ponto/:funcionario_id/hoje — registos de hoje de um funcionário
router.get('/:funcionario_id/hoje', async (req, res) => {
  const hoje = new Date().toISOString().split('T')[0]  // ex: "2026-04-29"

  const { data, error } = await supabase
    .from('registos_ponto')
    .select('*')
    .eq('funcionario_id', req.params.funcionario_id)
    .gte('hora', `${hoje}T00:00:00`)
    .lte('hora', `${hoje}T23:59:59`)
    .order('hora')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/ponto/obra/:obra_id/hoje — todos os registos de uma obra hoje
router.get('/obra/:obra_id/hoje', async (req, res) => {
  const hoje = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('registos_ponto')
    .select(`
      *,
      funcionarios ( id, nome, funcao )
    `)
    .eq('obra_id', req.params.obra_id)
    .gte('hora', `${hoje}T00:00:00`)
    .lte('hora', `${hoje}T23:59:59`)
    .order('hora')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router