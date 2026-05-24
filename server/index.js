import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import funcionariosRoutes from './routes/funcionarios.js'
import obrasRoutes from './routes/obras.js'
import pontoRoutes from './routes/ponto.js'
import recibosRoutes from './routes/recibos.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://kingdom-selection.vercel.app'
  ]
}))
app.use(express.json())

// Rotas
app.use('/api/funcionarios', funcionariosRoutes)
app.use('/api/obras',        obrasRoutes)
app.use('/api/ponto',        pontoRoutes)
app.use('/api/recibos',      recibosRoutes)

// Rota de teste — confirma que o servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '✅ ObraPoint API a funcionar!' })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr em http://localhost:${PORT}`)
  console.log(`🔗 Testa a API em http://localhost:${PORT}/api/health`)
})