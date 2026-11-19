import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Journeys from './pages/Journeys'
import TimeRecords from './pages/TimeRecords'
import Requests from './pages/Requests'
import Reports from './pages/Reports'
import Activities from './pages/Activities'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/cadastro" element={<Auth mode="cad" />} />
      <Route path="/recuperar-senha" element={<Auth mode="rec" />} />
      <Route path="/redefinir-senha" element={<Auth mode="red" />} />
      <Route path="/admin" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="funcionarios" element={<Employees />} />
        <Route path="jornadas" element={<Journeys />} />
        <Route path="registros" element={<TimeRecords />} />
        <Route path="solicitacoes" element={<Requests />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="atividades" element={<Activities />} />
        <Route path="configuracoes" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
