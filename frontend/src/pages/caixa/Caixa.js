// src/pages/caixa/Caixa.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Edit, Trash2 } from 'lucide-react';
import CaixaForm from './CaixaForm';
import './caixa.css';
import ResumoCaixaModal from './ResumoCaixaModal';

function Caixa() {
  const [lancamentos, setLancamentos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [sortColumn, setSortColumn] = useState('data');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filtroData, setFiltroData] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [showResumo, setShowResumo] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

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

  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const lancamentosFiltrados = lancamentos
    .filter((l) => {
      const texto = `${l.origem} ${l.descricao} ${l.categoria}`.toLowerCase();
      if (!texto.includes(filtro.toLowerCase())) return false;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const inicioSemana = new Date(hoje);
      const diaSemana = hoje.getDay();
      const diferenca = diaSemana === 0 ? 6 : diaSemana - 1; // domingo = 0
      inicioSemana.setDate(hoje.getDate() - diferenca);

      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      const dataStr = l.data.length === 10 ? l.data : l.data.split('T')[0]; // garante YYYY-MM-DD
      const [ano, mes, dia] = dataStr.split('-');
      const dataLancamento = new Date(ano, mes - 1, dia);
      dataLancamento.setHours(0, 0, 0, 0); // zera horário

      if (filtroData === 'hoje' && dataLancamento.getTime() !== hoje.getTime()) return false;
      if (filtroData === 'semana' && dataLancamento < inicioSemana) return false;
      if (filtroData === 'mes' && dataLancamento < inicioMes) return false;

      if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;

      if (filtroData === 'personalizado') {
        const inicio = dataInicio ? new Date(dataInicio) : null;
        const fim = dataFim ? new Date(dataFim) : null;

        if ((inicio && dataLancamento < inicio) || (fim && dataLancamento > fim)) return false;
      }

      return true;
  })
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
          <div>
            <h2>Controle de Caixa</h2>
          </div>
          <div className="header-botoes">
            <button className="btn btn-primary" onClick={() => { setEditData(null); setShowForm(true); }}>Novo lançamento</button>
            <button className="btn btn-primary" onClick={() => setShowResumo(true)} >Resumo</button>
          </div>
        </div>
        {/* <div className="filtro-caixa">
          <div className="filtros-avancados">
            <div className="linha-filtro-texto">
              <input
                type="text"
                placeholder="Filtrar por origem, descrição ou categoria"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            
            <div className="linha-filtros-opcoes">
              <div className="filtros-data">
                <strong>Data: </strong>
                <button onClick={() => setFiltroData('hoje')} className={filtroData === 'hoje' ? 'ativo' : ''}>Hoje</button>
                <button onClick={() => setFiltroData('semana')} className={filtroData === 'semana' ? 'ativo' : ''}>Esta Semana</button>
                <button onClick={() => setFiltroData('mes')} className={filtroData === 'mes' ? 'ativo' : ''}>Este Mês</button>
                <button onClick={() => setFiltroData('todos')} className={filtroData === 'todos' ? 'ativo' : ''}>Todos</button>
                <button onClick={() => setFiltroData('personalizado')} className={filtroData === 'personalizado' ? 'ativo' : ''}>Personalizado</button>
              </div>

              {filtroData === 'personalizado' && (
                <div className="filtro-datas-personalizadas">
                  <label>Início: </label>
                  <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                  <label>Fim: </label>
                  <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </div>
              )}

              <div className="filtros-status">
                <strong>Tipo: </strong>
                <button onClick={() => setFiltroTipo('entrada')} className={filtroTipo === 'entrada' ? 'ativo' : ''}>Entrada</button>
                <button onClick={() => setFiltroTipo('saida')} className={filtroTipo === 'saida' ? 'ativo' : ''}>Saída</button>
                <button onClick={() => setFiltroTipo('todos')} className={filtroTipo === 'todos' ? 'ativo' : ''}>Todos</button>
              </div>
            </div>
          </div>
        </div> */}
      <div className="filtros-avancados">
        <input
          className="input-filtro-os"
          placeholder="Filtrar por origem, descrição ou categoria"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        <div className="filtros-data">
          <strong>Data: </strong>
          <div className="botoes-data">
            <button onClick={() => setFiltroData('hoje')} className={filtroData === 'hoje' ? 'ativo' : ''}>Hoje</button>
            <button onClick={() => setFiltroData('semana')} className={filtroData === 'semana' ? 'ativo' : ''}>Esta Semana</button>
            <button onClick={() => setFiltroData('mes')} className={filtroData === 'mes' ? 'ativo' : ''}>Este Mês</button>
            <button onClick={() => setFiltroData('todos')} className={filtroData === 'todos' ? 'ativo' : ''}>Todos</button>
            <button onClick={() => setFiltroData('personalizado')} className={filtroData === 'personalizado' ? 'ativo' : ''}>Personalizado</button>
          </div>

          {filtroData === 'personalizado' && (
            <div className="filtro-datas-personalizadas-os">
              <label>Início: </label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              <label>Fim: </label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          )}
        </div>

        <div className="filtros-status">
          <strong>Tipo: </strong>
          <button onClick={() => setFiltroTipo('entrada')} className={filtroTipo === 'entrada' ? 'ativo' : ''}>Entrada</button>
          <button onClick={() => setFiltroTipo('saida')} className={filtroTipo === 'saida' ? 'ativo' : ''}>Saída</button>
          <button onClick={() => setFiltroTipo('todos')} className={filtroTipo === 'todos' ? 'ativo' : ''}>Todos</button>
        </div>
      </div>

      <div className='tabela-scroll'>
        <table className='tabela'>
          <thead>
            <tr>
              <th onClick={() => handleSort('data')}>Data{renderSortArrow('data')}</th>
              <th onClick={() => handleSort('origem')}>Origem{renderSortArrow('origem')}</th>
              <th onClick={() => handleSort('descricao')}>Descrição{renderSortArrow('descricao')}</th>
              <th onClick={() => handleSort('categoria')}>Categoria{renderSortArrow('categoria')}</th>
              <th onClick={() => handleSort('tipo')}>Tipo{renderSortArrow('tipo')}</th>
              <th onClick={() => handleSort('forma_pagamento')}>Forma de Pagamento{renderSortArrow('forma_pagamento')}</th>
              <th onClick={() => handleSort('valor')}>Valor{renderSortArrow('valor')}</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lancamentosFiltrados.map((l) => (
              <tr key={l.id}>
                <td>{formatarData(l.data)}</td>
                <td>{l.origem}</td>
                <td>{l.descricao}</td>
                <td>{l.categoria}</td>
                <td>{l.tipo}</td>
                <td>{l.forma_pagamento}</td>
                <td className={l.tipo === 'saida' ? 'valor-saida' : ''}>
                  R$ {parseFloat(l.valor).toFixed(2)}
                </td>
                <td>
                  <button className="icon-button editar" onClick={() => { setEditData(l); setShowForm(true); }} title="Editar">
                    <Edit size={18} />
                  </button>
                  <button className="icon-button excluir" onClick={() => handleDelete(l.id)} title="Excluir">
                    <Trash2 size={18} />
                  </button>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    {showForm && <CaixaForm onClose={() => { setShowForm(false); fetchLancamentos(); }} editData={editData} />}

    {showResumo && (
        <ResumoCaixaModal
          lancamentos={lancamentosFiltrados}
          onClose={() => setShowResumo(false)}
        />
      )}
    </div>
  );
}
export default Caixa;
