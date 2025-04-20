import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Servicos from './pages/servicos';
import PrivateRoute from './routes/PrivateRoute';
import Veiculos from './pages/veiculos';
import Clientes from './pages/clientes';
import OrdensServico from './pages/ordemservico';
import Caixa from './pages/caixa/Caixa';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ordens" element={<OrdensServico />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="veiculos" element={<Veiculos />} />
          <Route path="caixa" element={<Caixa />} />
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
