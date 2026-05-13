import { useState, useEffect } from 'react'
import { LogIn, LogOut, Clock, CheckCircle, FileText, AlertCircle, LogOut as LogOutIcon, MapPin, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { pontoAPI, funcionariosAPI, obrasAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { obterLocalizacao, estaDentroDoRaio } from '../../utils/gps'
import logoKS from '../../assets/logo-ks.png'

export default function PontoFuncionario() {
  const { perfil, logout } = useAuth()
  const [funcionario, setFuncionario] = useState(null)
  const [registos, setRegistos] = useState([])
  const [dentroObra, setDentroObra] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registando, setRegistando] = useState(false)
  const [erro, setErro] = useState(null)
  const [erroGPS, setErroGPS] = useState(null)
  const [obraAtual, setObraAtual] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil?.funcionario_id) carregarTudo()
  }, [perfil])

  const carregarTudo = async () => {
    try {
      setLoading(true)
      setErro(null)
      const [dadosFuncionario, registosHoje] = await Promise.all([
        funcionariosAPI.buscar(perfil.funcionario_id),
        pontoAPI.hoje(perfil.funcionario_id),
      ])
      setFuncionario(dadosFuncionario)
      setRegistos(registosHoje)
      const ultimo = registosHoje[registosHoje.length - 1]
      setDentroObra(ultimo?.tipo === 'entrada')
      const todasObras = await obrasAPI.listar()
      const obraDoFuncionario = todasObras.find(o =>
        o.obra_funcionarios?.some(of => of.funcionario_id === perfil.funcionario_id)
      )
      setObraAtual(obraDoFuncionario || null)
    } catch {
      setErro('Erro ao carregar dados. Verifica a ligação.')
    } finally {
      setLoading(false)
    }
  }

  const marcarPonto = async (tipo) => {
    try {
      setRegistando(true)
      setErro(null)
      setErroGPS(null)
      let localizacaoAtual = null
      try {
        localizacaoAtual = await obterLocalizacao()
      } catch (gpsErr) {
        if (obraAtual?.latitude) {
          setErroGPS(`GPS: ${gpsErr.message}. Não é possível validar a localização.`)
          setRegistando(false)
          return
        }
      }
      if (localizacaoAtual && obraAtual?.latitude) {
        if (!estaDentroDoRaio(localizacaoAtual, obraAtual)) {
          setErroGPS(`Estás fora do raio permitido da obra (${obraAtual.raio_metros || 200}m). Aproxima-te do local de trabalho.`)
          setRegistando(false)
          return
        }
      }
      await pontoAPI.registar(perfil.funcionario_id, obraAtual?.id || null, tipo, localizacaoAtual)
      const atualizados = await pontoAPI.hoje(perfil.funcionario_id)
      setRegistos(atualizados)
      setDentroObra(atualizados[atualizados.length - 1]?.tipo === 'entrada')
      setFeedback(tipo)
      setTimeout(() => setFeedback(null), 2500)
    } catch {
      setErro('Erro ao registar ponto. Tenta novamente.')
    } finally {
      setRegistando(false)
    }
  }

  const primeiroNome = funcionario?.nome?.split(' ')[0] || ''

  return (
        <div className="min-h-screen p-4 w-full max-w-sm mx-auto flex flex-col justify-start gap-6"    
        style={{ background: 'rgba(15, 15, 15, 0.15)'  }}>

      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-4">
        <div className="flex items-center gap-3">
          
          <div>
            {loading
              ? <div className="h-5 w-28 rounded-lg animate-pulse" style={{ background: 'var(--color-surface)' }} />
              : <p className="font-bold text-sm">Olá, {primeiroNome} 👷</p>
            }
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {new Date().toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: dentroObra ? '#16352A' : '#2A1A1A',
              color: dentroObra ? 'var(--color-success)' : 'var(--color-danger)',
            }}>
            <span className="w-2 h-2 rounded-full"
              style={{ background: dentroObra ? 'var(--color-success)' : 'var(--color-danger)' }} />
            {dentroObra ? 'Em obra' : 'Fora'}
          </div>
          <button onClick={async () => { await logout(); navigate('/login') }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <LogOutIcon size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Info funcionário */}
      {funcionario && (
        <div className="flex items-center gap-3 p-3 rounded-2xl mb-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-primary)' }}>
            {funcionario.nome.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm">{funcionario.nome}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {funcionario.funcao} · {parseFloat(funcionario.valor_hora).toFixed(2)}€/h
            </p>
          </div>
        </div>
      )}

      {/* Obra atual */}
      {obraAtual && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
          style={{ background: 'var(--color-surface-2)' }}>
          <MapPin size={13} color="var(--color-primary)" />
          <span className="text-xs font-medium">{obraAtual.nome}</span>
          {obraAtual.latitude && (
            <span className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>
              📍 GPS ativo
            </span>
          )}
        </div>
      )}

      {/* Erros */}
      {erroGPS && (
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-4"
          style={{ background: '#2A1208', border: '1px solid #F9731633' }}>
          <MapPin size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span className="text-sm">{erroGPS}</span>
        </div>
      )}
      {erro && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
          style={{ background: '#2A1A1A', border: '1px solid #EF444433' }}>
          <AlertCircle size={18} color="var(--color-danger)" />
          <span className="text-sm">{erro}</span>
        </div>
      )}
      {feedback && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
          style={{ background: feedback === 'entrada' ? '#16352A' : '#2A1A1A' }}>
          <CheckCircle size={20} color={feedback === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)'} />
          <span className="font-medium text-sm">
            {feedback === 'entrada' ? 'Entrada registada!' : 'Saída registada!'}
          </span>
        </div>
      )}

      {/* Botões ponto */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button onClick={() => marcarPonto('entrada')} disabled={dentroObra || loading || registando}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl transition-all active:scale-95 disabled:opacity-30"
          style={{ background: '#16352A', border: '1px solid #22C55E33' }}>
          {registando ? <Loader size={28} color="var(--color-success)" /> : <LogIn size={28} color="var(--color-success)" />}
          <span className="font-bold text-sm" style={{ color: 'var(--color-success)' }}>ENTRADA</span>
        </button>
        <button onClick={() => marcarPonto('saida')} disabled={!dentroObra || loading || registando}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl transition-all active:scale-95 disabled:opacity-30"
          style={{ background: '#2A1A1A', border: '1px solid #EF444433' }}>
          {registando ? <Loader size={28} color="var(--color-danger)" /> : <LogOut size={28} color="var(--color-danger)" />}
          <span className="font-bold text-sm" style={{ color: 'var(--color-danger)' }}>SAÍDA</span>
        </button>
      </div>

      {/* Botão recibos */}
      <button onClick={() => navigate('/recibos')}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-6 transition-all hover:opacity-80"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#16352A' }}>
            <FileText size={15} color="var(--color-success)" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Os meus recibos</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Ver e descarregar vencimentos</p>
          </div>
        </div>
      </button>

      {/* Histórico */}
      <h2 className="text-base font-bold mb-3 flex items-center gap-2">
        <Clock size={16} /> Registos de hoje
      </h2>
      {loading ? (
        <p className="text-sm py-6 text-center rounded-2xl"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>A carregar...</p>
      ) : registos.length === 0 ? (
        <p className="text-sm py-6 text-center rounded-2xl"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>Nenhum registo ainda hoje</p>
      ) : (
        <div className="flex flex-col gap-2">
          {registos.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full"
                  style={{ background: r.tipo === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)' }} />
                <span className="text-sm font-medium capitalize">{r.tipo}</span>
                {r.latitude && <MapPin size={11} style={{ color: 'var(--color-text-muted)' }} />}
              </div>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {new Date(r.hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}