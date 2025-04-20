// src/pages/caixa/Caixa.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import CaixaForm from './CaixaForm';
import './caixa.css';

function Caixa() {
  const [lancamentos, setLancamentos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [sortColumn, setSortColumn] = useState('data');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchLancamentos = async () => {
    try {
      const response = await api.get('caixa/');
      setLancamentos(response.data);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      alert('Erro de sessão. Faça login novamente.');
    }
  };

  useEffect(() => {
    fetchLancamentos();
  }, []);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortArrow = (column) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este lançamento?')) {
      await api.delete(`caixa/${id}/`);
      fetchLancamentos();
    }
  };

  const lancamentosFiltrados = lancamentos
    .filter((l) =>
      l.origem.toLowerCase().includes(filtro.toLowerCase()) ||
      l.descricao.toLowerCase().includes(filtro.toLowerCase()) ||
      l.categoria.toLowerCase().includes(filtro.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortColumn]?.toString().toLowerCase();
      const valB = b[sortColumn]?.toString().toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="pagina-caixa">
      <div className="header-caixa">
        <button className="btn btn-primary" onClick={() => { setEditData(null); setShowForm(true); }}>Novo</button>
        <h2>Controle de Caixa</h2>
      </div>

      <div className="filtro-caixa">
        <input
          type="text"
          placeholder="Filtrar por origem, descrição ou categoria"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <table className="tabela-caixa">
        <thead>
          <tr>
            <th onClick={() => handleSort('data')}>Data{renderSortArrow('data')}</th>
            <th onClick={() => handleSort('origem')}>Origem{renderSortArrow('origem')}</th>
            <th onClick={() => handleSort('descricao')}>Descrição{renderSortArrow('descricao')}</th>
            <th onClick={() => handleSort('categoria')}>Categoria{renderSortArrow('categoria')}</th>
            <th onClick={() => handleSort('tipo')}>Tipo{renderSortArrow('tipo')}</th>
            <th onClick={() => handleSort('valor')}>Valor{renderSortArrow('valor')}</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lancamentosFiltrados.map((l) => (
            <tr key={l.id}>
              <td>{l.data}</td>
              <td>{l.origem}</td>
              <td>{l.descricao}</td>
              <td>{l.categoria}</td>
              <td>{l.tipo}</td>
              <td>R$ {parseFloat(l.valor).toFixed(2)}</td>
              <td>
                <button className="icon-button excluir" onClick={() => handleDelete(l.id)} title="Excluir">
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    {showForm && <CaixaForm onClose={() => { setShowForm(false); fetchLancamentos(); }} editData={editData} />}
    </div>
  );
}

export default Caixa;
