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
  const { nome, local, latitude, longitude, raio_metros } = req.body
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' })
  const { data, error } = await supabase
    .from('obras')
    .insert([{
      nome,
      local,
      latitude: latitude || null,
      longitude: longitude || null,
      raio_metros: raio_metros || 200,
    }])
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})


router.put('/:id', async (req, res) => {
  // Atualiza apenas os campos enviados (evita apagar dados por engano)
  const campos = {}
  for (const chave of ['nome', 'local', 'ativa', 'latitude', 'longitude', 'raio_metros']) {
    if (req.body[chave] !== undefined) campos[chave] = req.body[chave]
  }
  const { data, error } = await supabase
    .from('obras')
    .update(campos)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/obras/:id — arquivar obra (mantém o histórico de pontos)
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('obras')
    .update({ ativa: false })
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Obra arquivada com sucesso' })
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