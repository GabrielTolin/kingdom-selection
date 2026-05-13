import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { supabase } from '../context/AuthContext'
import logoKS from '../assets/logo-ks.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
<div className="min-h-screen flex flex-col items-center justify-start pt-48 p-6"
      style={{ background: 'rgba(15, 15, 15, 0.15)' }}>
      <div className="w-full max-w-sm" style={{ marginTop: '240px' }}>

        

        <h1 className="text-3xl font-bold mb-2">Bem-vindo</h1>
        <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Entra na tua conta para continuar
        </p>

        {erro && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: '#2A1A1A', border: '1px solid #EF444433' }}>
            <AlertCircle size={18} color="var(--color-danger)" />
            <span className="text-sm">{erro}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="o.teu@email.com" required
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold mt-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: 'white' }}>
            {loading ? 'A entrar...' : <> Entrar <ArrowRight size={18} /> </>}
          </button>
        </form>

        <p className="text-xs text-center mt-8" style={{ color: 'var(--color-text-muted)' }}>
          Kingdom Selection · Canalizações
        </p>

      </div>
    </div>
  )
}