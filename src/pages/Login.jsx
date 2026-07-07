import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setErro(null)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('role')
        .eq('id', data.user.id)
        .single()
      if (perfilError || !perfil) throw new Error('Perfil não encontrado')
      if (perfil.role === 'admin') navigate('/admin')
      else navigate('/ponto')
    } catch (err) {
      console.error(err)
      setErro('Email ou password incorretos. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Marca */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-3xl font-bold">Bem-vindo</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Entra na tua conta para continuar
          </p>
        </div>

        {/* Cartão de login */}
        <div className="rounded-3xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

          {erro && (
            <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
              style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}>
              <AlertCircle size={18} color="var(--color-danger)" style={{ flexShrink: 0 }} />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="o.teu@email.com" required
                className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-all focus:border-[var(--color-primary)]"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Password</label>
              <div className="relative">
                <input type={verPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 pr-11 rounded-xl outline-none text-sm transition-all focus:border-[var(--color-primary)]"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                <button type="button" onClick={() => setVerPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold mt-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: 'white', boxShadow: '0 4px 20px var(--color-primary-glow)' }}>
              {loading ? 'A entrar...' : <> Entrar <ArrowRight size={18} /> </>}
            </button>
          </form>
        </div>

        <p className="text-xs text-center mt-8" style={{ color: 'var(--color-text-muted)' }}>
          Kingdom Selection · Canalizações
        </p>

      </div>
    </div>
  )
}
