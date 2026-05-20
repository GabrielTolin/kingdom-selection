import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RotaProtegida } from './components/RotaProtegida'
import Login from './pages/Login'
import PontoFuncionario from './pages/funcionarios/Ponto'
import Recibos from './pages/funcionarios/Recibos'
import DashboardAdmin from './pages/admin/Dashboard'
import logoKS from './assets/logo-ks.png'

function App() {
  return (
    <AuthProvider>
      {/* Fundo adaptado para mobile e desktop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url(${logoKS})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.1,
        zIndex: 0,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ponto" element={<RotaProtegida><PontoFuncionario /></RotaProtegida>} />
          <Route path="/recibos" element={<RotaProtegida><Recibos /></RotaProtegida>} />
          <Route path="/admin" element={<RotaProtegida apenasAdmin><DashboardAdmin /></RotaProtegida>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App