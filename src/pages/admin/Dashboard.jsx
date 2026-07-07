import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, CheckCircle, XCircle, Building2, ChevronRight, ArrowLeft, Phone, Mail, Euro, Calendar, Briefcase, FileText, Upload, Download, Trash2, ChevronDown, ChevronUp, Pencil, Save, X, AlertCircle, Plus, UserPlus, UserMinus, BarChart2, Send, MapPin, Crosshair, Archive } from 'lucide-react'
import { obrasAPI, funcionariosAPI, pontoAPI, recibosAPI, obraFuncionariosAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../context/AuthContext'
import { obterLocalizacao, RAIO_MAXIMO } from '../../utils/gps'

function BadgeEstado({ estado }) {
  const config = {
    presente: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', icon: <CheckCircle size={12} />, label: 'Presente' },
    saiu:     { bg: 'var(--color-info-bg)', color: 'var(--color-info)',              icon: <Clock size={12} />,        label: 'Saiu' },
    ausente:  { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)',  icon: <XCircle size={12} />,      label: 'Ausente' },
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

function Modal({ titulo, onFechar, onGuardar, guardando, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onFechar}>
      <div className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-surface-2)' }}>
            <X size={16} />
          </button>
        </div>
        {children}
        <button onClick={onGuardar} disabled={guardando}
          className="w-full py-3 rounded-xl font-semibold mt-6 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-primary)', color: 'white' }}>
          {guardando ? 'A guardar...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function CampoInput({ label, icon, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

// Campos de localização GPS reutilizados na criação e edição de obras
function CamposLocalizacao({ form, setForm }) {
  const [obtendo, setObtendo] = useState(false)
  const [erroGps, setErroGps] = useState(null)
  const [precisao, setPrecisao] = useState(null)

  const usarAtual = async () => {
    try {
      setObtendo(true); setErroGps(null); setPrecisao(null)
      const loc = await obterLocalizacao()
      setForm(p => ({ ...p, latitude: loc.latitude.toFixed(6), longitude: loc.longitude.toFixed(6) }))
      setPrecisao(Math.round(loc.precisao))
    } catch (e) { setErroGps(e.message) }
    finally { setObtendo(false) }
  }

  const temLocalizacao = form.latitude && form.longitude

  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <MapPin size={12} /> Localização GPS (raio {RAIO_MAXIMO}m)
        </span>
        <button type="button" onClick={usarAtual} disabled={obtendo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
          style={{ background: 'var(--color-primary)', color: 'white' }}>
          <Crosshair size={12} /> {obtendo ? 'A obter...' : 'Usar localização atual'}
        </button>
      </div>
      {erroGps && <p className="text-xs mb-2" style={{ color: 'var(--color-danger)' }}>{erroGps}</p>}
      {precisao !== null && !erroGps && (
        <p className="text-xs mb-2" style={{ color: 'var(--color-success)' }}>✓ Localização obtida (precisão ~{precisao}m)</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Latitude" value={form.latitude || ''}
          onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-xs outline-none"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
        <input placeholder="Longitude" value={form.longitude || ''}
          onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-xs outline-none"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
        {temLocalizacao
          ? 'Só é possível bater o ponto a menos de 200m deste local.'
          : 'Sem GPS definido, o ponto pode ser batido em qualquer lugar.'}
      </p>
    </div>
  )
}

function ModalNovaObra({ onFechar, onCriada }) {
  const [form, setForm] = useState({ nome: '', local: '', latitude: '', longitude: '' })
  const [guardando, setGuardando] = useState(false)
  const [erro, setErro] = useState(null)

  const guardar = async () => {
    if (!form.nome.trim()) return setErro('O nome da obra é obrigatório')
    try {
      setGuardando(true)
      setErro(null)
      await obrasAPI.criar({
        nome: form.nome,
        local: form.local,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        raio_metros: RAIO_MAXIMO,
      })
      onCriada()
      onFechar()
    } catch { setErro('Erro ao criar obra. Tenta novamente.') }
    finally { setGuardando(false) }
  }

  return (
    <Modal titulo="Nova obra" onFechar={onFechar} onGuardar={guardar} guardando={guardando}>
      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <CampoInput label="Nome da obra *" icon={<Building2 size={12} />}
          placeholder="ex: Obra Rua das Flores 12"
          value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
        <CampoInput label="Local" icon={<Briefcase size={12} />}
          placeholder="ex: Porto"
          value={form.local} onChange={e => setForm(p => ({ ...p, local: e.target.value }))} />
        <CamposLocalizacao form={form} setForm={setForm} />
      </div>
    </Modal>
  )
}

// Modal para definir/atualizar a localização GPS de uma obra existente
function ModalLocalizacaoObra({ obra, onFechar, onGuardada }) {
  const [form, setForm] = useState({
    latitude: obra.latitude || '',
    longitude: obra.longitude || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [erro, setErro] = useState(null)

  const guardar = async () => {
    try {
      setGuardando(true)
      setErro(null)
      await obrasAPI.atualizar(obra.id, {
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        raio_metros: RAIO_MAXIMO,
      })
      onGuardada()
      onFechar()
    } catch { setErro('Erro ao guardar a localização.') }
    finally { setGuardando(false) }
  }

  return (
    <Modal titulo="Localização da obra" onFechar={onFechar} onGuardar={guardar} guardando={guardando}>
      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}
      <CamposLocalizacao form={form} setForm={setForm} />
    </Modal>
  )
}

function ModalNovoFuncionario({ onFechar, onCriado }) {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', funcao: '', valor_hora: '', data_entrada: '' })
  const [guardando, setGuardando] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const guardar = async () => {
    if (!form.nome.trim()) return setErro('O nome é obrigatório')
    if (!form.email.trim()) return setErro('O email é obrigatório')
    try {
      setGuardando(true)
      setErro(null)
      const novo = await funcionariosAPI.criar({
        nome: form.nome, email: form.email,
        telefone: form.telefone || null, funcao: form.funcao || null,
        valor_hora: parseFloat(form.valor_hora) || 0,
        data_entrada: form.data_entrada || null,
      })
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(form.email, {
        data: { nome: form.nome }
      })
      if (authError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email, password: 'Kingdom2026!',
          options: { data: { nome: form.nome } }
        })
        if (!signUpError && signUpData.user) {
          await supabase.from('perfis').insert([{ id: signUpData.user.id, funcionario_id: novo.id, role: 'funcionario' }])
        }
      } else if (authData?.user) {
        await supabase.from('perfis').insert([{ id: authData.user.id, funcionario_id: novo.id, role: 'funcionario' }])
      }
      setSucesso(true)
      onCriado()
      setTimeout(() => { setSucesso(false); onFechar() }, 2500)
    } catch (err) {
      setErro('Erro ao criar funcionário. O email pode já existir.')
    } finally { setGuardando(false) }
  }

  if (sucesso) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: 'rgba(0,0,0,0.8)' }}>
        <div className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
            <Send size={28} color="var(--color-success)" />
          </div>
          <h2 className="text-lg font-bold text-center">Funcionário criado!</h2>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
            Acesso criado para <strong>{form.email}</strong>
          </p>
          <p className="text-xs text-center px-4 py-3 rounded-xl w-full"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
            Password temporária: <strong style={{ color: 'var(--color-text)' }}>Kingdom2026!</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <Modal titulo="Novo funcionário" onFechar={onFechar} onGuardar={guardar} guardando={guardando}>
      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <CampoInput label="Nome *" icon={<Users size={12} />} placeholder="ex: João Silva"
          value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
        <CampoInput label="Email *" icon={<Mail size={12} />} type="email" placeholder="ex: joao@email.com"
          value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <CampoInput label="Telefone" icon={<Phone size={12} />} placeholder="ex: +351 912 345 678"
          value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
        <CampoInput label="Função" icon={<Briefcase size={12} />} placeholder="ex: Canalizador"
          value={form.funcao} onChange={e => setForm(p => ({ ...p, funcao: e.target.value }))} />
        <CampoInput label="Valor/hora (€)" icon={<Euro size={12} />} type="number" step="0.50" min="0" placeholder="ex: 12.50"
          value={form.valor_hora} onChange={e => setForm(p => ({ ...p, valor_hora: e.target.value }))} />
        <CampoInput label="Data de entrada" icon={<Calendar size={12} />} type="date"
          value={form.data_entrada} onChange={e => setForm(p => ({ ...p, data_entrada: e.target.value }))} />
      </div>
      <p className="text-xs mt-4 px-3 py-2 rounded-xl"
        style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
        📧 Password temporária: <strong style={{ color: 'var(--color-text)' }}>Kingdom2026!</strong>
      </p>
    </Modal>
  )
}

function ModalAssociarFuncionario({ obraId, funcionariosNaObra, onFechar, onAssociado }) {
  const [todosFuncionarios, setTodosFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [associando, setAssociando] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    funcionariosAPI.listar().then(data => { setTodosFuncionarios(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const idsNaObra = funcionariosNaObra.map(f => f.id)
  const disponiveis = todosFuncionarios.filter(f => !idsNaObra.includes(f.id))

  const associar = async (funcionarioId) => {
    try {
      setAssociando(funcionarioId)
      await obraFuncionariosAPI.associar(obraId, funcionarioId)
      onAssociado()
      onFechar()
    } catch (err) { setErro(err.message || 'Erro ao associar') }
    finally { setAssociando(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onFechar}>
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
            style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
            <AlertCircle size={14} /> {erro}
          </div>
        )}
        {loading ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>A carregar...</p>
        ) : disponiveis.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            Todos os funcionários já estão nesta obra
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
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
                <button onClick={() => associar(f.id)} disabled={associando === f.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
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

function PerfilFuncionario({ funcionario, registosHoje, onVoltar, onApagar }) {
  const inputRef = useRef(null)
  const [dados, setDados] = useState({ ...funcionario })
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState({ ...funcionario })
  const [guardado, setGuardado] = useState(false)
  const [guardandoAPI, setGuardandoAPI] = useState(false)
  const [recibos, setRecibos] = useState([])
  const [arrastando, setArrastando] = useState(false)
  const [erro, setErro] = useState(null)
  const [horasMes, setHorasMes] = useState(null)
  const [loadingHoras, setLoadingHoras] = useState(true)
  const [confirmarApagar, setConfirmarApagar] = useState(false)
  const [apagando, setApagando] = useState(false)

  const apagarFuncionario = async () => {
    try {
      setApagando(true)
      setErro(null)
      await funcionariosAPI.apagar(funcionario.id)
      onApagar()
    } catch { setErro('Erro ao apagar o funcionário.'); setApagando(false) }
  }

  const estado = calcularEstado(funcionario.id, registosHoje)
  const horasHoje = calcularHorasHoje(funcionario.id, registosHoje)
  const ganhouHoje = (horasHoje * dados.valor_hora).toFixed(2)
  const registosFuncionario = registosHoje.filter(r => r.funcionario_id === funcionario.id).sort((a, b) => new Date(a.hora) - new Date(b.hora))
  const entrada = registosFuncionario.find(r => r.tipo === 'entrada')
  const saida   = registosFuncionario.find(r => r.tipo === 'saida')

  useEffect(() => {
    recibosAPI.listar(funcionario.id).then(setRecibos).catch(() => {})
    carregarHorasMes()
  }, [])

  const carregarHorasMes = async () => {
    try {
      setLoadingHoras(true)
      const agora = new Date()
      const diaAtual = agora.getDate()

      let inicioMes, fimMes, nomePeriodo

      if (diaAtual <= 22) {
        // Entre dia 1 e 22 — período: dia 23 do mês anterior até dia 22 deste mês
        const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 23)
        const fim    = new Date(agora.getFullYear(), agora.getMonth(), 22, 23, 59, 59)
        inicioMes    = inicio.toISOString()
        fimMes       = fim.toISOString()
        nomePeriodo  = `23 ${inicio.toLocaleDateString('pt-PT', { month: 'short' })} - 22 ${fim.toLocaleDateString('pt-PT', { month: 'short' })}`
      } else {
        // Entre dia 23 e fim do mês — período: dia 23 deste mês até dia 22 do próximo
        const inicio = new Date(agora.getFullYear(), agora.getMonth(), 23)
        const fim    = new Date(agora.getFullYear(), agora.getMonth() + 1, 22, 23, 59, 59)
        inicioMes    = inicio.toISOString()
        fimMes       = fim.toISOString()
        nomePeriodo  = `23 ${inicio.toLocaleDateString('pt-PT', { month: 'short' })} - 22 ${fim.toLocaleDateString('pt-PT', { month: 'short' })}`
      }

      const { data, error } = await supabase
        .from('registos_ponto').select('*')
        .eq('funcionario_id', funcionario.id)
        .gte('hora', inicioMes).lte('hora', fimMes).order('hora')

      if (error) throw error

      let totalMs = 0
      const sorted = data.sort((a, b) => new Date(a.hora) - new Date(b.hora))
      for (let i = 0; i < sorted.length - 1; i += 2) {
        if (sorted[i].tipo === 'entrada' && sorted[i + 1]?.tipo === 'saida') {
          totalMs += new Date(sorted[i + 1].hora) - new Date(sorted[i].hora)
        }
      }
      const totalHoras = totalMs / 1000 / 3600
      setHorasMes({
        horas: totalHoras.toFixed(1),
        ganho: (totalHoras * dados.valor_hora).toFixed(2),
        dias: new Set(data.map(r => r.hora.split('T')[0])).size,
        periodo: nomePeriodo
      })
    } catch { setHorasMes(null) }
    finally { setLoadingHoras(false) }
  }

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
    } catch { setErro('Erro ao guardar.') }
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
    <div className="min-h-screen p-4 w-full max-w-lg mx-auto flex flex-col" style={{ paddingTop: '20px' }}>
      <div className="flex items-center gap-3 py-4 mb-4">
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
              style={{ background: 'var(--color-danger-bg)' }}>
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

      {erro && <div className="flex items-center gap-2 p-3 rounded-xl mb-3 text-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}><AlertCircle size={14} /> {erro}</div>}
      {guardado && <div className="flex items-center gap-2 p-3 rounded-xl mb-3 text-sm font-medium" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}><CheckCircle size={14} /> Informações atualizadas!</div>}

      <div className="p-5 rounded-2xl mb-4"
        style={{ background: 'var(--color-surface)', border: `1px solid ${editando ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
        {editando && <p className="text-xs mb-4 px-3 py-2 rounded-xl" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)' }}>✏️ Modo de edição ativo</p>}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          {[
            { icon: <Briefcase size={15} />, key: 'funcao', placeholder: 'Função' },
            { icon: <Phone size={15} />, key: 'telefone', placeholder: 'Telefone' },
            { icon: <Mail size={15} />, key: 'email', placeholder: 'Email' },
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

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 rounded-2xl" style={{ background: 'var(--color-success-bg)', border: editando ? '1px solid var(--color-primary)' : 'none' }}>
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
        <div className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
          {parseFloat(dados.valor_hora).toFixed(2)}€/h × {horasHoje}h
        </div>
      </div>

      <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <BarChart2 size={14} color="var(--color-primary)" />
          Período: {horasMes?.periodo || '...'}
        </h3>
        {loadingHoras ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>A calcular...</p>
        ) : horasMes ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{horasMes.dias}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>dias</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
              <p className="text-lg font-bold">{horasMes.horas}h</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>horas</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-success-bg)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>{horasMes.ganho}€</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>total</p>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sem registos este mês</p>
        )}
      </div>

      <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Clock size={14} /> Ponto de hoje</h3>
      <div className="flex flex-col gap-2 mb-4">
        {[{ tipo: 'entrada', registo: entrada }, { tipo: 'saida', registo: saida }].map(({ tipo, registo }) => (
          <div key={tipo} className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: tipo === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)' }} />
              <span className="text-sm capitalize">{tipo}</span>
            </div>
            <div className="flex items-center gap-2">
              {registo?.latitude && registo?.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${registo.latitude},${registo.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)' }}>
                  <MapPin size={11} /> Ver local
                </a>
              )}
              <span className="text-sm font-medium">
                {registo ? new Date(registo.hora.endsWith('Z') || registo.hora.includes('+') ? registo.hora : registo.hora + 'Z')
               .toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' }) : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileText size={14} /> Recibos
          <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>{recibos.length}</span>
        </h3>
      </div>
      <div onDragOver={e => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={e => { e.preventDefault(); setArrastando(false); adicionarRecibo(e.dataTransfer.files) }}
        onClick={() => inputRef.current.click()}
        className="flex flex-col items-center gap-2 py-6 rounded-2xl mb-4 cursor-pointer"
        style={{ border: `2px dashed ${arrastando ? 'var(--color-primary)' : 'var(--color-border)'}`, background: arrastando ? 'var(--color-primary-bg)' : 'var(--color-surface)' }}>
        <Upload size={22} style={{ color: arrastando ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
        <p className="text-sm font-medium">{arrastando ? 'Larga aqui!' : 'Clica ou arrasta um PDF'}</p>
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => adicionarRecibo(e.target.files)} />
      </div>
      {recibos.length === 0 ? (
        <p className="text-sm text-center py-6 rounded-2xl mb-4" style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>Nenhum recibo ainda</p>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {recibos.map(r => (
            <div key={r.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-success-bg)' }}>
                    <FileText size={14} color="var(--color-success)" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.mes}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.data_emissao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {r.url && <a href={r.url} download={r.nome} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}><Download size={14} color="var(--color-success)" /></a>}
                  <button onClick={() => removerRecibo(r.id)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-danger-bg)' }}><Trash2 size={14} color="var(--color-danger)" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zona de perigo — apagar funcionário */}
      <div className="p-4 rounded-2xl mt-2 mb-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-danger-border)' }}>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-danger)' }}>Apagar funcionário</p>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Remove permanentemente {dados.nome}, os seus registos de ponto e recibos. Esta ação não pode ser desfeita.
        </p>
        <button onClick={() => setConfirmarApagar(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
          <Trash2 size={14} /> Apagar funcionário
        </button>
      </div>

      {confirmarApagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setConfirmarApagar(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6" onClick={e => e.stopPropagation()}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-danger-bg)' }}>
              <Trash2 size={26} color="var(--color-danger)" />
            </div>
            <h2 className="text-lg font-bold mb-2">Apagar {dados.nome}?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Vais apagar permanentemente este funcionário e todos os seus dados (pontos, recibos e acesso). Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarApagar(false)} className="flex-1 py-3 rounded-xl font-medium text-sm"
                style={{ background: 'var(--color-surface-2)' }}>Cancelar</button>
              <button onClick={apagarFuncionario} disabled={apagando}
                className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ background: 'var(--color-danger)', color: 'white' }}>
                {apagando ? 'A apagar...' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetalheObra({ obra, funcionarios, registosHoje, onVoltar, onVerPerfil, onRecarregar, onArquivar }) {
  const [modalAssociar, setModalAssociar] = useState(false)
  const [modalLocalizacao, setModalLocalizacao] = useState(false)
  const [confirmarArquivar, setConfirmarArquivar] = useState(false)
  const [arquivando, setArquivando] = useState(false)
  const [removendo, setRemovendo] = useState(null)
  const [erro, setErro] = useState(null)

  const arquivar = async () => {
    try {
      setArquivando(true)
      setErro(null)
      await obrasAPI.apagar(obra.id)
      onArquivar()
    } catch { setErro('Erro ao arquivar a obra.'); setArquivando(false) }
  }

  const presentes = funcionarios.filter(f => calcularEstado(f.id, registosHoje) === 'presente').length
  const ausentes  = funcionarios.filter(f => calcularEstado(f.id, registosHoje) === 'ausente').length
  const sairam    = funcionarios.filter(f => calcularEstado(f.id, registosHoje) === 'saiu').length

  const remover = async (funcionarioId) => {
    try {
      setRemovendo(funcionarioId)
      await obraFuncionariosAPI.remover(obra.id, funcionarioId)
      onRecarregar()
    } catch { setErro('Erro ao remover.') }
    finally { setRemovendo(null) }
  }

  return (
    <div className="min-h-screen p-4 w-full max-w-lg mx-auto flex flex-col" style={{ paddingTop: '20px' }}>
      {modalAssociar && <ModalAssociarFuncionario obraId={obra.id} funcionariosNaObra={funcionarios} onFechar={() => setModalAssociar(false)} onAssociado={onRecarregar} />}
      {modalLocalizacao && <ModalLocalizacaoObra obra={obra} onFechar={() => setModalLocalizacao(false)} onGuardada={onRecarregar} />}
      <div className="flex items-center gap-3 py-4 mb-4">
        <button onClick={onVoltar} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{obra.nome}</h1>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            {obra.local}
            {obra.latitude
              ? <span className="flex items-center gap-0.5" style={{ color: 'var(--color-success)' }}>· <MapPin size={10} /> GPS</span>
              : <span style={{ color: 'var(--color-danger)' }}>· sem GPS</span>}
          </p>
        </div>
        <button onClick={() => setModalAssociar(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--color-primary)', color: 'white' }}>
          <UserPlus size={14} /> Adicionar
        </button>
      </div>

      {/* Ações da obra */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setModalLocalizacao(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium flex-1 justify-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <MapPin size={13} color="var(--color-primary)" /> {obra.latitude ? 'Editar localização' : 'Definir localização'}
        </button>
        <button onClick={() => setConfirmarArquivar(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
          <Archive size={13} /> Arquivar obra
        </button>
      </div>

      {confirmarArquivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setConfirmarArquivar(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6" onClick={e => e.stopPropagation()}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-danger-bg)' }}>
              <Archive size={26} color="var(--color-danger)" />
            </div>
            <h2 className="text-lg font-bold mb-2">Arquivar "{obra.nome}"?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              A obra deixa de aparecer na lista, mas o histórico de pontos é mantido. Podes reativá-la mais tarde na base de dados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarArquivar(false)} className="flex-1 py-3 rounded-xl font-medium text-sm"
                style={{ background: 'var(--color-surface-2)' }}>Cancelar</button>
              <button onClick={arquivar} disabled={arquivando}
                className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ background: 'var(--color-danger)', color: 'white' }}>
                {arquivando ? 'A arquivar...' : 'Arquivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {erro && <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}><AlertCircle size={14} /> {erro}</div>}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Em obra', value: presentes, bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
          { label: 'Saíram', value: sairam, bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
          { label: 'Ausentes', value: ausentes, bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: s.bg }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
      <h2 className="text-base font-bold mb-3 flex items-center gap-2"><Users size={16} /> Funcionários · hoje</h2>
      <div className="flex flex-col gap-2">
        {funcionarios.length === 0 ? (
          <div className="flex flex-col items-center py-10 rounded-2xl gap-3"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Users size={28} style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Nenhum funcionário nesta obra</p>
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
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.funcao} · {parseFloat(f.valor_hora || 0).toFixed(2)}€/h</p>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <BadgeEstado estado={calcularEstado(f.id, registosHoje)} />
              <button onClick={() => remover(f.id)} disabled={removendo === f.id}
                className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30"
                style={{ background: 'var(--color-danger-bg)' }}>
                <UserMinus size={14} color="var(--color-danger)" />
              </button>
              <button onClick={() => onVerPerfil(f)} className="w-8 h-8 rounded-xl flex items-center justify-center"
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

export default function DashboardAdmin() {
  const [vista, setVista] = useState('obras')
  const [aba, setAba] = useState('obras')
  const [origemPerfil, setOrigemPerfil] = useState('detalhe')
  const [obraAtiva, setObraAtiva] = useState(null)
  const [funcionarioAtivo, setFuncionarioAtivo] = useState(null)
  const [obras, setObras] = useState([])
  const [funcionariosTodos, setFuncionariosTodos] = useState([])
  const [registosHoje, setRegistosHoje] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [modalObra, setModalObra] = useState(false)
  const [modalFuncionario, setModalFuncionario] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    carregarDados()
    const intervalo = setInterval(() => carregarDados(true), 30000)
    return () => clearInterval(intervalo)
  }, [])

  const carregarDados = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true)
      setErro(null)
      const [obrasData, funcionariosData] = await Promise.all([
        obrasAPI.listar(),
        funcionariosAPI.listar(),
      ])
      setObras(obrasData)
      setFuncionariosTodos(funcionariosData)
      // Mantém a obra aberta sincronizada com os dados frescos (funcionários, localização...)
      setObraAtiva(prev => prev ? obrasData.find(o => o.id === prev.id) || null : null)
      const todosRegistos = []
      for (const obra of obrasData) {
        try { const registos = await pontoAPI.obraHoje(obra.id); todosRegistos.push(...registos) } catch {}
      }
      setRegistosHoje(todosRegistos)
    } catch { setErro('Erro ao carregar dados.') }
    finally { setLoading(false) }
  }

  const getFuncionariosObra = (obra) => (obra.obra_funcionarios || []).map(of => of.funcionarios).filter(Boolean)

  const voltarDoPerfil = origemPerfil === 'detalhe' ? 'detalhe' : 'obras'

  if (vista === 'perfil' && funcionarioAtivo) {
    return <PerfilFuncionario funcionario={funcionarioAtivo} registosHoje={registosHoje}
      onVoltar={() => setVista(voltarDoPerfil)}
      onApagar={() => { setFuncionarioAtivo(null); setVista(voltarDoPerfil); carregarDados() }} />
  }

  if (vista === 'detalhe' && obraAtiva) {
    return (
      <DetalheObra
        obra={obraAtiva} funcionarios={getFuncionariosObra(obraAtiva)} registosHoje={registosHoje}
        onVoltar={() => setVista('obras')}
        onVerPerfil={f => { setOrigemPerfil('detalhe'); setFuncionarioAtivo(f); setVista('perfil') }}
        onRecarregar={carregarDados}
        onArquivar={() => { setObraAtiva(null); setVista('obras'); carregarDados() }}
      />
    )
  }

  const abrirPerfil = (f) => { setOrigemPerfil('lista'); setFuncionarioAtivo(f); setVista('perfil') }
  const totalPresentes = funcionariosTodos.filter(f => calcularEstado(f.id, registosHoje) === 'presente').length

  return (
    <div className="min-h-screen p-4 w-full max-w-lg mx-auto flex flex-col justify-center gap-5"
      style={{ background: 'rgba(15, 15, 15, 0.50)' }}>

      {modalObra && <ModalNovaObra onFechar={() => setModalObra(false)} onCriada={carregarDados} />}
      {modalFuncionario && <ModalNovoFuncionario onFechar={() => setModalFuncionario(false)} onCriado={carregarDados} />}

      <div className="flex items-center gap-3 py-2">
        <div className="flex-1">
          <h1 className="text-xl font-bold">Kingdom Selection</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Painel do gestor · {new Date().toLocaleDateString('pt-PT')}</p>
        </div>
        <button onClick={() => carregarDados()} className="text-xs px-3 py-1.5 rounded-xl mr-2"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>↻</button>
        <button onClick={() => { logout(); navigate('/login') }} className="text-xs px-3 py-1.5 rounded-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>Sair</button>
      </div>

      {erro && <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}><AlertCircle size={14} /> {erro}</div>}

      {loading ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>A carregar dados...</p>
      ) : (
        <>
          <div className="p-4 rounded-2xl flex items-center justify-between"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total em obra agora</p>
              <p className="text-3xl font-bold mt-1">{totalPresentes}
                <span className="text-base font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>/ {funcionariosTodos.length} funcionários</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
              <Users size={22} color="var(--color-success)" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setModalObra(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <Plus size={16} color="var(--color-primary)" /> Nova obra
            </button>
            <button onClick={() => setModalFuncionario(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <UserPlus size={16} color="var(--color-primary)" /> Novo funcionário
            </button>
          </div>

          {/* Seletor de abas */}
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            {[
              { id: 'obras', label: 'Obras', icon: <Building2 size={15} />, count: obras.length },
              { id: 'funcionarios', label: 'Funcionários', icon: <Users size={15} />, count: funcionariosTodos.length },
            ].map(t => (
              <button key={t.id} onClick={() => setAba(t.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={aba === t.id
                  ? { background: 'var(--color-primary)', color: 'white' }
                  : { background: 'transparent', color: 'var(--color-text-muted)' }}>
                {t.icon} {t.label}
                <span className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: aba === t.id ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-2)' }}>{t.count}</span>
              </button>
            ))}
          </div>

          {aba === 'obras' ? (
            obras.length === 0 ? (
            <div className="flex flex-col items-center py-12 rounded-2xl gap-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <Building2 size={32} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Nenhuma obra ativa</p>
              <button onClick={() => setModalObra(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
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
                  <button key={obra.id} onClick={() => { setObraAtiva(obra); setVista('detalhe') }}
                    className="w-full text-left px-4 py-4 rounded-2xl hover:opacity-80"
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
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>{presentes} presentes</span>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>{ausentes} ausentes</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{funcionarios.length} total</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )
          ) : (
            /* ── Aba: lista de todos os funcionários ── */
            funcionariosTodos.length === 0 ? (
              <div className="flex flex-col items-center py-12 rounded-2xl gap-3"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <Users size={32} style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Nenhum funcionário registado</p>
                <button onClick={() => setModalFuncionario(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--color-primary)', color: 'white' }}>
                  <UserPlus size={14} /> Criar primeiro funcionário
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {funcionariosTodos.map(f => (
                  <button key={f.id} onClick={() => abrirPerfil(f)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left hover:opacity-80 transition-all"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                        style={{ background: 'var(--color-surface-2)', color: 'var(--color-primary)' }}>
                        {f.nome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{f.nome}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                          {f.funcao || 'Sem função'} · {parseFloat(f.valor_hora || 0).toFixed(2)}€/h
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <BadgeEstado estado={calcularEstado(f.id, registosHoje)} />
                      <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}