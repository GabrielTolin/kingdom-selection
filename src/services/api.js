// URL base da API — em desenvolvimento aponta para o servidor local
const BASE_URL = 'http://localhost:3001/api'

// Função auxiliar para fazer pedidos
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Erro desconhecido')
  }

  return data
}

// ── FUNCIONÁRIOS ──────────────────────────────────────────────────────────────
export const funcionariosAPI = {
  listar: () =>
    request('/funcionarios'),

  buscar: (id) =>
    request(`/funcionarios/${id}`),

  criar: (dados) =>
    request('/funcionarios', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  atualizar: (id, dados) =>
    request(`/funcionarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    }),

  apagar: (id) =>
    request(`/funcionarios/${id}`, { method: 'DELETE' }),
}

// ── OBRAS ─────────────────────────────────────────────────────────────────────
export const obrasAPI = {
  listar: () =>
    request('/obras'),

  buscar: (id) =>
    request(`/obras/${id}`),

  criar: (dados) =>
    request('/obras', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  atualizar: (id, dados) =>
    request(`/obras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    }),
}

// ── PONTO ─────────────────────────────────────────────────────────────────────
export const pontoAPI = {
  registar: (funcionario_id, obra_id, tipo, localizacao = null) =>
    request('/ponto', {
      method: 'POST',
      body: JSON.stringify({
        funcionario_id,
        obra_id,
        tipo,
        latitude: localizacao?.latitude || null,
        longitude: localizacao?.longitude || null,
        precisao: localizacao?.precisao || null,
      }),
    }),

  hoje: (funcionario_id) =>
    request(`/ponto/${funcionario_id}/hoje`),

  obraHoje: (obra_id) =>
    request(`/ponto/obra/${obra_id}/hoje`),
}

// ── RECIBOS ───────────────────────────────────────────────────────────────────
export const recibosAPI = {
  listar: (funcionario_id) =>
    request(`/recibos/${funcionario_id}`),

  criar: (dados) =>
    request('/recibos', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  apagar: (id) =>
    request(`/recibos/${id}`, { method: 'DELETE' }),
}

// ── ASSOCIAÇÃO OBRA-FUNCIONÁRIO ───────────────────────────────────────────────
export const obraFuncionariosAPI = {
  associar: (obra_id, funcionario_id) =>
    request(`/obras/${obra_id}/funcionarios`, {
      method: 'POST',
      body: JSON.stringify({ funcionario_id }),
    }),

  remover: (obra_id, funcionario_id) =>
    request(`/obras/${obra_id}/funcionarios/${funcionario_id}`, {
      method: 'DELETE',
    }),
}