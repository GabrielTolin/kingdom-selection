import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Download, ChevronDown, ChevronUp, AlertCircle, Clock, Euro } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { recibosAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'



export default function Recibos() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [recibos, setRecibos] = useState([])
  const [expandido, setExpandido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    carregarRecibos()
  }, [])

  const carregarRecibos = async () => {
    try {
      setLoading(true)
      setErro(null)
      const data = await recibosAPI.listar(perfil?.funcionario_id)
      setRecibos(data)
    } catch (err) {
      setErro('Erro ao carregar recibos. Verifica a ligação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 w-full max-w-sm mx-auto flex flex-col"
      style={{ background: 'var(--color-bg)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-6">
        <button onClick={() => navigate('/ponto')}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold">Os meus recibos</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Vencimentos disponíveis para download
          </p>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
          style={{ background: '#2A1A1A', border: '1px solid #EF444433' }}>
          <AlertCircle size={18} color="var(--color-danger)" />
          <span className="text-sm">{erro}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p className="text-sm py-6 text-center rounded-2xl"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>
          A carregar recibos...
        </p>

      /* Sem recibos */
      ) : recibos.length === 0 ? (
        <div className="flex flex-col items-center py-12 rounded-2xl gap-3"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <FileText size={32} style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Ainda não tens recibos disponíveis
          </p>
          <p className="text-xs text-center px-6" style={{ color: 'var(--color-text-muted)' }}>
            O teu gestor irá adicionar os recibos quando disponíveis
          </p>
        </div>

      /* Lista de recibos */
      ) : (
        <div className="flex flex-col gap-3">
          {recibos.map(r => (
            <div key={r.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

              {/* Cabeçalho */}
              <button onClick={() => setExpandido(expandido === r.id ? null : r.id)}
                className="w-full flex items-center justify-between px-4 py-4 hover:opacity-80 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#16352A' }}>
                    <FileText size={16} color="var(--color-success)" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{r.mes}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {r.data_emissao
                        ? `Emitido em ${new Date(r.data_emissao).toLocaleDateString('pt-PT')}`
                        : 'Sem data'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: 'var(--color-success)' }}>
                    {r.total ? `${parseFloat(r.total).toFixed(2)}€` : '—'}
                  </span>
                  {expandido === r.id
                    ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} />
                    : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />
                  }
                </div>
              </button>

              {/* Detalhes expandidos */}
              {expandido === r.id && (
                <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="flex flex-col gap-2 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Horas trabalhadas
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {r.horas_trabalhadas ? `${parseFloat(r.horas_trabalhadas).toFixed(1)}h` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Euro size={13} style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Valor/hora</span>
                      </div>
                      <span className="text-sm font-medium">
                        {r.valor_hora ? `${parseFloat(r.valor_hora).toFixed(2)}€` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2"
                      style={{ borderTop: '1px solid var(--color-border)' }}>
                      <span className="text-sm font-bold">Total</span>
                      <span className="font-bold" style={{ color: 'var(--color-success)' }}>
                        {r.total ? `${parseFloat(r.total).toFixed(2)}€` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Download */}
                  {r.ficheiro_url ? (
                    <a href={r.ficheiro_url} target="_blank" rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                      style={{ background: 'var(--color-primary)', color: 'white' }}>
                      <Download size={16} /> Descarregar PDF
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                      style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                      <FileText size={15} /> PDF ainda não disponível
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  )
}