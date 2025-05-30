import React, { useEffect, useState } from 'react';
import './ordemServico.css';
import api from '../../api/axios';
import OrdemServicoForm from './ordemservicoForm';
import CadastroClienteVeiculo from '../cadastroclienteveiculo';
import ModalPlaca from '../buscaplaca';
import FechaOrdemServico from './fechaOrdemServico';
import { CreditCard, Edit, Trash2 } from 'lucide-react';

function OrdensServico() {
  const [ordens, setOrdens] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [fecharAberto, setFecharAberto] = useState(false);
  const [ordemParaEditar, setOrdemParaEditar] = useState(null);
  const [ordemParaFechar, setOrdemParaFechar] = useState(null);
  const [ordenarPor, setOrdenarPor] = useState('data');
  const [ordemCrescente, setOrdemCrescente] = useState(false);
  const [modalPlacaAberto, setModalPlacaAberto] = useState(false);
  const [placaBusca, setPlacaBusca] = useState('');
  const [filtroData, setFiltroData] = useState('hoje');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  console.log('USUÁRIO LOGADO:', usuario);

  const carregarOrdens = async () => {
    try {
      const res = await api.get('/ordens-servico/');
      setOrdens(res.data);
    } catch {
      alert('Erro ao carregar ordens de serviço.');
    }
  };

  useEffect(() => { carregarOrdens(); }, []);

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

      const ordemPreenchida = {
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        cliente_nome: clienteRes.data.nome,
        cliente_celular: clienteRes.data.celular,
        cliente_email: clienteRes.data.email,
        cliente_tipo: clienteRes.data.tipo,
        veiculo_id: veiculo.id,
        cliente_id: clienteRes.data.id,
      };

      setOrdemParaEditar({ ...ordemPreenchida });
      setFormAberto(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setCadastroAberto(true);
      } else {
        alert('Erro ao buscar veículo.');
      }
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

      const ordemComTotal = { ...os, total: valorTotal };
      setOrdemParaFechar(ordemComTotal);
      setFecharAberto(true);
    } catch (err) {
      alert('Erro ao buscar os serviços da OS.');
      console.error(err);
    }
  };

  
  const fecharOrdem = async (formaPagamento) => {
    if (!ordemParaFechar) return;

    //valida se é lojista caso a forma de pagamento seja faturar
    if (
      formaPagamento.toLowerCase() === 'faturar' &&
      ordemParaFechar?.cliente?.tipo !== 'lojista'
    ) {
      alert('Somente clientes lojistas podem usar a opção Faturar.');
      return;
    }
    try {
      // const dataFechamento = new Date().toISOString().split('T')[0];
      const dataFechamento = new Date().toISOString();
      const dataCaixa = dataFechamento.split('T')[0];  // só data
  
      // Atualiza o status da OS
      await api.put(`/ordens-servico/${ordemParaFechar.id}/`, {
        status: 'finalizada',
        forma_pagamento: formaPagamento,
        data_fechamento: dataFechamento
      });
  
      // Busca os serviços vinculados à OS
      const resServicos = await api.get(`/servicos-da-os/${ordemParaFechar.id}/`);
      const valorTotal = resServicos.data.reduce((acc, s) => acc + Number(s.valor), 0);
  
      // Cria o lançamento no caixa apenas se a forma de pagamento for diferente de "Faturar"
      if (formaPagamento.toLowerCase() !== 'faturar') {
        await api.post('/caixa/', {
          data: dataCaixa,
          tipo: 'entrada',
          origem: `OS #${ordemParaFechar.id}`,
          descricao: `${ordemParaFechar.veiculo?.placa || ''} ${ordemParaFechar.cliente?.nome || ''}`,
          categoria: 'serviços',
          valor: valorTotal,
          forma_pagamento: formaPagamento
        });
      }
  
      setFecharAberto(false);
      setOrdemParaFechar(null);
      carregarOrdens();
    } catch (err) {
      alert('Erro ao fechar a ordem de serviço.');
      console.error(err);
    }
  };
  
  

  const excluirOrdem = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta ordem de serviço?')) return;
    try {
      await api.delete(`/ordens-servico/${id}/`);
      carregarOrdens();
    } catch {
      alert('Erro ao excluir a OS.');
    }
  };

  const toggleOrdenacao = (coluna) => {
    if (ordenarPor === coluna) {
      setOrdemCrescente(!ordemCrescente);
    } else {
      setOrdenarPor(coluna);
      setOrdemCrescente(true);
    }
  };

  const ordensFiltradas = [...ordens]
    
    .filter(os => {
        const nomeOuPlaca = (os.cliente?.nome?.toLowerCase() || '') + (os.veiculo?.placa?.toLowerCase() || '');
        if (!nomeOuPlaca.includes(filtro.toLowerCase())) return false;

        const dataEntrada = new Date(os.data);
        const hoje = new Date();
        const inicioSemana = new Date(); inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1);
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        if (filtroData === 'hoje' && dataEntrada.toDateString() !== hoje.toDateString()) return false;
        if (filtroData === 'semana' && dataEntrada < inicioSemana) return false;
        if (filtroData === 'mes' && dataEntrada < inicioMes) return false;
        if (filtroData === 'personalizado') {
          const ini = dataInicio ? new Date(dataInicio) : null;
          const fim = dataFim ? new Date(dataFim) : null;
          // if ((ini && dataEntrada < ini) || (fim && dataEntrada > fim)) return false;
          const apenasData = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const dataEntradaAjustada = apenasData(dataEntrada);

          if (
            (ini && dataEntradaAjustada < apenasData(ini)) ||
            (fim && dataEntradaAjustada > apenasData(fim))
          ) return false;
        }
        
        // 🟢 Filtro de status 
        if (filtroStatus !== 'todos' && os.status !== filtroStatus) return false;

        return true;
      })

    .sort((a, b) => {
      const aVal = a[ordenarPor]?.toString().toLowerCase?.() || '';
      const bVal = b[ordenarPor]?.toString().toLowerCase?.() || '';
      if (aVal < bVal) return ordemCrescente ? -1 : 1;
      if (aVal > bVal) return ordemCrescente ? 1 : -1;
      return 0;
    });

  const iconeOrdenacao = (coluna) => {
    if (ordenarPor !== coluna) return '';
    return ordemCrescente ? '↑' : '↓';
  };

  const formatarDataHora = (data) => {
    const dt = new Date(data);
    return `${dt.toLocaleDateString('pt-BR')}, ${dt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
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
            onChange={e => setFiltro(e.target.value)}
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
              <strong>Status: </strong>
              <button onClick={() => setFiltroStatus('aberta')} className={filtroStatus === 'aberta' ? 'ativo' : ''}>Aberta</button>
              <button onClick={() => setFiltroStatus('finalizada')} className={filtroStatus === 'finalizada' ? 'ativo' : ''}>Finalizada</button>
              <button onClick={() => setFiltroStatus('todos')} className={filtroStatus === 'todos' ? 'ativo' : ''}>Todos</button>
          </div>
        </div>

    <div className='tabela-scroll'>
      <table className='tabela'>
          <thead>
            <tr>
              <th onClick={() => toggleOrdenacao('id')} style={{ cursor: 'pointer' }}>ID {iconeOrdenacao('id')}</th>
              <th onClick={() => toggleOrdenacao('data')} style={{ cursor: 'pointer' }}>Entrada {iconeOrdenacao('data')}</th>
              <th onClick={() => toggleOrdenacao('cliente')} style={{ cursor: 'pointer' }}>Cliente {iconeOrdenacao('cliente')}</th>
              <th onClick={() => toggleOrdenacao('placa')} style={{ cursor: 'pointer' }}>Placa {iconeOrdenacao('placa')}</th>
              <th onClick={() => toggleOrdenacao('status')} style={{ cursor: 'pointer' }}>Status {iconeOrdenacao('status')}</th>
              <th onClick={() => toggleOrdenacao('forma_pagamento')} style={{ cursor: 'pointer' }}>Pagamento {iconeOrdenacao('forma_pagamento')}</th>
              <th>Saida</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordensFiltradas.map(os => (
              <tr key={os.id}>
                <td>{os.id}</td>
                <td>{formatarDataHora(os.data)}</td>
                <td>{os.cliente?.nome || ''}</td>
                <td>{os.veiculo?.placa || ''}</td>
                <td>{os.status}</td>
                <td>{os.forma_pagamento}</td>
                <td>{os.data_fechamento ? formatarDataHora(os.data_fechamento) : ''}</td>
                <td>
                  <button className="icon-button editar" onClick={() => abrirForm(os)} title="Editar">
                    <Edit size={18} />
                  </button>
                  {usuario.tipo !== 'operador' ? (
                    <button
                      className="icon-button excluir"
                      onClick={() => excluirOrdem(os.id)}
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <button className="icon-button excluir" title="Excluir" disabled>
                      <Trash2 size={18} />
                    </button>
                  )}

                  <button
                    className={`icon-button fechar ${os.status === 'finalizada' ? 'desativado' : ''}`}
                    onClick={() => abrirFechamento(os)}
                    title="Fechar"
                    disabled={os.status === 'finalizada'} // ← desabilita o botão se a OS estiver finalizada
                  >
                    <CreditCard size={18} />
                </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            carregarOrdens();
          }}
          atualizarOrdens={carregarOrdens}
        />
      )}

      {fecharAberto && (
        <FechaOrdemServico
          ordem={ordemParaFechar}
          onClose={() => {
            setFecharAberto(false);
            setOrdemParaFechar(null);
            carregarOrdens();
          }}
          onConfirm={fecharOrdem} // correção: passa a função correta
        />
      )}

      {cadastroAberto && (
        <CadastroClienteVeiculo
          placa={placaBusca}
          onClose={() => setCadastroAberto(false)}
          onConfirm={dados => {
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

          
