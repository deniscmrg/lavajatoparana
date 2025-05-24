
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Servicos from './pages/servicos';
import Veiculos from './pages/veiculos';
import Clientes from './pages/clientes';
import OrdensServico from './pages/ordemservico';
import Caixa from './pages/caixa/Caixa';
import Faturas from './pages/faturas';
import PrivateRoute from './routes/PrivateRoute';
import AcessoNegado from './pages/AcessoNegado'; // certifique-se que esse componente exista
import './global/global.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/acesso-negado" element={<AcessoNegado />} />

        {/* Rotas para admin */}
        <Route element={<PrivateRoute allowedRoles={['admin']} />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="veiculos" element={<Veiculos />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="faturas" element={<Faturas />} />
            <Route path="caixa" element={<Caixa />} />
          </Route>
        </Route>

        {/* Rotas compartilhadas (admin + operador) */}
        <Route element={<PrivateRoute allowedRoles={['admin', 'operador']} />}>
          <Route element={<Layout />}>
            <Route path="ordens" element={<OrdensServico />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
