import express from 'express'
import { supabase } from '../supabase.js'

const router = express.Router()

// GET /api/recibos/:funcionario_id — listar recibos de um funcionário
router.get('/:funcionario_id', async (req, res) => {
  const { data, error } = await supabase
    .from('recibos')
    .select('*')
    .eq('funcionario_id', req.params.funcionario_id)
    .order('data_emissao', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/recibos — criar recibo
router.post('/', async (req, res) => {
  const { funcionario_id, mes, data_emissao, horas_trabalhadas, valor_hora, total, ficheiro_url } = req.body

  if (!funcionario_id || !mes) {
    return res.status(400).json({ error: 'funcionario_id e mes são obrigatórios' })
  }

  const { data, error } = await supabase
    .from('recibos')
    .insert([{ funcionario_id, mes, data_emissao, horas_trabalhadas, valor_hora, total, ficheiro_url }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// DELETE /api/recibos/:id — apagar recibo
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('recibos')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Recibo apagado com sucesso' })
})

export default router