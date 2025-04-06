import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import './ordemServicoForm.css';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';

const OrdemServicoForm = ({ ordemSelecionada, onClose, atualizarOrdens }) => {
  const [ordem, setOrdem] = useState({
    id: '',
    data: '',
    status: 'aberta',
    operador: '',
    forma_pagamento: 'dinheiro',
    valor_recebido: '',
    placa: '',
    marca: '',
    modelo: '',
    cliente_nome: '',
    cliente_celular: '',
    cliente_email: '',
    cliente_tipo: 'particular',
    veiculo_id: null,
    cliente_id: null,
    servicos: [],
  });
  const [todosServicos, setTodosServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState('');

  useEffect(() => {
    axios.get('/servicos/').then(res => setTodosServicos(res.data));
  }, []);

  useEffect(() => {
    if (ordemSelecionada) {
      axios.get(`/ordens-servico/${ordemSelecionada.id}/`).then(res => {
        setOrdem({
          ...res.data,
          placa: res.data.veiculo.placa,
          marca: res.data.veiculo.marca,
          modelo: res.data.veiculo.modelo,
          cliente_nome: res.data.cliente.nome,
          cliente_celular: res.data.cliente.celular,
          cliente_email: res.data.cliente.email,
          cliente_tipo: res.data.cliente.tipo,
        });
      });
    }
  }, [ordemSelecionada]);

  const buscarPorPlaca = async () => {
    try {
      const res = await axios.get(`/veiculos/placa/${ordem.placa}/`);
      const veiculo = res.data;
      setOrdem(prev => ({
        ...prev,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        cliente_nome: veiculo.cliente.nome,
        cliente_celular: veiculo.cliente.celular,
        cliente_email: veiculo.cliente.email,
        cliente_tipo: veiculo.cliente.tipo,
        veiculo_id: veiculo.id,
        cliente_id: veiculo.cliente.id,
      }));
    } catch {
      setOrdem(prev => ({ ...prev, veiculo_id: null, cliente_id: null }));
    }
  };

  const adicionarServico = () => {
    const servico = todosServicos.find(s => s.id === parseInt(servicoSelecionado));
    if (!servico) return;
    setOrdem(prev => ({
      ...prev,
      servicos: [...prev.servicos, { ...servico, quantidade: 1 }],
    }));
    setServicoSelecionado('');
  };

  const removerServico = (index) => {
    setOrdem(prev => ({
      ...prev,
      servicos: prev.servicos.filter((_, i) => i !== index),
    }));
  };

  const calcularTotal = () => {
    return ordem.servicos.reduce((acc, s) => acc + parseFloat(s.valor), 0).toFixed(2);
  };

  const salvarOrdem = async () => {
    try {
      let clienteId = ordem.cliente_id;
      if (!clienteId) {
        const cliente = await axios.post('/clientes/', {
          nome: ordem.cliente_nome,
          celular: ordem.cliente_celular,
          email: ordem.cliente_email,
          tipo: ordem.cliente_tipo,
        });
        clienteId = cliente.data.id;
      }

      let veiculoId = ordem.veiculo_id;
      if (!veiculoId) {
        const veiculo = await axios.post('/veiculos/', {
          placa: ordem.placa,
          marca: ordem.marca,
          modelo: ordem.modelo,
          cliente: clienteId,
        });
        veiculoId = veiculo.data.id;
      }

      const payload = {
        status: ordem.status,
        forma_pagamento: ordem.forma_pagamento,
        valor_recebido: ordem.valor_recebido,
        operador: ordem.operador,
        cliente: clienteId,
        veiculo: veiculoId,
      };

      let os;
      if (ordem.id) {
        os = await axios.put(`/ordens-servico/${ordem.id}/`, payload);
      } else {
        os = await axios.post('/ordens-servico/', payload);
      }

      await axios.delete(`/ordens-servico/${os.data.id}/servicos/`);
      await Promise.all(
        ordem.servicos.map(s =>
          axios.post('/servicos-ordem-servico/', {
            ordem_servico: os.data.id,
            servico: s.id,
            quantidade: 1,
            valor: s.valor,
          })
        )
      );

      atualizarOrdens();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container os-form">
        <h3>Ordem de Serviço - Detalhes</h3>

        <div className="linha">
          <div><label>#OS</label><input value={ordem.id || ''} readOnly /></div>
          <div><label>Data</label><input value={ordem.data || ''} readOnly /></div>
          <div>
            <label>Status</label>
            <select value={ordem.status} onChange={e => setOrdem({ ...ordem, status: e.target.value })}>
              <option value="aberta">Aberta</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div><label>Operador</label><input value={ordem.operador || ''} onChange={e => setOrdem({ ...ordem, operador: e.target.value })} /></div>
          <div>
            <label>Forma Pagto</label>
            <select value={ordem.forma_pagamento} onChange={e => setOrdem({ ...ordem, forma_pagamento: e.target.value })}>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="debito">Cartão Débito</option>
              <option value="credito">Cartão Crédito</option>
              <option value="faturar">Faturar</option>
            </select>
          </div>
          <div><label>Valor Recebido</label><input value={ordem.valor_recebido || ''} onChange={e => setOrdem({ ...ordem, valor_recebido: e.target.value })} /></div>
        </div>

        <div className="linha">
          <div><label>Placa</label><input value={ordem.placa} onChange={e => setOrdem({ ...ordem, placa: e.target.value })} onBlur={buscarPorPlaca} /></div>
          <div><label>Marca</label><input value={ordem.marca} onChange={e => setOrdem({ ...ordem, marca: e.target.value })} /></div>
          <div><label>Modelo</label><input value={ordem.modelo} onChange={e => setOrdem({ ...ordem, modelo: e.target.value })} /></div>
        </div>

        <div className="linha">
          <div><label>Proprietário</label><input value={ordem.cliente_nome} onChange={e => setOrdem({ ...ordem, cliente_nome: e.target.value })} /></div>
          <div><label>Cel (WhatsApp)</label><input value={ordem.cliente_celular} onChange={e => setOrdem({ ...ordem, cliente_celular: e.target.value })} /></div>
          <div><label>E-mail</label><input value={ordem.cliente_email} onChange={e => setOrdem({ ...ordem, cliente_email: e.target.value })} /></div>
        </div>

        <div className="linha">
          <div><label>Tipo</label>
            <select value={ordem.cliente_tipo} onChange={e => setOrdem({ ...ordem, cliente_tipo: e.target.value })}>
              <option value="particular">Particular</option>
              <option value="lojista">Lojista</option>
            </select>
          </div>
        </div>

        <h4>Serviços</h4>
        <table className="tabela-servicos">
          <thead>
            <tr><th>Serviço</th><th>Valor</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {ordem.servicos.map((s, index) => (
              <tr key={index}>
                <td>{s.nome}</td>
                <td>{parseFloat(s.valor).toFixed(2)}</td>
                <td>
                  <button className="icon-button excluir" onClick={() => removerServico(index)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            <tr>
              <td>
                <select value={servicoSelecionado} onChange={e => setServicoSelecionado(e.target.value)}>
                  <option value="">(adicionar um serviço)</option>
                  {todosServicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </td>
              <td colSpan="2"><button className="btn" onClick={adicionarServico}>Adicionar</button></td>
            </tr>
          </tbody>
        </table>

        <div className="total">TOTAL: R$ {calcularTotal()}</div>
        <div className="form-buttons"><button className="btn-primary" onClick={salvarOrdem}>Salvar</button></div>
      </div>
    </div>
  );
};

export default OrdemServicoForm;
