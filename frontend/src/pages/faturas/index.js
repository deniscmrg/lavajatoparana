// src/pages/faturas/Faturas.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';
import './faturas.css';
import FecharFaturasModal from './FecharFaturasModal';
import { Edit, FileDown } from 'lucide-react';
import FaturaDetalhesModal from './FaturaDetalhesModal';

const Faturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [ordem, setOrdem] = useState('data_vencimento');
  const [asc, setAsc] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhesId, setDetalhesId] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroData, setFiltroData] = useState('todos');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    carregarFaturas();
  }, [ordem, asc, statusFiltro, filtroTexto, filtroData, dataInicio, dataFim]);

  const carregarFaturas = async () => {
    try {
      const res = await api.get('/faturas/');
      setFaturas(res.data);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
    }
  };

  const alternarOrdem = (campo) => {
    if (campo === ordem) {
      setAsc(!asc);
    } else {
      setOrdem(campo);
      setAsc(true);
    }
  };

  const renderSeta = (campo) => {
    if (ordem !== campo) return null;
    return asc ? ' ▲' : ' ▼';
  };

  const visualizarFatura = (id) => {
    setDetalhesId(id);
  };

  const exportarFaturaPDF = async (id) => {
    try {
      const response = await api.get(`faturas/${id}/exportar/`, {
        responseType: 'blob',
      });

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
      await api.post('faturas/gerar/', {
        competencia,
        cliente_id,
      });
      setModalAberto(false);
      await carregarFaturas();
    } catch (err) {
      console.error('Erro ao fechar faturas:', err);
      alert('Erro ao fechar faturas');
    }
  };

  return (
    <div className="pagina">
      <div className="topo-listagem">
        <h2>Faturas</h2>
        <button className="btn btn-primary" onClick={() => setModalAberto(true)}>Fechar Faturas</button>
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
              <th onClick={() => alternarOrdem('cliente_nome')}>Cliente {renderSeta('cliente_nome')}</th>
              <th onClick={() => alternarOrdem('data_vencimento')}>Vencimento {renderSeta('data_vencimento')}</th>
              <th onClick={() => alternarOrdem('data_pagamento')}>Pagamento {renderSeta('data_pagamento')}</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {faturas
              .filter(f => f.cliente_nome.toLowerCase().includes(filtroTexto.toLowerCase()))
              .filter(f => {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                const venc = new Date(f.data_vencimento);
                venc.setHours(0, 0, 0, 0);

                const inicioSemana = new Date(hoje);
                const diaSemana = hoje.getDay();
                const diff = diaSemana === 0 ? 6 : diaSemana - 1;
                inicioSemana.setDate(hoje.getDate() - diff);

                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

                if (filtroData === 'hoje' && venc.getTime() !== hoje.getTime()) return false;
                if (filtroData === 'semana' && venc < inicioSemana) return false;
                if (filtroData === 'mes' && venc < inicioMes) return false;

                if (filtroData === 'personalizado') {
                  const inicio = dataInicio ? new Date(dataInicio) : null;
                  const fim = dataFim ? new Date(dataFim) : null;
                  if ((inicio && venc < inicio) || (fim && venc > fim)) return false;
                }

                return true;
              })
              .filter(f => {
                if (statusFiltro === 'todos') return true;
                if (statusFiltro === 'pago') return !!f.data_pagamento;
                if (statusFiltro === 'pendente') return !f.data_pagamento;
                return true;
              })
              .sort((a, b) => {
                const aVal = a[ordem] || '';
                const bVal = b[ordem] || '';
                return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
              })
              .map(f => (
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

      {modalAberto && (
        <FecharFaturasModal
          onClose={() => setModalAberto(false)}
          onConfirm={fecharFaturas}
        />
      )}

    {detalhesId && (
      <FaturaDetalhesModal
        faturaId={detalhesId}
        onClose={() => {
          setDetalhesId(null);
          carregarFaturas(); // <- isto força o recarregamento após RECEBER
        }}
      />
    )}
    </div>
  );
};

export default Faturas;
