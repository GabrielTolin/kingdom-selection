import { useState } from 'react'
import { Lock, X, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../context/AuthContext'

// Modal para o próprio utilizador autenticado alterar a sua password
export default function AlterarPasswordModal({ onFechar }) {
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [ver, setVer] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const guardar = async () => {
    setErro(null)
    if (nova.length < 6) return setErro('A password deve ter pelo menos 6 caracteres')
    if (nova !== confirmar) return setErro('As passwords não coincidem')
    try {
      setGuardando(true)
      const { error } = await supabase.auth.updateUser({ password: nova })
      if (error) throw error
      setSucesso(true)
      setTimeout(onFechar, 2000)
    } catch (err) {
      if (err.message?.toLowerCase().includes('different from the old')) {
        setErro('A nova password tem de ser diferente da atual.')
      } else {
        setErro('Não foi possível alterar a password. Tenta novamente.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onFechar}>
      <div className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><Lock size={18} /> Alterar password</h2>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-surface-2)' }}>
            <X size={16} />
          </button>
        </div>

        {sucesso ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
              <CheckCircle size={26} color="var(--color-success)" />
            </div>
            <p className="font-medium text-sm text-center">Password alterada com sucesso!</p>
          </div>
        ) : (
          <>
            {erro && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
                style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                <AlertCircle size={14} /> {erro}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Nova password</label>
                <div className="relative">
                  <input type={ver ? 'text' : 'password'} value={nova} onChange={e => setNova(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                  <button type="button" onClick={() => setVer(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                    {ver ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Confirmar nova password</label>
                <input type={ver ? 'text' : 'password'} value={confirmar} onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repete a nova password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
              </div>
            </div>
            <button onClick={guardar} disabled={guardando}
              className="w-full py-3 rounded-xl font-semibold mt-6 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: 'white' }}>
              {guardando ? 'A guardar...' : 'Guardar nova password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
