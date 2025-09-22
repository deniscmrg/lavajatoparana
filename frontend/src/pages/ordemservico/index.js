// src/pages/ordensservico/index.js
import React, { useEffect, useState } from 'react';
import './ordemServico.css';
import api from '../../api/axios';
import OrdemServicoForm from './ordemservicoForm';
import CadastroClienteVeiculo from '../cadastroclienteveiculo';
import ModalPlaca from '../buscaplaca';
import FechaOrdemServico from './fechaOrdemServico';
import Paginacao from '../../components/paginacao';
import { CreditCard, Edit, Trash2 } from 'lucide-react';

function OrdensServico() {
  const [ordens, setOrdens] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [fecharAberto, setFecharAberto] = useState(false);
  const [ordemParaEditar, setOrdemParaEditar] = useState(null);
  const [ordemParaFechar, setOrdemParaFechar] = useState(null);

  // ordenação (no backend)
  const [ordenarPor, setOrdenarPor] = useState('data');
  const [ordemCrescente, setOrdemCrescente] = useState(false);

  // filtros
  const [modalPlacaAberto, setModalPlacaAberto] = useState(false);
  const [placaBusca, setPlacaBusca] = useState('');
  const [filtroData, setFiltroData] = useState('todos'); // inicia em TODOS
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // paginação backend
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  // Página de Ordens de Serviço
  const PAGE_SIZE = 11; 
  const ordensPorPagina = PAGE_SIZE;

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  // === CORREÇÃO DE DATA LOCAL (sem UTC) ===
  const toLocalISODate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // mapeia cabeçalhos -> campos do backend para ordering
  const mapOrdenacao = (coluna) => {
    const mapa = {
      id: 'id',
      data: 'data',
      status: 'status',
      forma_pagamento: 'forma_pagamento',
      cliente: 'cliente__nome',
      placa: 'veiculo__placa',
    };
    return mapa[coluna] || 'data';
  };

  // const carregarOrdens = async (pagina = 1) => {
  //   try {
  //     const ordering = `${ordemCrescente ? '' : '-'}${mapOrdenacao(ordenarPor)}`;

  //     const params = { page: pagina, ordering };

  //     if (filtro?.trim()) params.search = filtro.trim();
  //     if (filtroStatus !== 'todos') params.status = filtroStatus;
  //     if (dataInicio) params.data_inicio = dataInicio;
  //     if (dataFim) params.data_fim = dataFim;

  //     const res = await api.get('/ordens-servico/', { params });
  //     const results = res.data.results || [];
  //     const count = res.data.count ?? 0;

  //     setOrdens(results);
  //     setTotalPaginas(Math.max(1, Math.ceil(count / (results.length || ordensPorPagina) || 1)));
  //     setPaginaAtual(pagina);
  //   } catch (err) {
  //     console.error(err);
  //     alert('Erro ao carregar ordens de serviço.');
  //   }
  // };
  const carregarOrdens = async (pagina = 1) => {
    try {
      const ordering = `${ordemCrescente ? '' : '-'}${mapOrdenacao(ordenarPor)}`;

      const params = { page: pagina, ordering };

      if (filtro?.trim()) params.search = filtro.trim();
      if (filtroStatus !== 'todos') params.status = filtroStatus;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;

      const res = await api.get('/ordens-servico/', { params });
      const results = res.data.results || [];
      const count = res.data.count ?? 0;

      // >>> totalPaginas calculado sempre com PAGE_SIZE fixo <<<
      const total = Math.max(1, Math.ceil(count / PAGE_SIZE));

      setOrdens(results);
      setTotalPaginas(total);
      setPaginaAtual(Math.min(pagina, total)); // garante que não “pula” além do máximo
    } catch (err) {
      // Se for página fora do range, recua para a última página conhecida
      if (err?.response?.status === 404 && totalPaginas > 1) {
        const ultima = Math.max(1, totalPaginas - 1);
        // tenta carregar a última válida
        carregarOrdens(ultima);
        return;
      }
      console.error(err);
      alert('Erro ao carregar ordens de serviço.');
    }
  };


  // Calcula intervalo quando filtroData muda (não chama API aqui)
  useEffect(() => {
    if (filtroData === 'personalizado') return;

    const hoje = new Date();
    let inicio = '';
    let fim = '';

    if (filtroData === 'hoje') {
      inicio = toLocalISODate(hoje);
      fim = toLocalISODate(hoje);
    } else if (filtroData === 'semana') {
      // segunda-feira da semana corrente (BR), mesmo se hoje for domingo
      const inicioSemana = new Date(hoje);
      const day = inicioSemana.getDay(); // 0=Dom, 1=Seg, ... 6=Sáb
      const diff = (day === 0 ? -6 : 1) - day;
      inicioSemana.setDate(inicioSemana.getDate() + diff);
      inicio = toLocalISODate(inicioSemana);
      fim = toLocalISODate(hoje);
    } else if (filtroData === 'mes') {
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      inicio = toLocalISODate(inicioMes);
      fim = toLocalISODate(hoje);
    } else if (filtroData === 'todos') {
      inicio = '';
      fim = '';
    }

    setDataInicio(inicio);
    setDataFim(fim);
  }, [filtroData]);

  // Chama a API sempre que filtros/ordenação mudarem
  useEffect(() => {
    carregarOrdens(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, filtroStatus, dataInicio, dataFim, ordenarPor, ordemCrescente]);

  const handleConfirmPlaca = (placa) => {
    setPlacaBusca(placa);
    setModalPlacaAberto(false);
    buscarPlaca(placa);
  };

  const buscarPlaca = async (placa) => {
    try {
      const res = await api.get(`/veiculos/${placa}/`);
      const veiculo = res.data;
      const clienteRes = await api.get(`/clientes/${veiculo.cliente}/`);

      setOrdemParaEditar({
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        cliente_nome: clienteRes.data.nome,
        cliente_celular: clienteRes.data.celular,
        cliente_email: clienteRes.data.email,
        cliente_tipo: clienteRes.data.tipo,
        veiculo_id: veiculo.id,
        cliente_id: clienteRes.data.id,
      });
      setFormAberto(true);
    } catch (err) {
      if (err.response?.status === 404) setCadastroAberto(true);
      else alert('Erro ao buscar veículo.');
    }
  };

  const abrirForm = (os = null) => {
    setOrdemParaEditar(os);
    setFormAberto(true);
  };

  const abrirFechamento = async (os) => {
    try {
      const resServicos = await api.get(`/servicos-da-os/${os.id}/`);
      const valorTotal = resServicos.data.reduce((acc, s) => acc + Number(s.valor), 0);
      setOrdemParaFechar({ ...os, total: valorTotal });
      setFecharAberto(true);
    } catch {
      alert('Erro ao buscar os serviços da OS.');
    }
  };

  const fecharOrdem = async (formaPagamento) => {
    if (!ordemParaFechar) return;
    if (formaPagamento.toLowerCase() === 'faturar' && ordemParaFechar?.cliente?.tipo !== 'lojista') {
      alert('Somente clientes lojistas podem usar a opção Faturar.');
      return;
    }
    try {
      const dataFechamento = new Date().toISOString();
      const dataCaixa = dataFechamento.split('T')[0];

      await api.put(`/ordens-servico/${ordemParaFechar.id}/`, {
        status: 'finalizada',
        forma_pagamento: formaPagamento,
        data_fechamento: dataFechamento,
      });

      const resServicos = await api.get(`/servicos-da-os/${ordemParaFechar.id}/`);
      const valorTotal = resServicos.data.reduce((acc, s) => acc + Number(s.valor), 0);

      if (formaPagamento.toLowerCase() !== 'faturar') {
        await api.post('/caixa/', {
          data: dataCaixa,
          tipo: 'entrada',
          origem: `OS #${ordemParaFechar.id}`,
          descricao: `${ordemParaFechar.veiculo?.placa || ''} ${ordemParaFechar.cliente?.nome || ''}`,
          categoria: 'serviços',
          valor: valorTotal,
          forma_pagamento: formaPagamento,
        });
      }

      setFecharAberto(false);
      setOrdemParaFechar(null);
      carregarOrdens(paginaAtual);
    } catch {
      alert('Erro ao fechar a ordem de serviço.');
    }
  };

  const excluirOrdem = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta ordem de serviço?')) return;
    try {
      await api.delete(`/ordens-servico/${id}/`);
      carregarOrdens(paginaAtual);
    } catch {
      alert('Erro ao excluir a OS.');
    }
  };

  const toggleOrdenacao = (coluna) => {
    if (ordenarPor === coluna) setOrdemCrescente(!ordemCrescente);
    else {
      setOrdenarPor(coluna);
      setOrdemCrescente(true);
    }
  };

  const iconeOrdenacao = (coluna) =>
    ordenarPor === coluna ? (ordemCrescente ? '↑' : '↓') : '';

  const formatarDataHora = (data) => {
    const dt = new Date(data);
    return `${dt.toLocaleDateString('pt-BR')}, ${dt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div className="pagina-listagem">
      <div className="cabecalho">
        <h2>Ordens de Serviço</h2>
        <button className="btn btn-primary" onClick={() => setModalPlacaAberto(true)}>
          + Nova OS
        </button>
      </div>

      <div className="filtros-avancados">
        <input
          className="input-filtro-os"
          placeholder="Filtrar por cliente ou placa..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        <div className="filtros-data">
          <strong>Data: </strong>
          <div className="botoes-data">
            {['hoje', 'semana', 'mes', 'todos', 'personalizado'].map((item) => (
              <button
                key={item}
                onClick={() => setFiltroData(item)}
                className={filtroData === item ? 'ativo' : ''}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          {filtroData === 'personalizado' && (
            <div className="filtro-datas-personalizadas-os">
              <label>Início: </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <label>Fim: </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="filtros-status">
          <strong>Status: </strong>
          {['aberta', 'finalizada', 'todos'].map((item) => (
            <button
              key={item}
              onClick={() => setFiltroStatus(item)}
              className={filtroStatus === item ? 'ativo' : ''}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              {['id', 'data', 'cliente', 'placa', 'status', 'forma_pagamento'].map((col) => (
                <th
                  key={col}
                  onClick={() => toggleOrdenacao(col)}
                  style={{ cursor: 'pointer' }}
                >
                  {col.toUpperCase()} {iconeOrdenacao(col)}
                </th>
              ))}
              <th>Saida</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordens.map((os) => (
              <tr key={os.id}>
                <td>{os.id}</td>
                <td>{formatarDataHora(os.data)}</td>
                <td>{os.cliente?.nome || ''}</td>
                <td>{os.veiculo?.placa || ''}</td>
                <td>{os.status}</td>
                <td>{os.forma_pagamento}</td>
                <td>{os.data_fechamento ? formatarDataHora(os.data_fechamento) : ''}</td>
                <td>
                  <button
                    className="icon-button editar"
                    onClick={() => abrirForm(os)}
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="icon-button excluir"
                    onClick={() => excluirOrdem(os.id)}
                    title="Excluir"
                    disabled={usuario.tipo === 'operador'}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    className={`icon-button fechar ${os.status === 'finalizada' ? 'desativado' : ''}`}
                    onClick={() => abrirFechamento(os)}
                    title="Fechar"
                    disabled={os.status === 'finalizada'}
                  >
                    <CreditCard size={18} />
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
        onPageChange={carregarOrdens}
      />

      <ModalPlaca
        isOpen={modalPlacaAberto}
        onClose={() => setModalPlacaAberto(false)}
        onConfirm={handleConfirmPlaca}
      />

      {formAberto && (
        <OrdemServicoForm
          editData={ordemParaEditar}
          onClose={() => {
            setFormAberto(false);
            setOrdemParaEditar(null);
            carregarOrdens(paginaAtual);
          }}
          atualizarOrdens={() => carregarOrdens(paginaAtual)}
        />
      )}

      {fecharAberto && (
        <FechaOrdemServico
          ordem={ordemParaFechar}
          onClose={() => {
            setFecharAberto(false);
            setOrdemParaFechar(null);
            carregarOrdens(paginaAtual);
          }}
          onConfirm={fecharOrdem}
        />
      )}

      {cadastroAberto && (
        <CadastroClienteVeiculo
          placa={placaBusca}
          onClose={() => setCadastroAberto(false)}
          onConfirm={(dados) => {
            setOrdemParaEditar(dados);
            setCadastroAberto(false);
            setFormAberto(true);
          }}
        />
      )}
    </div>
  );
}

export default OrdensServico;

