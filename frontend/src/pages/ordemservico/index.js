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

  const abrirFechamento = (os) => {
    setOrdemParaFechar(os);
    setFecharAberto(true);
  };

  // const fecharOrdem = async (formaPagamento) => {
  //   if (!ordemParaFechar) return;
  //   try {
  //     await api.put(`/ordens-servico/${ordemParaFechar.id}/`, {
  //       status: 'finalizada',
  //       forma_pagamento: formaPagamento,
  //       data_fechamento: new Date().toISOString()
  //     });
  //     setFecharAberto(false);
  //     setOrdemParaFechar(null);
  //     carregarOrdens();
  //   } catch {
  //     alert('Erro ao fechar a ordem de serviço.');
  //   }
  // };

  const fecharOrdem = async (formaPagamento) => {
    if (!ordemParaFechar) return;
  
    try {
      const dataFechamento = new Date().toISOString().split('T')[0];
  
      // Atualiza o status da OS
      await api.put(`/ordens-servico/${ordemParaFechar.id}/`, {
        status: 'finalizada',
        forma_pagamento: formaPagamento,
        data_fechamento: dataFechamento
      });
  
      // Busca os serviços vinculados à OS
      const resServicos = await api.get(`/servicos-da-os/${ordemParaFechar.id}/`);
      const valorTotal = resServicos.data.reduce((acc, s) => acc + Number(s.valor), 0);
  
      // Cria o lançamento no caixa
      await api.post('/caixa/', {
        data: dataFechamento,
        tipo: 'entrada',
        origem: `OS #${ordemParaFechar.id}`,
        descricao: `${ordemParaFechar.veiculo?.placa || ''} ${ordemParaFechar.cliente?.nome || ''}`,
        categoria: 'serviços',
        valor: valorTotal
      });
  
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
    .filter(os =>
      (os.cliente?.nome?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
      (os.veiculo?.placa?.toLowerCase() || '').includes(filtro.toLowerCase())
    )
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

      <input
        className="input-filtro"
        placeholder="Filtrar por cliente ou placa..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
      />

      <table className="tabela">
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
              {/* <td>{new Date(os.data).toLocaleDateString()}</td> */}
              <td>{os.cliente?.nome || ''}</td>
              <td>{os.veiculo?.placa || ''}</td>
              <td>{os.status}</td>
              <td>{os.forma_pagamento}</td>
              <td>{os.data_fechamento ? formatarDataHora(os.data_fechamento) : ''}</td>
              {/* <td>{os.data_fechamento ? new Date(os.data_fechamento).toLocaleString() : ''}</td> */}
              <td>
                <button className="icon-button editar" onClick={() => abrirForm(os)} title="Editar">
                  <Edit size={18} />
                </button>
                <button 
                  className={`icon-button excluir ${os.status === 'finalizada' ? 'desativado' : ''}`}
                  onClick={() => excluirOrdem(os.id)} 
                  title="Excluir"
                  disabled={os.status === 'finalizada'}
                >
                  <Trash2 size={18} />
                </button>
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
          onConfirm={veiculo => {
            setOrdemParaEditar({ veiculo });
            setCadastroAberto(false);
            setFormAberto(true);
          }}
        />
      )}
    </div>
  );
}

export default OrdensServico;


