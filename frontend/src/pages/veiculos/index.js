import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import VeiculoForm from './veiculoForm';
import { Edit, Trash2 } from 'lucide-react';
import './veiculos.css';
import Paginacao from '../../components/paginacao';

function Veiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  // Filtro + Ordenação
  const [filtro, setFiltro] = useState('');
  const [sortColumn, setSortColumn] = useState('placa');
  const [sortDirection, setSortDirection] = useState('asc');

  // Paginação backend
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const fetchVeiculos = async (
    page = 1,
    search = filtro,
    ordering = `${sortDirection === 'desc' ? '-' : ''}${sortColumn}`
  ) => {
    try {
      const res = await api.get('/veiculos/', {
        params: {
          page,
          search,
          ordering,
        },
      });

      if (res.data.results) {
        setVeiculos(res.data.results);

        const PAGE_SIZE = 11; // ou o valor configurado no backend
        setTotalPaginas(Math.ceil(res.data.count / PAGE_SIZE));
        // setTotalPaginas(Math.ceil(res.data.count / res.data.results.length));
      } else {
        setVeiculos(res.data);
        setTotalPaginas(1);
      }
      setPaginaAtual(page);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      alert('Erro de sessão. Faça login novamente.');
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  // Atualiza lista quando filtro mudar
  useEffect(() => {
    fetchVeiculos(1, filtro);
  }, [filtro]);

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este veículo?')) {
      await api.delete(`veiculos/${id}/`);
      fetchVeiculos(paginaAtual);
    }
  };

  const handleEdit = (veiculo) => {
    setEditData(veiculo);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditData(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    fetchVeiculos(paginaAtual);
  };

  const handleSort = (column) => {
    let newDirection = 'asc';
    if (sortColumn === column && sortDirection === 'asc') {
      newDirection = 'desc';
    }
    setSortColumn(column);
    setSortDirection(newDirection);
    fetchVeiculos(1, filtro, `${newDirection === 'desc' ? '-' : ''}${column}`);
  };

  const renderSortArrow = (column) =>
    sortColumn === column ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="pagina-veiculos">
      <div className="header-veiculos">
        <h2>Veículos</h2>
        <button className="btn btn-primary" onClick={handleNew}>
          Novo Veículo
        </button>
      </div>

      <div className="filtro-veiculos">
        <input
          type="text"
          placeholder="Filtrar por placa, cliente, marca ou modelo"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="tabela-scroll">
        <table className="tabela-veiculos">
          <thead>
            <tr>
              <th onClick={() => handleSort('placa')}>
                Placa{renderSortArrow('placa')}
              </th>
              <th onClick={() => handleSort('marca')}>
                Marca{renderSortArrow('marca')}
              </th>
              <th onClick={() => handleSort('modelo')}>
                Modelo{renderSortArrow('modelo')}
              </th>
              <th onClick={() => handleSort('cliente__nome')}>
                Cliente{renderSortArrow('cliente__nome')}
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {veiculos.map((v) => (
              <tr key={v.id || v.placa}>
                <td>{v.placa}</td>
                <td>{v.marca}</td>
                <td>{v.modelo}</td>
                <td>{v.cliente_nome}</td>
                <td>
                  <button
                    className="icon-button editar"
                    onClick={() => handleEdit(v)}
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="icon-button excluir"
                    onClick={() => handleDelete(v.id || v.placa)}
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
        onPageChange={(page) => fetchVeiculos(page, filtro)}
      />

      {showForm && (
        <VeiculoForm onClose={handleCloseForm} editData={editData} />
      )}
    </div>
  );
}

export default Veiculos;
