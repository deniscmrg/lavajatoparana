// src/pages/servicos/Servicos.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './servicos.css';
import ServicoForm from './servicoForm';
import { Edit, Trash2 } from 'lucide-react';
import Paginacao from '../../components/paginacao';

function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  // Filtro + Ordenação
  const [filtro, setFiltro] = useState('');
  const [sortColumn, setSortColumn] = useState('descricao');
  const [sortDirection, setSortDirection] = useState('asc');

  // Paginação backend
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const fetchServicos = async (
    page = 1,
    search = filtro,
    ordering = `${sortDirection === 'desc' ? '-' : ''}${sortColumn}`
  ) => {
    try {
      const res = await api.get('/servicos/', {
        params: { page, search, ordering },
      });

      if (res.data.results) {
        setServicos(res.data.results);

        const PAGE_SIZE = 11; // ajustar se backend usa outro valor
        setTotalPaginas(Math.ceil(res.data.count / PAGE_SIZE));
      } else {
        setServicos(res.data);
        setTotalPaginas(1);
      }
      setPaginaAtual(page);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      alert('Sessão expirada ou sem permissão. Faça login novamente.');
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  useEffect(() => {
    fetchServicos(1, filtro);
  }, [filtro]);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      await api.delete(`servicos/${id}/`);
      fetchServicos(paginaAtual);
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
    fetchServicos(paginaAtual);
  };

  const handleSort = (column) => {
    let newDirection = 'asc';
    if (sortColumn === column && sortDirection === 'asc') {
      newDirection = 'desc';
    }
    setSortColumn(column);
    setSortDirection(newDirection);
    fetchServicos(1, filtro, `${newDirection === 'desc' ? '-' : ''}${column}`);
  };

  const renderSortArrow = (column) =>
    sortColumn === column ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="pagina-servicos">
      <div className="header-servicos">
        <h2>Serviços</h2>
        <button className="btn btn-primary" onClick={handleNew}>
          Novo Serviço
        </button>
      </div>

      <div className="filtro-servicos">
        <input
          type="text"
          placeholder="Filtrar por nome do serviço"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              <th onClick={() => handleSort('descricao')}>
                Descrição{renderSortArrow('descricao')}
              </th>
              <th onClick={() => handleSort('valor_unitario')}>
                Valor Unitário{renderSortArrow('valor_unitario')}
              </th>
              <th onClick={() => handleSort('status')}>
                Status{renderSortArrow('status')}
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {servicos.map((servico) => (
              <tr key={servico.id}>
                <td>{servico.descricao}</td>
                <td>R$ {Number(servico.valor_unitario).toFixed(2)}</td>
                <td>{servico.status === 'ativo' ? 'Ativo' : 'Inativo'}</td>

                <td>
                  <button
                    className="icon-button editar"
                    onClick={() => handleEdit(servico)}
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="icon-button excluir"
                    onClick={() => handleDelete(servico.id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onPageChange={(page) => fetchServicos(page, filtro)}
      />

      {showForm && <ServicoForm onClose={handleCloseForm} editData={editData} />}
    </div>
  );
}

export default Servicos;

