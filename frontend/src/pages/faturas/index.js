import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';
import './faturas.css';
import FecharFaturasModal from './FecharFaturasModal';
import { Edit, FileDown } from 'lucide-react';
import FaturaDetalhesModal from './FaturaDetalhesModal';
import Paginacao from '../../components/paginacao';

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

  // Paginação frontend
  const [paginaAtual, setPaginaAtual] = useState(1);
  const faturasPorPagina = 11;

  const carregarFaturas = async () => {
    try {
      const res = await api.get('/faturas/');
      setFaturas(res.data);
      setPaginaAtual(1);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
    }
  };

  useEffect(() => {
    carregarFaturas();
  }, [modalAberto]);

  const alternarOrdem = (campo) => {
    if (campo === ordem) setAsc(!asc);
    else { setOrdem(campo); setAsc(true); }
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
      await carregarFaturas();
    } catch (err) {
      console.error('Erro ao fechar faturas:', err);
      alert('Erro ao fechar faturas');
    }
  };

  // 🟢 FILTRO + ORDENAÇÃO
  const faturasFiltradas = faturas
    .filter(f => f.cliente_nome.toLowerCase().includes(filtroTexto.toLowerCase()))
    .filter(f => {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const venc = new Date(f.data_vencimento); venc.setHours(0, 0, 0, 0);
      const inicioSemana = new Date(hoje); const diaSemana = hoje.getDay();
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
      return asc ? aVal.toString().localeCompare(bVal.toString()) : bVal.toString().localeCompare(aVal.toString());
    });

  // 🟢 PAGINAÇÃO FRONTEND
  const indexUltimo = paginaAtual * faturasPorPagina;
  const indexPrimeiro = indexUltimo - faturasPorPagina;
  const faturasNaPagina = faturasFiltradas.slice(indexPrimeiro, indexUltimo);
  const totalPaginas = Math.ceil(faturasFiltradas.length / faturasPorPagina);

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
        {/* filtros de data e status continuam iguais */}
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
            {faturasNaPagina.map(f => (
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
        onPageChange={setPaginaAtual}
      />

      {modalAberto && <FecharFaturasModal onClose={() => setModalAberto(false)} onConfirm={fecharFaturas} />}
      {detalhesId && <FaturaDetalhesModal faturaId={detalhesId} onClose={() => setDetalhesId(null)} />}
    </div>
  );
};

export default Faturas;
