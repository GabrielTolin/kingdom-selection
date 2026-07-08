import express from 'express'
import { supabase } from '../supabase.js'

const router = express.Router()

// POST /api/ponto — registar entrada ou saída (hora opcional: permite inserção manual)
router.post('/', async (req, res) => {
  const { funcionario_id, obra_id, tipo, latitude, longitude, precisao, hora } = req.body

  if (!funcionario_id || !tipo) {
    return res.status(400).json({ error: 'funcionario_id e tipo são obrigatórios' })
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo deve ser "entrada" ou "saida"' })
  }

  const registo = { funcionario_id, obra_id, tipo, latitude, longitude, precisao }
  if (hora) registo.hora = hora   // inserção manual; sem hora, usa o default now() da DB

  const { data, error } = await supabase
    .from('registos_ponto')
    .insert([registo])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/ponto/:id — editar uma marcação (hora, tipo ou obra)
router.put('/:id', async (req, res) => {
  const campos = {}
  for (const chave of ['tipo', 'hora', 'obra_id']) {
    if (req.body[chave] !== undefined) campos[chave] = req.body[chave]
  }
  if (campos.tipo && !['entrada', 'saida'].includes(campos.tipo)) {
    return res.status(400).json({ error: 'tipo deve ser "entrada" ou "saida"' })
  }

  const { data, error } = await supabase
    .from('registos_ponto')
    .update(campos)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/ponto/:id — apagar uma marcação
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('registos_ponto')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Marcação apagada com sucesso' })
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

// GET /api/ponto/:funcionario_id/data/:data — registos de um funcionário num dia (YYYY-MM-DD)
router.get('/:funcionario_id/data/:data', async (req, res) => {
  const { funcionario_id, data } = req.params

  const { data: registos, error } = await supabase
    .from('registos_ponto')
    .select('*')
    .eq('funcionario_id', funcionario_id)
    .gte('hora', `${data}T00:00:00`)
    .lte('hora', `${data}T23:59:59`)
    .order('hora')

  if (error) return res.status(500).json({ error: error.message })
  res.json(registos)
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