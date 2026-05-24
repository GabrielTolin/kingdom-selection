import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbzfvipcslqczxqivkjn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiemZ2aXBjc2xxY3p4cWl2a2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODIzMzksImV4cCI6MjA5MzA1ODMzOX0.JEgLRZxr1GVlfa03bFf40o6bedfCe7q8AGE8njIanCk'

export const supabase = createClient(supabaseUrl, supabaseKey)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [utilizador, setUtilizador] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão ativa ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUtilizador(session?.user ?? null)
      if (session?.user) carregarPerfil(session.user.id)
      else setLoading(false)
    })

    // Ouvir mudanças de sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUtilizador(session?.user ?? null)
      if (session?.user) carregarPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const carregarPerfil = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*, funcionarios(*)')
        .eq('id', userId)
        .single()

      if (!error) setPerfil(data)
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUtilizador(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ utilizador, perfil, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}