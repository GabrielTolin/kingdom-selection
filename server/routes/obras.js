import express from 'express'
import { supabase } from '../supabase.js'

const router = express.Router()


router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('obras')
    .select(`*, obra_funcionarios(funcionario_id, funcionarios(id, nome, funcao, valor_hora))`)
    .eq('ativa', true)
    .order('nome')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})


router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('obras')
    .select(`*, obra_funcionarios(funcionario_id, funcionarios(id, nome, funcao, valor_hora))`)
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Obra não encontrada' })
  res.json(data)
})


router.post('/', async (req, res) => {
  const { nome, local } = req.body
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' })
  const { data, error } = await supabase
    .from('obras')
    .insert([{ nome, local }])
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})


router.put('/:id', async (req, res) => {
  const { nome, local, ativa } = req.body
  const { data, error } = await supabase
    .from('obras')
    .update({ nome, local, ativa })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Associa um funcionario a obra
router.post('/:id/funcionarios', async (req, res) => {
  const { funcionario_id } = req.body
  if (!funcionario_id) return res.status(400).json({ error: 'funcionario_id é obrigatório' })

  // Confirmação se o funcionario ja esta associado a obra
  const { data: existente } = await supabase
    .from('obra_funcionarios')
    .select('id')
    .eq('obra_id', req.params.id)
    .eq('funcionario_id', funcionario_id)
    .single()

  if (existente) return res.status(400).json({ error: 'Funcionário já está nesta obra' })

  const { data, error } = await supabase
    .from('obra_funcionarios')
    .insert([{ obra_id: req.params.id, funcionario_id }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// Remove funcionário da obra
router.delete('/:id/funcionarios/:funcionario_id', async (req, res) => {
  const { error } = await supabase
    .from('obra_funcionarios')
    .delete()
    .eq('obra_id', req.params.id)
    .eq('funcionario_id', req.params.funcionario_id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Funcionário removido da obra' })
})

export default router