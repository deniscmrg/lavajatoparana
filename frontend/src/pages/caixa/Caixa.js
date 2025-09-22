// src/pages/caixa/Caixa.js
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { Edit, Trash2 } from 'lucide-react';
import CaixaForm from './CaixaForm';
import './caixa.css';
import ResumoCaixaModal from './ResumoCaixaModal';
import Paginacao from '../../components/paginacao';

const PAGE_SIZE = 11; // mantenha igual ao backend

const Caixa = () => {
  const [itens, setItens] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  // ordenação
  const [ordem, setOrdem] = useState('data');
  const [asc, setAsc] = useState(false);

  // filtros
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'entrada' | 'saida' | 'todos'
  const [filtroData, setFiltroData] = useState('todos'); // 'hoje' | 'semana' | 'mes' | 'todos' | 'personalizado'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // modais
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showResumo, setShowResumo] = useState(false);

  const ordering = useMemo(() => (asc ? ordem : `-${ordem}`), [ordem, asc]);

  const montarDatasRapidas = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (filtroData === 'hoje') {
      const iso = hoje.toISOString().slice(0, 10);
      return { data_inicio: iso, data_fim: iso };
    }
    if (filtroData === 'semana') {
      const inicio = new Date(hoje);
      const dia = hoje.getDay(); // 0=domingo
      const diff = dia === 0 ? 6 : dia - 1; // segunda como início
      inicio.setDate(hoje.getDate() - diff);
      return {
        data_inicio: inicio.toISOString().slice(0, 10),
        data_fim: hoje.toISOString().slice(0, 10),
      };
    }
    if (filtroData === 'mes') {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return {
        data_inicio: inicio.toISOString().slice(0, 10),
        data_fim: fim.toISOString().slice(0, 10),
      };
    }
    if (filtroData === 'personalizado') {
      return {
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
      };
    }
    return {};
  };

  const fetchPage = async () => {
    try {
      const params = { page, ordering };

      if (busca) params.search = busca;
      if (filtroTipo !== 'todos') params.tipo = filtroTipo;

      const { data_inicio, data_fim } = montarDatasRapidas();
      if (data_inicio) params.data_inicio = data_inicio;
      if (data_fim) params.data_fim = data_fim;

      const resp = await api.get('caixa/', { params });
      const data = resp.data;

      const results = Array.isArray(data) ? data : (data.results || []);
      const total = Array.isArray(data) ? results.length : (data.count ?? results.length);

      setItens(results);
      setCount(total);
    } catch (e) {
      console.error('Erro ao buscar lançamentos:', e);
      alert('Erro de sessão. Faça login novamente.');
    }
  };

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ordering, filtroTipo, filtroData, dataInicio, dataFim]);

  useEffect(() => {
    setPage(1);
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const handleSort = (col) => {
    if (ordem === col) {
      setAsc(!asc);
    } else {
      setOrdem(col);
      setAsc(true);
    }
  };

  const renderSeta = (col) => {
    if (ordem !== col) return '';
    return asc ? ' ↑' : ' ↓';
  };

  const formatarData = (v) => {
    if (!v) return '';
    const d = (v.length === 10 ? v : v.split('T')[0]).split('-');
    if (d.length !== 3) return v;
    return `${d[2]}/${d[1]}/${d[0]}`;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir este lançamento?')) return;
    await api.delete(`caixa/${id}/`);
    if (itens.length === 1 && page > 1) {
      setPage((p) => p - 1);
    } else {
      fetchPage();
    }
  };

  const totalPages = Math.max(1, Math.ceil((count || itens.length) / PAGE_SIZE));

  // monta os filtros para passar pro resumo
  const filtrosResumo = {
    ...montarDatasRapidas(),
    search: busca || undefined,
    ordering: ordering || undefined,
    tipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
  };

  return (
    <div className="pagina-caixa">
      <div className="header-caixa">
        <div><h2>Controle de Caixa</h2></div>
        <div className="header-botoes">
          <button className="btn btn-primary" onClick={() => { setEditData(null); setShowForm(true); }}>Novo lançamento</button>
          <button className="btn btn-primary" onClick={() => setShowResumo(true)}>Resumo</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-avancados">
        <input
          className="input-filtro-os"
          placeholder="Filtrar por origem, descrição ou categoria"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="filtros-data">
          <strong>Data: </strong>
          <div className="botoes-data">
            <button onClick={() => { setFiltroData('hoje'); setPage(1); }} className={filtroData === 'hoje' ? 'ativo' : ''}>Hoje</button>
            <button onClick={() => { setFiltroData('semana'); setPage(1); }} className={filtroData === 'semana' ? 'ativo' : ''}>Esta Semana</button>
            <button onClick={() => { setFiltroData('mes'); setPage(1); }} className={filtroData === 'mes' ? 'ativo' : ''}>Este Mês</button>
            <button onClick={() => { setFiltroData('todos'); setPage(1); }} className={filtroData === 'todos' ? 'ativo' : ''}>Todos</button>
            <button onClick={() => { setFiltroData('personalizado'); setPage(1); }} className={filtroData === 'personalizado' ? 'ativo' : ''}>Personalizado</button>
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
          <button onClick={() => { setFiltroTipo('entrada'); setPage(1); }} className={filtroTipo === 'entrada' ? 'ativo' : ''}>Entrada</button>
          <button onClick={() => { setFiltroTipo('saida'); setPage(1); }} className={filtroTipo === 'saida' ? 'ativo' : ''}>Saída</button>
          <button onClick={() => { setFiltroTipo('todos'); setPage(1); }} className={filtroTipo === 'todos' ? 'ativo' : ''}>Todos</button>
        </div>
      </div>

      {/* Tabela */}
      <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              <th onClick={() => handleSort('data')}>Data{renderSeta('data')}</th>
              <th onClick={() => handleSort('origem')}>Origem{renderSeta('origem')}</th>
              <th onClick={() => handleSort('descricao')}>Descrição{renderSeta('descricao')}</th>
              <th onClick={() => handleSort('categoria')}>Categoria{renderSeta('categoria')}</th>
              <th onClick={() => handleSort('tipo')}>Tipo{renderSeta('tipo')}</th>
              <th onClick={() => handleSort('forma_pagamento')}>Forma de Pagamento{renderSeta('forma_pagamento')}</th>
              <th onClick={() => handleSort('valor')}>Valor{renderSeta('valor')}</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((l) => (
              <tr key={l.id}>
                <td>{formatarData(l.data)}</td>
                <td>{l.origem}</td>
                <td>{l.descricao}</td>
                <td>{l.categoria}</td>
                <td>{l.tipo}</td>
                <td>{l.forma_pagamento}</td>
                <td className={l.tipo === 'saida' ? 'valor-saida' : ''}>
                  R$ {Number(l.valor ?? 0).toFixed(2)}
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
            {itens.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 16 }}>Nenhum lançamento encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <Paginacao
        paginaAtual={page}
        totalPaginas={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {/* Modais */}
      {showForm && (
        <CaixaForm
          onClose={() => { setShowForm(false); fetchPage(); }}
          editData={editData}
        />
      )}
      {showResumo && (
        <ResumoCaixaModal
          filtros={filtrosResumo}
          onClose={() => setShowResumo(false)}
        />
      )}
    </div>
  );
};

export default Caixa;
