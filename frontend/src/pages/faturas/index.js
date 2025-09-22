// src/pages/faturas/Faturas.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';
import './faturas.css';
import FecharFaturasModal from './FecharFaturasModal';
import { Edit, FileDown } from 'lucide-react';
import FaturaDetalhesModal from './FaturaDetalhesModal';
import Paginacao from '../../components/paginacao';

const PAGE_SIZE = 10; // mesmo valor do backend

const Faturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [ordem, setOrdem] = useState('data_vencimento'); // 'id' | 'cliente__nome' | 'data_vencimento' | 'data_pagamento'
  const [asc, setAsc] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhesId, setDetalhesId] = useState(null);

  // filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroData, setFiltroData] = useState('todos'); // 'todos' | 'hoje' | 'semana' | 'mes' | 'personalizado'
  const [statusFiltro, setStatusFiltro] = useState('todos'); // 'todos' | 'pago' | 'pendente'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // paginação backend
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // formata Date -> 'YYYY-MM-DD' (sem timezone)
  const toISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0); // último dia do mês

  const montarPeriodo = () => {
    if (filtroData === 'personalizado') {
      return {
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
      };
    }
    if (filtroData === 'hoje') {
      const hoje = new Date();
      const iso = toISO(hoje);
      return { data_inicio: iso, data_fim: iso };
    }
    if (filtroData === 'semana') {
      const hoje = new Date();
      const dow = hoje.getDay(); // 0=Dom
      const diff = dow === 0 ? 6 : dow - 1; // segunda-feira
      const ini = new Date(hoje);
      ini.setDate(hoje.getDate() - diff);
      return { data_inicio: toISO(ini), data_fim: toISO(hoje) };
    }
    if (filtroData === 'mes') {
      const hoje = new Date();
      const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = endOfMonth(hoje); // <<< AJUSTE: até o último dia do mês
      return { data_inicio: toISO(ini), data_fim: toISO(fim) };
    }
    // 'todos'
    return { data_inicio: undefined, data_fim: undefined };
  };

  const getOrdering = () => (asc ? ordem : `-${ordem}`);
  const getStatusParam = () => (statusFiltro === 'todos' ? undefined : statusFiltro);

  const carregarFaturas = async (page = 1) => {
    try {
      const periodo = montarPeriodo();
      const params = {
        page,
        ordering: getOrdering(),
        search: filtroTexto || undefined,
        status: getStatusParam(),
        ...periodo,
      };

      const res = await api.get('/faturas/', { params });

      if (res.data?.results) {
        setFaturas(res.data.results);
        setTotalPaginas(Math.max(1, Math.ceil(res.data.count / PAGE_SIZE)));
      } else {
        const arr = Array.isArray(res.data) ? res.data : [];
        setFaturas(arr);
        setTotalPaginas(1);
      }
      setPaginaAtual(page);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
      alert('Erro ao carregar faturas.');
    }
  };

  useEffect(() => {
    carregarFaturas(1); // volta pra página 1 ao alterar filtros/ordem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordem, asc, filtroTexto, filtroData, statusFiltro, dataInicio, dataFim]);

  useEffect(() => {
    if (!modalAberto) carregarFaturas(paginaAtual || 1); // recarrega ao fechar o modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalAberto]);

  const alternarOrdem = (campo) => {
    if (campo === ordem) setAsc((v) => !v);
    else {
      setOrdem(campo);
      setAsc(true);
    }
  };

  const renderSeta = (campo) => (ordem === campo ? (asc ? ' ▲' : ' ▼') : null);

  const visualizarFatura = (id) => setDetalhesId(id);

  const exportarFaturaPDF = async (id) => {
    try {
      const response = await api.get(`faturas/${id}/exportar/`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Erro ao exportar fatura em PDF.');
    }
  };

  const fecharFaturas = async ({ competencia, cliente_id }) => {
    try {
      await api.post('faturas/gerar/', { competencia, cliente_id });
      setModalAberto(false);
      await carregarFaturas(1);
    } catch (err) {
      console.error('Erro ao fechar faturas:', err);
      alert('Erro ao fechar faturas');
    }
  };

  return (
    <div className="pagina">
      <div className="topo-listagem">
        <h2>Faturas</h2>
        <button className="btn btn-primary" onClick={() => setModalAberto(true)}>
          Fechar Faturas
        </button>
      </div>

      <div className="filtros-avancados">
        <input
          className="input-filtro-os"
          placeholder="Filtrar por nome do cliente"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />

        <div className="filtros-data">
          <strong>Venc.: </strong>
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
          <strong>Status: </strong>
          <button onClick={() => setStatusFiltro('pago')} className={statusFiltro === 'pago' ? 'ativo' : ''}>Pago</button>
          <button onClick={() => setStatusFiltro('pendente')} className={statusFiltro === 'pendente' ? 'ativo' : ''}>Aberto</button>
          <button onClick={() => setStatusFiltro('todos')} className={statusFiltro === 'todos' ? 'ativo' : ''}>Todos</button>
        </div>
      </div>

      <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              <th onClick={() => alternarOrdem('id')}># {renderSeta('id')}</th>
              <th onClick={() => alternarOrdem('cliente__nome')}>Cliente {renderSeta('cliente__nome')}</th>
              <th onClick={() => alternarOrdem('data_vencimento')}>Vencimento {renderSeta('data_vencimento')}</th>
              <th onClick={() => alternarOrdem('data_pagamento')}>Pagamento {renderSeta('data_pagamento')}</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {faturas.map((f) => (
              <tr key={f.id}>
                <td>{f.id}</td>
                <td>{f.cliente_nome}</td>
                <td>{format(new Date(f.data_vencimento), 'dd/MM/yyyy')}</td>
                <td>{f.data_pagamento ? format(new Date(f.data_pagamento), 'dd/MM/yyyy') : '-'}</td>
                <td>{f.status}</td>
                <td>
                  <button className="icon-button editar" onClick={() => visualizarFatura(f.id)} title="Visualizar Detalhes">
                    <Edit size={18} />
                  </button>
                  <button className="icon-button exportar" onClick={() => exportarFaturaPDF(f.id)} title="Exportar PDF">
                    <FileDown size={18} />
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
        onPageChange={(page) => carregarFaturas(page)}
      />

      {modalAberto && (
        <FecharFaturasModal
          onClose={() => setModalAberto(false)}
          onConfirm={fecharFaturas}
        />
      )}

      {detalhesId && (
        <FaturaDetalhesModal
          faturaId={detalhesId}
          onClose={() => setDetalhesId(null)}
        />
      )}
    </div>
  );
};

export default Faturas;
