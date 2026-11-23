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
import EmpDashboard from './pages/employee/EmpDashboard'
import ClockIn from './pages/employee/ClockIn'
import History from './pages/employee/History'
import MyRequests from './pages/employee/MyRequests'
import MyProfile from './pages/employee/MyProfile'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/cadastro" element={<Auth mode="cad" />} />
      <Route path="/recuperar-senha" element={<Auth mode="rec" />} />
      <Route path="/redefinir-senha" element={<Auth mode="red" />} />
      <Route path="/admin" element={<Layout role="admin" />}>
        <Route index element={<Dashboard />} />
        <Route path="funcionarios" element={<Employees />} />
        <Route path="jornadas" element={<Journeys />} />
        <Route path="registros" element={<TimeRecords />} />
        <Route path="solicitacoes" element={<Requests />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="atividades" element={<Activities />} />
        <Route path="configuracoes" element={<Settings />} />
      </Route>
      <Route path="/funcionario" element={<Layout role="func" />}>
        <Route index element={<EmpDashboard />} />
        <Route path="registrar-ponto" element={<ClockIn />} />
        <Route path="historico" element={<History />} />
        <Route path="correcoes" element={<MyRequests />} />
        <Route path="perfil" element={<MyProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
