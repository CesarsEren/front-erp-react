import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import LoginPage from '@/pages/auth/LoginPage'
import MainLayout from '@/components/layout/MainLayout'
import GuiaRemisionPage from '@/pages/administrativos/GuiaRemisionPage'
import SendSunatPage from '@/pages/administrativos/SendSunatPage'
import SearchInvoicesPage from '@/pages/tributarios/SearchInvoicesPage'
import SendSunatTributariosPage from '@/pages/tributarios/SendSunatTributariosPage'
import ReportGrtEncomiendaPage from '@/pages/reportes/ReportGrtEncomiendaPage'
import ConsultaDocumentosPage from '@/pages/public/ConsultaDocumentosPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  // Aplicar tema según el modo de ejecución
  useTheme()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/consulta-documentos" element={<ConsultaDocumentosPage />} />
      <Route
        path="/main"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="grt-generacion" replace />} />
        <Route path="grt-generacion" element={<GuiaRemisionPage />} />
        <Route path="grt-send" element={<SendSunatPage />} />
        <Route path="tributarios/search" element={<SearchInvoicesPage />} />
        <Route path="tributarios/send" element={<SendSunatTributariosPage />} />
        <Route path="reportes/grt-encomienda" element={<ReportGrtEncomiendaPage />} />
      </Route>
    </Routes>
  )
}

export default App
