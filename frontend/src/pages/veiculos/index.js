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
  const [filtro, setFiltro] = useState('');
  const [sortColumn, setSortColumn] = useState('placa');
  const [sortDirection, setSortDirection] = useState('asc');

  // Paginação frontend
  const [paginaAtual, setPaginaAtual] = useState(1);
  const veiculosPorPagina = 11;

  const fetchVeiculos = async () => {
    try {
      const res = await api.get('/veiculos/');
      setVeiculos(Array.isArray(res.data.results) ? res.data.results : res.data);
      setPaginaAtual(1);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      alert('Erro de sessão. Faça login novamente.');
    }
  };

  useEffect(() => { fetchVeiculos(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este veículo?')) {
      await api.delete(`veiculos/${id}/`);
      fetchVeiculos();
    }
  };

  const handleEdit = (veiculo) => { setEditData(veiculo); setShowForm(true); };
  const handleNew = () => { setEditData(null); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); fetchVeiculos(); };

  const handleSort = (column) => {
    if (sortColumn === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  const renderSortArrow = (column) => (sortColumn === column ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '');

  // 🟢 FILTRO + ORDENAÇÃO
  const veiculosFiltrados = veiculos.filter((v) =>
    v.placa.toLowerCase().includes(filtro.toLowerCase()) ||
    v.cliente_nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const veiculosOrdenados = [...veiculosFiltrados].sort((a, b) => {
    const valorA = a[sortColumn]?.toString().toLowerCase() || '';
    const valorB = b[sortColumn]?.toString().toLowerCase() || '';
    if (valorA < valorB) return sortDirection === 'asc' ? -1 : 1;
    if (valorA > valorB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // 🟢 PAGINAÇÃO FRONTEND
  const indexUltimo = paginaAtual * veiculosPorPagina;
  const indexPrimeiro = indexUltimo - veiculosPorPagina;
  const veiculosNaPagina = veiculosOrdenados.slice(indexPrimeiro, indexUltimo);
  const totalPaginas = Math.ceil(veiculosOrdenados.length / veiculosPorPagina);

  return (
    <div className="pagina-veiculos">
      <div className="header-veiculos">
        <h2>Veículos</h2>
        <button className="btn btn-primary" onClick={handleNew}>Novo Veículo</button>
      </div>

      <div className="filtro-veiculos">
        <input
          type="text"
          placeholder="Filtrar por placa ou cliente"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>
      
      <div className='tabela-scroll'>
        <table className="tabela-veiculos">
          <thead>
            <tr>
              <th onClick={() => handleSort('placa')}>Placa{renderSortArrow('placa')}</th>
              <th onClick={() => handleSort('marca')}>Marca{renderSortArrow('marca')}</th>
              <th onClick={() => handleSort('modelo')}>Modelo{renderSortArrow('modelo')}</th>
              <th onClick={() => handleSort('cliente_nome')}>Cliente{renderSortArrow('cliente_nome')}</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {veiculosNaPagina.map((v) => (
              <tr key={v.id || v.placa}>
                <td>{v.placa}</td>
                <td>{v.marca}</td>
                <td>{v.modelo}</td>
                <td>{v.cliente_nome}</td>
                <td>
                  <button className="icon-button editar" onClick={() => handleEdit(v)} title="Editar">
                    <Edit size={18} />
                  </button>
                  <button className="icon-button excluir" onClick={() => handleDelete(v.id || v.placa)} title="Excluir">
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
        onPageChange={setPaginaAtual}
      />

      {showForm && (
        <VeiculoForm onClose={handleCloseForm} editData={editData} />
      )}
    </div>
  );
}

export default Veiculos;
