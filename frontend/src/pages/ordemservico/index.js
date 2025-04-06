import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import OrdemServicoForm from './ordemservicoForm';
import './ordemServico.css';

function OrdensServico() {
  const [ordens, setOrdens] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [ordemParaEditar, setOrdemParaEditar] = useState(null);

  const carregarOrdens = async () => {
    try {
      const res = await api.get('/ordens-servico/');
      const ordenadas = res.data.sort((a, b) => new Date(b.data) - new Date(a.data));
      setOrdens(ordenadas);
    } catch {
      alert('Erro ao carregar ordens de serviço.');
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  const abrirForm = (os = null) => {
    setOrdemParaEditar(os);
    setFormAberto(true);
  };

  const excluirOrdem = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta ordem de serviço?')) return;
    try {
      await api.delete(`/ordens-servico/${id}/`);
      carregarOrdens();
    } catch {
      alert('Erro ao excluir a OS.');
    }
  };

  const ordensFiltradas = ordens.filter(os =>
    os.cliente_nome.toLowerCase().includes(filtro.toLowerCase()) ||
    os.placa.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="pagina-listagem">
      <div className="cabecalho">
        <h2>Ordens de Serviço</h2>
        <button className="btn btn-primary" onClick={() => abrirForm()}>+ Nova OS</button>
      </div>

      <input
        className="input-filtro"
        placeholder="Filtrar por cliente ou placa..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
      />

      <table className="tabela">
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Placa</th>
            <th>Status</th>
            <th>Pagamento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {ordensFiltradas.map(os => (
            <tr key={os.id}>
              <td>{os.id}</td>
              <td>{new Date(os.data).toLocaleString()}</td>
              <td>{os.cliente_nome}</td>
              <td>{os.placa}</td>
              <td>{os.status}</td>
              <td>{os.forma_pagamento}</td>
              <td>
                <button className="icon-button" onClick={() => abrirForm(os)}>✏️</button>
                <button className="icon-button excluir" onClick={() => excluirOrdem(os.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {formAberto && (
        <OrdemServicoForm
          onClose={() => {
            setFormAberto(false);
            carregarOrdens();
          }}
          editData={ordemParaEditar}
        />
      )}
    </div>
  );
}

export default OrdensServico;

