import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Protege rotas — redireciona para login se não estiver autenticado
export function RotaProtegida({ children, apenasAdmin = false }) {
  const { utilizador, perfil, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: 'var(--color-primary)' }}>
            <span className="text-white font-bold">O</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>A carregar...</p>
        </div>
      </div>
    )
  }

  if (!utilizador) return <Navigate to="/login" replace />

  if (apenasAdmin && perfil?.role !== 'admin') {
    return <Navigate to="/ponto" replace />
  }

  return children
}