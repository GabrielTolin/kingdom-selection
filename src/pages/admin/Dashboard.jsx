import { useState, useEffect, useRef } from 'react'
import logoKS from '../../assets/logo-ks.png'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, CheckCircle, XCircle, HardHat, Building2, ChevronRight, ArrowLeft, Phone, Mail, Euro, Calendar, Briefcase, FileText, Upload, Download, Trash2, ChevronDown, ChevronUp, Pencil, Save, X, AlertCircle, Plus, UserPlus, UserMinus, Link } from 'lucide-react'
import { obrasAPI, funcionariosAPI, pontoAPI, recibosAPI, obraFuncionariosAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function BadgeEstado({ estado }) {
  const config = {
    presente: { bg: '#16352A', color: 'var(--color-success)', icon: <CheckCircle size={12} />, label: 'Presente' },
    saiu:     { bg: '#1A1A2E', color: '#60A5FA',              icon: <Clock size={12} />,        label: 'Saiu' },
    ausente:  { bg: '#2A1A1A', color: 'var(--color-danger)',  icon: <XCircle size={12} />,      label: 'Ausente' },
  }
  const c = config[estado] || config.ausente
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.color }}>
      {c.icon} {c.label}
    </div>
  )
}

function calcularEstado(funcionarioId, registosHoje) {
  const registos = registosHoje.filter(r => r.funcionario_id === funcionarioId)
  if (registos.length === 0) return 'ausente'
  const ultimo = registos[registos.length - 1]
  return ultimo.tipo === 'entrada' ? 'presente' : 'saiu'
}

function calcularHorasHoje(funcionarioId, registosHoje) {
  const registos = registosHoje
    .filter(r => r.funcionario_id === funcionarioId)
    .sort((a, b) => new Date(a.hora) - new Date(b.hora))
  let totalMs = 0
  for (let i = 0; i < registos.length - 1; i += 2) {
    if (registos[i].tipo === 'entrada' && registos[i + 1]?.tipo === 'saida') {
      totalMs += new Date(registos[i + 1].hora) - new Date(registos[i].hora)
    }
  }
  if (registos.length % 2 !== 0 && registos[registos.length - 1]?.tipo === 'entrada') {
    totalMs += new Date() - new Date(registos[registos.length - 1].hora)
  }
  return (totalMs / 1000 / 3600).toFixed(1)
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ titulo, onFechar, onGuardar, guardando, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onFechar}>
      <div className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={onFechar}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-surface-2)' }}>
            <X size={16} />
          </button>
        </div>
        {children}
        <button onClick={onGuardar} disabled={guardando}
          className="w-full py-3 rounded-xl font-semibold mt-4 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-primary)', color: 'white' }}>
          {guardando ? 'A guardar...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function CampoInput({ label, icon, ...props }) {
  return (
    <div className="flex flex-col justify-center gap-4">
      <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {icon} {label}
      </label>
      <input
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        {...props}
      />
    </div>
  )
}

