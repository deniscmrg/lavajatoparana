import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './servicos.css';
import ServicoForm from './servicoForm.js';
import { Edit, Trash2 } from 'lucide-react';

function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [sortColumn, setSortColumn] = useState('descricao');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchServicos = async () => {
    try {
      const response = await api.get('servicos/');
      setServicos(response.data);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      alert('Sessão expirada ou sem permissão. Faça login novamente.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      await api.delete(`servicos/${id}/`);
      fetchServicos();
    }
  };

  const handleEdit = (servico) => {
    setEditData(servico);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditData(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    fetchServicos();
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedServicos = [...servicos].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Força lowercase em texto
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const servicosFiltrados = sortedServicos.filter((s) =>
    s.descricao.toLowerCase().includes(filtro.toLowerCase())
  );

  const renderSortArrow = (column) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="pagina-servicos">
      <div className="header-servicos">
        <h2>Serviços</h2>
        <button className="btn btn-primary" onClick={handleNew}>Novo Serviço</button>
      </div>

      <div className="filtro-servicos">
        <input
          type="text"
          placeholder="Filtrar por nome do serviço"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className='tabela-scroll'>
        <table className='tabela'>
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('descricao')}>Descrição{renderSortArrow('descricao')}</th>
              <th className="sortable" onClick={() => handleSort('valor_unitario')}>Valor Unitário{renderSortArrow('valor_unitario')}</th>
              <th className="sortable" onClick={() => handleSort('status')}>Status{renderSortArrow('status')}</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {servicosFiltrados.map((servico) => (
              <tr key={servico.id}>
                <td>{servico.descricao}</td>
                <td>R$ {Number(servico.valor_unitario).toFixed(2)}</td>
                <td>{servico.status ? 'Ativo' : 'Inativo'}</td>
                <td>
                  <button className="icon-button editar" onClick={() => handleEdit(servico)} title="Editar">
                    <Edit size={18} />
                  </button>
                  <button className="icon-button excluir" onClick={() => handleDelete(servico.id)} title="Excluir">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>      
      {showForm && (
        <ServicoForm onClose={handleCloseForm} editData={editData} />
      )}
    </div>
  );
}

export default Servicos;
