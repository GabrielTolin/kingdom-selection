import express from 'express'
import { supabase } from '../supabase.js'

const router = express.Router()

// GET /api/funcionarios — listar todos
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .order('nome')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/funcionarios/:id — buscar um funcionário
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Funcionário não encontrado' })
  res.json(data)
})

// POST /api/funcionarios — criar funcionário
router.post('/', async (req, res) => {
  const { nome, email, telefone, funcao, valor_hora, data_entrada } = req.body

  if (!nome || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios' })
  }

  const { data, error } = await supabase
    .from('funcionarios')
    .insert([{ nome, email, telefone, funcao, valor_hora, data_entrada }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/funcionarios/:id — atualizar funcionário
router.put('/:id', async (req, res) => {
  const { nome, email, telefone, funcao, valor_hora, data_entrada } = req.body

  const { data, error } = await supabase
    .from('funcionarios')
    .update({ nome, email, telefone, funcao, valor_hora, data_entrada })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/funcionarios/:id — apagar funcionário e todos os dados associados
router.delete('/:id', async (req, res) => {
  const id = req.params.id

  // Remover primeiro as referências para não violar chaves estrangeiras
  await supabase.from('obra_funcionarios').delete().eq('funcionario_id', id)
  await supabase.from('registos_ponto').delete().eq('funcionario_id', id)
  await supabase.from('recibos').delete().eq('funcionario_id', id)
  await supabase.from('perfis').delete().eq('funcionario_id', id)

  const { error } = await supabase
    .from('funcionarios')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Funcionário apagado com sucesso' })
})

export default router