// ─── MODAL NOVA OBRA ─────────────────────────────────────────────────────────
function ModalNovaObra({ onFechar, onCriada }) {
  const [form, setForm] = useState({ nome: '', local: '' })
  const [guardando, setGuardando] = useState(false)
  const [erro, setErro] = useState(null)

  const guardar = async () => {
    if (!form.nome.trim()) return setErro('O nome da obra é obrigatório')
    try {
      setGuardando(true)
      setErro(null)
      const nova = await obrasAPI.criar({ nome: form.nome, local: form.local })
      onCriada(nova)
      onFechar()
    } catch (err) {
      setErro('Erro ao criar obra. Tenta novamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Nova obra" onFechar={onFechar} onGuardar={guardar} guardando={guardando}>
      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: '#2A1A1A', color: 'var(--color-danger)' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}
      <div className="flex flex-col gap-5">
        <CampoInput label="Nome da obra *" icon={<Building2 size={12} />}
          placeholder="ex: Obra Rua das Flores 12"
          value={form.nome}
          onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
        <CampoInput label="Local" icon={<Briefcase size={12} />}
          placeholder="ex: Porto"
          value={form.local}
          onChange={e => setForm(p => ({ ...p, local: e.target.value }))} />
      </div>
    </Modal>
  )
}

// ─── MODAL NOVO FUNCIONÁRIO ──────────────────────────────────────────────────
function ModalNovoFuncionario({ onFechar, onCriado }) {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', funcao: '', valor_hora: '', data_entrada: '' })
  const [guardando, setGuardando] = useState(false)
  const [erro, setErro] = useState(null)

  const guardar = async () => {
    if (!form.nome.trim()) return setErro('O nome é obrigatório')
    if (!form.email.trim()) return setErro('O email é obrigatório')
    try {
      setGuardando(true)
      setErro(null)
      const novo = await funcionariosAPI.criar({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || null,
        funcao: form.funcao || null,
        valor_hora: parseFloat(form.valor_hora) || 0,
        data_entrada: form.data_entrada || null,
      })
      onCriado(novo)
      onFechar()
    } catch (err) {
      setErro('Erro ao criar funcionário. O email pode já existir.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Novo funcionário" onFechar={onFechar} onGuardar={guardar} guardando={guardando}>
      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: '#2A1A1A', color: 'var(--color-danger)' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}
      <div className="flex flex-col gap-5">
        <CampoInput label="Nome *" icon={<Users size={12} />}
          placeholder="ex: João Silva"
          value={form.nome}
          onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
        <CampoInput label="Email *" icon={<Mail size={12} />}
          type="email" placeholder="ex: joao@email.com"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <CampoInput label="Telefone" icon={<Phone size={12} />}
          placeholder="ex: +351 912 345 678"
          value={form.telefone}
          onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
        <CampoInput label="Função" icon={<Briefcase size={12} />}
          placeholder="ex: Canalizador"
          value={form.funcao}
          onChange={e => setForm(p => ({ ...p, funcao: e.target.value }))} />
        <CampoInput label="Valor/hora (€)" icon={<Euro size={12} />}
          type="number" step="0.50" min="0" placeholder="ex: 12.50"
          value={form.valor_hora}
          onChange={e => setForm(p => ({ ...p, valor_hora: e.target.value }))} />
        <CampoInput label="Data de entrada" icon={<Calendar size={12} />}
          type="date"
          value={form.data_entrada}
          onChange={e => setForm(p => ({ ...p, data_entrada: e.target.value }))} />
      </div>
    </Modal>
  )
}

// ─── PERFIL DO FUNCIONÁRIO ───────────────────────────────────────────────────
function PerfilFuncionario({ funcionario, registosHoje, onVoltar }) {
  const inputRef = useRef(null)
  const [dados, setDados] = useState({ ...funcionario })
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState({ ...funcionario })
  const [guardado, setGuardado] = useState(false)
  const [guardandoAPI, setGuardandoAPI] = useState(false)
  const [recibos, setRecibos] = useState([])
  const [expandidoRecibo, setExpandidoRecibo] = useState(null)
  const [arrastando, setArrastando] = useState(false)
  const [erro, setErro] = useState(null)

  const estado = calcularEstado(funcionario.id, registosHoje)
  const horasHoje = calcularHorasHoje(funcionario.id, registosHoje)
  const ganhouHoje = (horasHoje * dados.valor_hora).toFixed(2)

  const registosFuncionario = registosHoje
    .filter(r => r.funcionario_id === funcionario.id)
    .sort((a, b) => new Date(a.hora) - new Date(b.hora))

  const entrada = registosFuncionario.find(r => r.tipo === 'entrada')
  const saida   = registosFuncionario.find(r => r.tipo === 'saida')

  useEffect(() => {
    recibosAPI.listar(funcionario.id).then(setRecibos).catch(() => {})
  }, [])

  const guardarEdicao = async () => {
    try {
      setGuardandoAPI(true)
      setErro(null)
      const atualizado = await funcionariosAPI.atualizar(dados.id, {
        nome: rascunho.nome, email: rascunho.email,
        telefone: rascunho.telefone, funcao: rascunho.funcao,
        valor_hora: parseFloat(rascunho.valor_hora) || dados.valor_hora,
        data_entrada: rascunho.data_entrada,
      })
      setDados(atualizado)
      setEditando(false)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2500)
    } catch { setErro('Erro ao guardar. Tenta novamente.') }
    finally { setGuardandoAPI(false) }
  }

  const adicionarRecibo = (ficheiros) => {
    Array.from(ficheiros).forEach(file => {
      if (file.type !== 'application/pdf') return
      setRecibos(prev => [{ id: Date.now(), nome: file.name, mes: 'Mês atual',
        data_emissao: new Date().toLocaleDateString('pt-PT'),
        tamanho: `${Math.round(file.size / 1024)} KB`, url: URL.createObjectURL(file) }, ...prev])
    })
  }

  const removerRecibo = async (id) => {
    try { await recibosAPI.apagar(id) } catch {}
    setRecibos(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="min-h-screen p-4 w-full max-w-lg mx-auto flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-3 py-4 mb-6">
        <button onClick={onVoltar} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Perfil do funcionário</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Informações e recibos</p>
        </div>
        {!editando ? (
          <button onClick={() => { setRascunho({ ...dados }); setEditando(true) }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Pencil size={14} /> Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditando(false)} className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#2A1A1A' }}>
              <X size={16} color="var(--color-danger)" />
            </button>
            <button onClick={guardarEdicao} disabled={guardandoAPI}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: 'white' }}>
              <Save size={14} /> {guardandoAPI ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: '#2A1A1A', color: 'var(--color-danger)', border: '1px solid #EF444433' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}
      {guardado && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: '#16352A', color: 'var(--color-success)', border: '1px solid #22C55E33' }}>
          <CheckCircle size={14} /> Informações atualizadas com sucesso!
        </div>
      )}

      {/* Card principal */}
      <div className="p-5 rounded-2xl mb-4"
        style={{ background: 'var(--color-surface)', border: `1px solid ${editando ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
        {editando && (
          <p className="text-xs mb-4 px-3 py-2 rounded-xl"
            style={{ background: '#1F1208', color: 'var(--color-primary)', border: '1px solid #F9731633' }}>
            ✏️ Modo de edição ativo — altera os campos e clica em Guardar
          </p>
        )}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-primary)' }}>
            {dados.nome.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            {editando ? (
              <input value={rascunho.nome} onChange={e => setRascunho(p => ({ ...p, nome: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-lg font-bold outline-none mb-1"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-primary)', color: 'var(--color-text)' }} />
            ) : <h2 className="text-xl font-bold">{dados.nome}</h2>}
            <div className="mt-1"><BadgeEstado estado={estado} /></div>
          </div>
        </div>
        <div className="flex flex-col gap-5 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          {[
            { icon: <Briefcase size={15} />, key: 'funcao',   placeholder: 'Função' },
            { icon: <Phone size={15} />,     key: 'telefone', placeholder: 'Telefone' },
            { icon: <Mail size={15} />,      key: 'email',    placeholder: 'Email' },
          ].map(({ icon, key, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{icon}</span>
              {editando ? (
                <input value={rascunho[key] || ''} onChange={e => setRascunho(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder} className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
              ) : <span className="text-sm">{dados[key] || '—'}</span>}
            </div>
          ))}
          <div className="flex items-center gap-3">
            <Calendar size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            {editando ? (
              <input type="date" value={rascunho.data_entrada || ''} onChange={e => setRascunho(p => ({ ...p, data_entrada: e.target.value }))}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            ) : <span className="text-sm">{dados.data_entrada ? `Na empresa desde ${new Date(dados.data_entrada).toLocaleDateString('pt-PT')}` : '—'}</span>}
          </div>
        </div>
      </div>

      {/* Valor hora */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 rounded-2xl" style={{ background: '#16352A', border: editando ? '1px solid var(--color-primary)' : 'none' }}>
          <div className="flex items-center gap-2 mb-1">
            <Euro size={14} color="var(--color-success)" />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Valor/hora</span>
            {editando && <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>editável</span>}
          </div>
          {editando ? (
            <div className="flex items-center gap-1">
              <input type="number" step="0.50" min="0" value={rascunho.valor_hora}
                onChange={e => setRascunho(p => ({ ...p, valor_hora: e.target.value }))}
                className="w-full px-2 py-1 rounded-lg text-xl font-bold outline-none"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-primary)', color: 'var(--color-success)' }} />
              <span className="font-bold" style={{ color: 'var(--color-success)' }}>€</span>
            </div>
          ) : <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{parseFloat(dados.valor_hora).toFixed(2)}€</p>}
        </div>
        <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Horas hoje</span>
          </div>
          <p className="text-2xl font-bold">{horasHoje}h</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl mb-4 flex items-center justify-between"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Custo estimado hoje</p>
          <p className="text-2xl font-bold mt-0.5">{ganhouHoje}€</p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full" style={{ background: '#16352A', color: 'var(--color-success)' }}>
          {parseFloat(dados.valor_hora).toFixed(2)}€/h × {horasHoje}h
        </div>
      </div>

      {/* Ponto */}
      <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Clock size={14} /> Ponto de hoje</h3>
      <div className="flex flex-col gap-2 mb-6">
        {[{ tipo: 'entrada', registo: entrada }, { tipo: 'saida', registo: saida }].map(({ tipo, registo }) => (
          <div key={tipo} className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full"
                style={{ background: tipo === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)' }} />
              <span className="text-sm capitalize">{tipo}</span>
            </div>
            <span className="text-sm font-medium">
              {registo ? new Date(registo.hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Recibos */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileText size={14} /> Recibos
          <span className="text-xs px-2 py-0.5 rounded-full ml-1"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
            {recibos.length}
          </span>
        </h3>
      </div>
      <div onDragOver={e => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={e => { e.preventDefault(); setArrastando(false); adicionarRecibo(e.dataTransfer.files) }}
        onClick={() => inputRef.current.click()}
        className="flex flex-col items-center gap-2 py-6 rounded-2xl mb-4 cursor-pointer"
        style={{ border: `2px dashed ${arrastando ? 'var(--color-primary)' : 'var(--color-border)'}`, background: arrastando ? '#1F1208' : 'var(--color-surface)' }}>
        <Upload size={22} style={{ color: arrastando ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
        <p className="text-sm font-medium">{arrastando ? 'Larga aqui!' : 'Clica ou arrasta um PDF'}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Apenas ficheiros PDF</p>
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => adicionarRecibo(e.target.files)} />
      </div>
      {recibos.length === 0 ? (
        <p className="text-sm text-center py-6 rounded-2xl"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>
          Nenhum recibo ainda
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {recibos.map(r => (
            <div key={r.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#16352A' }}>
                    <FileText size={14} color="var(--color-success)" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.mes}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {r.data_emissao} {r.tamanho ? `· ${r.tamanho}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {r.url && (
                    <a href={r.url} download={r.nome}
                      className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#16352A' }}>
                      <Download size={14} color="var(--color-success)" />
                    </a>
                  )}
                  <button onClick={() => removerRecibo(r.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#2A1A1A' }}>
                    <Trash2 size={14} color="var(--color-danger)" />
                  </button>
                  <button onClick={() => setExpandidoRecibo(expandidoRecibo === r.id ? null : r.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface-2)' }}>
                    {expandidoRecibo === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MODAL ASSOCIAR FUNCIONÁRIO ──────────────────────────────────────────────
function ModalAssociarFuncionario({ obraId, funcionariosNaObra, onFechar, onAssociado }) {
  const [todosFuncionarios, setTodosFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [associando, setAssociando] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    funcionariosAPI.listar().then(data => {
      setTodosFuncionarios(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const idsNaObra = funcionariosNaObra.map(f => f.id)
  const disponiveis = todosFuncionarios.filter(f => !idsNaObra.includes(f.id))

  const associar = async (funcionarioId) => {
    try {
      setAssociando(funcionarioId)
      setErro(null)
      await obraFuncionariosAPI.associar(obraId, funcionarioId)
      onAssociado()
      onFechar()
    } catch (err) {
      setErro(err.message || 'Erro ao associar funcionário')
    } finally {
      setAssociando(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onFechar}>
      <div className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Adicionar funcionário</h2>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-surface-2)' }}>
            <X size={16} />
          </button>
        </div>

        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-3 text-sm"
            style={{ background: '#2A1A1A', color: 'var(--color-danger)' }}>
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            A carregar...
          </p>
        ) : disponiveis.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            Todos os funcionários já estão nesta obra
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {disponiveis.map(f => (
              <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}>
                    {f.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{f.nome}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {f.funcao} · {parseFloat(f.valor_hora || 0).toFixed(2)}€/h
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => associar(f.id)}
                  disabled={associando === f.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50 transition-all"
                  style={{ background: 'var(--color-primary)', color: 'white' }}>
                  {associando === f.id ? '...' : <><Plus size={12} /> Adicionar</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DETALHE DA OBRA ─────────────────────────────────────────────────────────
function DetalheObra({ obra, funcionarios, registosHoje, onVoltar, onVerPerfil, onRecarregar }) {
  const [modalAssociar, setModalAssociar] = useState(false)
  const [removendo, setRemovendo] = useState(null)
  const [erro, setErro] = useState(null)

  const presentes = funcionarios.filter(f => calcularEstado(f.id, registosHoje) === 'presente').length
  const ausentes  = funcionarios.filter(f => calcularEstado(f.id, registosHoje) === 'ausente').length
  const sairam    = funcionarios.filter(f => calcularEstado(f.id, registosHoje) === 'saiu').length

  const remover = async (funcionarioId) => {
    try {
      setRemovendo(funcionarioId)
      setErro(null)
      await obraFuncionariosAPI.remover(obra.id, funcionarioId)
      onRecarregar()
    } catch {
      setErro('Erro ao remover funcionário. Tenta novamente.')
    } finally {
      setRemovendo(null)
    }
  }

  return (
    <div className="min-h-screen p-4 w-full max-w-lg mx-auto flex flex-col" style={{ background: 'var(--color-bg)' }}>

      {/* Modal associar */}
      {modalAssociar && (
        <ModalAssociarFuncionario
          obraId={obra.id}
          funcionariosNaObra={funcionarios}
          onFechar={() => setModalAssociar(false)}
          onAssociado={onRecarregar}
        />
      )}

      <div className="flex items-center gap-3 py-4 mb-6">
        <button onClick={onVoltar} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{obra.nome}</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{obra.local}</p>
        </div>
        <button onClick={() => setModalAssociar(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ background: 'var(--color-primary)', color: 'white' }}>
          <UserPlus size={14} /> Adicionar
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: '#2A1A1A', color: 'var(--color-danger)', border: '1px solid #EF444433' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Em obra',  value: presentes, bg: '#16352A', color: 'var(--color-success)' },
          { label: 'Saíram',   value: sairam,    bg: '#1A1A2E', color: '#60A5FA' },
          { label: 'Ausentes', value: ausentes,  bg: '#2A1A1A', color: 'var(--color-danger)' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: s.bg }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-bold mb-3 flex items-center gap-2">
        <Users size={16} /> Funcionários · hoje
      </h2>

      <div className="flex flex-col gap-2">
        {funcionarios.length === 0 ? (
          <div className="flex flex-col items-center py-10 rounded-2xl gap-3"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Users size={28} style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Nenhum funcionário nesta obra
            </p>
            <button onClick={() => setModalAssociar(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--color-primary)', color: 'white' }}>
              <UserPlus size={14} /> Adicionar funcionário
            </button>
          </div>
        ) : funcionarios.map(f => (
          <div key={f.id} className="flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => onVerPerfil(f)} className="flex items-center gap-3 flex-1 text-left">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-primary)' }}>
                {f.nome.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{f.nome}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {f.funcao} · {parseFloat(f.valor_hora || 0).toFixed(2)}€/h
                </p>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <BadgeEstado estado={calcularEstado(f.id, registosHoje)} />
              <button
                onClick={() => remover(f.id)}
                disabled={removendo === f.id}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30"
                style={{ background: '#2A1A1A' }}
                title="Remover da obra">
                <UserMinus size={14} color="var(--color-danger)" />
              </button>
              <button onClick={() => onVerPerfil(f)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-surface-2)' }}>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DASHBOARD PRINCIPAL ─────────────────────────────────────────────────────
export default function DashboardAdmin() {
  const [vista, setVista] = useState('obras')
  const [obraAtiva, setObraAtiva] = useState(null)
  const [funcionarioAtivo, setFuncionarioAtivo] = useState(null)
  const [obras, setObras] = useState([])
  const [registosHoje, setRegistosHoje] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [modalObra, setModalObra] = useState(false)
  const [modalFuncionario, setModalFuncionario] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    carregarDados()
    // Atualizar automaticamente a cada 30 segundos
    const intervalo = setInterval(() => {
      carregarDados()
    }, 30000)
    return () => clearInterval(intervalo)
  }, [])

  const carregarDados = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true)
      setErro(null)
      const obrasData = await obrasAPI.listar()
      setObras(obrasData)
      const todosRegistos = []
      for (const obra of obrasData) {
        try {
          const registos = await pontoAPI.obraHoje(obra.id)
          todosRegistos.push(...registos)
        } catch {}
      }
      setRegistosHoje(todosRegistos)
    } catch { setErro('Erro ao carregar dados. Verifica a ligação.') }
    finally { setLoading(false) }
  }

  const getFuncionariosObra = (obra) =>
    (obra.obra_funcionarios || []).map(of => of.funcionarios).filter(Boolean)

  if (vista === 'perfil' && funcionarioAtivo) {
    return <PerfilFuncionario funcionario={funcionarioAtivo} registosHoje={registosHoje} onVoltar={() => setVista('detalhe')} />
  }

  if (vista === 'detalhe' && obraAtiva) {
    return (
      <DetalheObra
        obra={obraAtiva}
        funcionarios={getFuncionariosObra(obraAtiva)}
        registosHoje={registosHoje}
        onVoltar={() => setVista('obras')}
        onVerPerfil={f => { setFuncionarioAtivo(f); setVista('perfil') }}
        onRecarregar={carregarDados}
      />
    )
  }

  const todosFuncionarios = obras.flatMap(getFuncionariosObra)
  const totalPresentes = todosFuncionarios.filter(f => calcularEstado(f.id, registosHoje) === 'presente').length

  return (
    <div className="min-h-screen p-4 w-full max-w-lg mx-auto flex flex-col justify-center gap-5"
     style={{ background: 'rgba(15, 15, 15, 0.50)'  }}>

      {/* Modais */}
      {modalObra && (
        <ModalNovaObra
          onFechar={() => setModalObra(false)}
          onCriada={() => { setModalObra(false); carregarDados() }}
        />
      )}
      {modalFuncionario && (
        <ModalNovoFuncionario
          onFechar={() => setModalFuncionario(false)}
          onCriado={() => { setModalFuncionario(false); carregarDados() }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-6">
        
        <div className="flex-1">
          <h1 className="text-xl font-bold">Kingdom Selection</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Painel do gestor · {new Date().toLocaleDateString('pt-PT')}
          </p>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="text-xs px-3 py-1.5 rounded-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          ↻
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: '#2A1A1A', color: 'var(--color-danger)', border: '1px solid #EF444433' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}

      {loading ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>A carregar dados...</p>
      ) : (
        <>
          {/* Resumo geral */}
          <div className="p-4 rounded-2xl mb-6 flex items-center justify-between"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total em obra agora</p>
              <p className="text-3xl font-bold mt-1">
                {totalPresentes}
                <span className="text-base font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>
                  / {todosFuncionarios.length} funcionários
                </span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#16352A' }}>
              <Users size={22} color="var(--color-success)" />
            </div>
          </div>

          {/* Botões de adicionar */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setModalObra(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all hover:opacity-80 active:scale-95"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <Plus size={16} color="var(--color-primary)" />
              Nova obra
            </button>
            <button onClick={() => setModalFuncionario(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all hover:opacity-80 active:scale-95"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <UserPlus size={16} color="var(--color-primary)" />
              Novo funcionário
            </button>
          </div>

          {/* Lista de obras */}
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <Building2 size={16} /> Obras ativas
          </h2>

          {obras.length === 0 ? (
            <div className="flex flex-col items-center py-12 rounded-2xl gap-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <Building2 size={32} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Nenhuma obra ativa</p>
              <button onClick={() => setModalObra(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--color-primary)', color: 'white' }}>
                <Plus size={14} /> Criar primeira obra
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {obras.map(obra => {
                const funcionarios = getFuncionariosObra(obra)
                const presentes = funcionarios.filter(f => calcularEstado(f.id, registosHoje) === 'presente').length
                const ausentes  = funcionarios.filter(f => calcularEstado(f.id, registosHoje) === 'ausente').length
                return (
                  <button key={obra.id}
                    onClick={() => { setObraAtiva(obra); setVista('detalhe') }}
                    className="w-full text-left px-4 py-4 rounded-2xl hover:opacity-80 active:scale-95"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface-2)' }}>
                          <Building2 size={16} color="var(--color-primary)" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{obra.nome}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{obra.local}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#16352A', color: 'var(--color-success)' }}>
                        {presentes} presentes
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#2A1A1A', color: 'var(--color-danger)' }}>
                        {ausentes} ausentes
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{funcionarios.length} total</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}