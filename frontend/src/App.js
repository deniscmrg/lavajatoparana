import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Servicos from './pages/servicos';
import PrivateRoute from './routes/PrivateRoute';
import Veiculos from './pages/veiculos';
import Clientes from './pages/clientes';
import OrdensServico from './pages/ordemservico';
import Caixa from './pages/caixa/Caixa';
import './global/global.css';
import Faturas from './pages/faturas';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública de login */}
        <Route path="/login" element={<Login />} />

        {/* Rota protegida que verifica o token */}
        <Route path="/" element={<PrivateRoute />}>
          {/* Layout com menu e cabeçalho */}
          <Route element={<Layout />}>
            {/* Redireciona / para /dashboard */}
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ordens" element={<OrdensServico />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="veiculos" element={<Veiculos />} />
            <Route path="caixa" element={<Caixa />} />
            <Route path="faturas" element={<Faturas />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

