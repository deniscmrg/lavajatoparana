import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import './ordemServicoForm.css';
import { FiTrash2 } from 'react-icons/fi';

const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
const ehAdmin = usuario.tipo === 'admin';

// const dataHoje = new Date().toISOString();
const dataHoje = new Date().toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const OrdemServicoForm = ({ editData, onClose, atualizarOrdens }) => {
  const [quantidadeServico, setQuantidadeServico] = useState(1);
  const [ordem, setOrdem] = useState({
    id: '',
    data: dataHoje,
    status: 'aberta',
    operador: '',
    forma_pagamento: '',
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
  const [valorUnitarioCustom, setValorUnitarioCustom] = useState('');

  useEffect(() => {
    axios.get('/servicos/')
      .then(res => setTodosServicos(res.data))
      .catch(err => console.error('[SERVIÇOS API] Erro:', err));
  }, []);

  const buscarPorPlaca = async placaInput => {
    const placaUpper = placaInput.toUpperCase();
    try {
      const res = await axios.get(`/veiculos/${placaUpper}/`);
      const v = res.data;
      const clienteRes = await axios.get(`/clientes/${v.cliente}/`);
      const c = clienteRes.data;

      setOrdem(prev => ({
        ...prev,
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        cliente_nome: c.nome,
        cliente_celular: c.celular,
        cliente_email: c.email,
        cliente_tipo: c.tipo,
        veiculo_id: v.placa,
        cliente_id: c.id,
      }));
    } catch (err) {
      console.error('Erro ao buscar placa:', err);
      setOrdem(prev => ({
        ...prev,
        placa: placaUpper,
        veiculo_id: null,
        cliente_id: null,
        marca: '',
        modelo: '',
        cliente_nome: '',
        cliente_celular: '',
        cliente_email: '',
        cliente_tipo: 'particular',
      }));
    }
  };

  useEffect(() => {
    console.log('[DEBUG] editData recebido no OrdemServicoForm:', editData);
    console.log('[DEBUG] editData ID:', editData.id);
    console.log('[DEBUG] editData placa:', editData.placa);
    if (!editData) return;

    if (typeof editData === 'string') {
      buscarPorPlaca(editData);
      return;
    }

    //edição de uma os existente
    if (editData.id) {
      console.log("achou o editDAta.id e entrou no if")
      axios.get(`/ordens-servico/${editData.id}/`).then(res => {
        const d = res.data;
        
        //tratamento da data
        const dataOriginal = new Date(d.data);
        const dataFormatada = `${dataOriginal.toLocaleDateString('pt-BR')}, ${dataOriginal.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;


        setOrdem({
          id: d.id,
          data: dataFormatada,
          status: d.status,
          operador: d.operador,
          forma_pagamento: d.forma_pagamento,
          valor_recebido: d.valor_recebido,
          placa: d.veiculo.placa,
          marca: d.veiculo.marca,
          modelo: d.veiculo.modelo,
          cliente_nome: d.cliente.nome,
          cliente_celular: d.cliente.celular,
          cliente_email: d.cliente.email,
          cliente_tipo: d.cliente.tipo,
          veiculo_id: d.veiculo.placa,
          cliente_id: d.cliente.id,
          servicos: d.servicos_ordem?.map(s => ({
            ...s,
            valor_unitario: s.valor,
            quantidade: s.quantidade
          })) || [],
        });
      });
    } 
    
    else if (editData.placa && !editData.id) {
      const carregarVeiculoECliente = async () => {
        try {
          
          const { placa, cliente_id } = editData;

          console.log('[DEBUG] Dados carregados:', placa, cliente_id);

          const resVeiculo = await axios.get(`/veiculos/${placa}/`);
          const v = resVeiculo.data;
    
          const resCliente = await axios.get(`/clientes/${cliente_id}/`);
          const c = resCliente.data;
          
          setOrdem(prev => ({
            ...prev,
            placa: v.placa,
            marca: v.marca,
            modelo: v.modelo,
            cliente_nome: c.nome,
            cliente_celular: c.celular,
            cliente_email: c.email,
            cliente_tipo: c.tipo,
            veiculo_id: v.placa,
            cliente_id: c.id,
          }));
        } catch (err) {
          console.error('[ERRO ao carregar cliente/veículo pós-cadastro]', err);
        }
      };
    
      carregarVeiculoECliente();
    }
  }, [editData]);

  const adicionarServico = () => {
    const s = todosServicos.find(x => x.id === parseInt(servicoSelecionado));
    if (!s) return;
    const novoServico = {
      id: s.id,
      descricao: s.descricao,
      quantidade: quantidadeServico,
      valor_unitario: parseFloat(valorUnitarioCustom),
    };
    setOrdem(prev => ({
      ...prev,
      servicos: [...prev.servicos, novoServico],
    }));
    setServicoSelecionado('');
    setQuantidadeServico(1);
    setValorUnitarioCustom('');
  };

  const removerServico = idx => {
    setOrdem(prev => ({ ...prev, servicos: prev.servicos.filter((_, i) => i !== idx) }));
  };

  // const calcularTotal = () =>
  //   ordem.servicos.reduce((sum, s) => sum + parseFloat(s.valor_unitario || 0) * (s.quantidade || 1), 0).toFixed(2);

  const calcularTotal = () => {
    if (!ordem.servicos || !Array.isArray(ordem.servicos)) return 0;
    return ordem.servicos.reduce((soma, s) => {
      const valor = parseFloat(s.valor_unitario || s.valor || 0);
      const qtd = parseFloat(s.quantidade || 1);
      return soma + (valor * qtd);
    }, 0);
  };
////////////////
const salvarOrdem = async () => {
  if (!ordem.operador || ordem.operador.trim() === '') {
    alert('Por favor, preencha o nome do operador.');
    return;
  }

  try {
    let clienteId = ordem.cliente_id;
    if (!clienteId) {
      const cli = await axios.post('/clientes/', {
        nome: ordem.cliente_nome,
        celular: ordem.cliente_celular,
        email: ordem.cliente_email,
        tipo: ordem.cliente_tipo,
      });
      clienteId = cli.data.id;
      }

    let veiculoPlaca = ordem.veiculo_id;
    if (!veiculoPlaca) {
      const veh = await axios.post('/veiculos/', {
        placa: ordem.placa,
        marca: ordem.marca,
        modelo: ordem.modelo,
        cliente: clienteId,
      });
      veiculoPlaca = veh.data.placa;
    }

    const payload = {
      status: ordem.status,
      forma_pagamento: ordem.forma_pagamento,
      operador: ordem.operador,
      cliente_id: clienteId,
      veiculo_id: veiculoPlaca,
      total: parseFloat(calcularTotal()),
    };

    // salva os dados:
        const osRes = ordem.id     
      // se existir um id, faz um update
      ? await axios.put(`/ordens-servico/${ordem.id}/`, payload)
      // se não existir um id, faz um insert
      : await axios.post('/ordens-servico/', payload);

    console.log('1- Vai apagar a lista de serviços')
    if (ordem.id) {
      const servicosAntigos = await axios.get(`/ordens-servico/${osRes.data.id}/`);
      await Promise.all(
        servicosAntigos.data.servicos_ordem.map(s =>
          axios.delete(`/servicos-ordem/${s.id}/`)
        )
      );
    }
    await Promise.all(
      ordem.servicos.map(s => {
        const servicoId = s.servico || s.id || s.servico_id;
        const valor = parseFloat(s.valor_unitario || s.valor);
    
        return axios.post('/servicos-ordem/', {
          ordem_servico: osRes.data.id,
          servico: servicoId,
          quantidade: parseInt(s.quantidade),
          valor: valor,
        });
      })
    );

    atualizarOrdens();
    onClose();
  } catch (err) {
    console.error('Erro ao salvar OS:', err);
    alert('Erro ao salvar OS');
  }
};

  return (
    <div className="form-overlay">
      <div className="form-container os-form"> 
        <div className="form-header">
          <h3>Ordem de Serviço</h3>
        </div>

        <div className="linha">
          <div><label>#OS</label><input className='read-only' value={ordem.id} readOnly /></div>
          <div><label>Data</label><input className='read-only' value={ordem.data} readOnly /></div>
          <div><label>Status</label><input className='read-only' value={ordem.status} readOnly /></div>
          <div>
            <label>Forma Pagto</label>
            <input
              className="read-only"
              value={ordem.forma_pagamento}
              readOnly
            />
          </div>
          <div><label>Operador</label>
            <input
              className='operador-input'
              required
              value={ordem.operador}
              onChange={e => setOrdem({ ...ordem, operador: e.target.value })}
              readOnly={ordem.status === 'fechada'}
            />
          </div>
        </div>

        <div className="linha">
          <div><label>Placa</label>
          <input value={ordem.placa} className='read-only' readOnly onChange={e => setOrdem({ ...ordem, placa: e.target.value.toUpperCase() })} onBlur={() => buscarPorPlaca(ordem.placa)} /></div>
          <div><label>Marca</label><input value={ordem.marca} className='read-only' readOnly /></div>
          <div><label>Modelo</label><input value={ordem.modelo} className='read-only' readOnly /></div>
        </div> 

        <div className="linha">
          <div><label>Proprietário</label><input value={ordem.cliente_nome} className='read-only' readOnly onChange={e => setOrdem({ ...ordem, cliente_nome: e.target.value })} /></div>
          <div><label>Celular</label><input value={ordem.cliente_celular} className='read-only' readOnly onChange={e => setOrdem({ ...ordem, cliente_celular: e.target.value })} /></div>
          <div><label>E-mail</label><input value={ordem.cliente_email} className='read-only' readOnly onChange={e => setOrdem({ ...ordem, cliente_email: e.target.value })} /></div>
          <div><label>Tipo</label>
            <input value={ordem.cliente_tipo} className='read-only' readOnly onChange={e => setOrdem({ ...ordem, cliente_tipo: e.target.value })} />
          </div>
        </div>


        <h4>Serviços</h4>
        <table className="tabela-servicos">
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Qtd</th>
              <th>Valor Unitário</th>
              <th>Subtotal</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordem.servicos.map((s, i) => (
              <tr key={i}>
                <td style={{ width: '300px'}}>{s.descricao}</td>
                <td style={{ width: '150px'}}>{s.quantidade}</td>
                <td style={{ width: '150px'}}>R$ {parseFloat(s.valor_unitario).toFixed(2)}</td>
                <td>
                  R$ {(parseFloat(s.valor_unitario || 0) * parseFloat(s.quantidade || 1)).toFixed(2)}
                </td>
                {/* <td style={{ width: '150px'}}>R$ {(s.quantidade * s.valor_unitario).toFixed(2)}</td> */}

                <td style={{ width: '80px'}}>
                  {(ordem.status !== 'finalizada' || ehAdmin) && (
                    <button className="icon-button excluir" onClick={() => removerServico(i)}><FiTrash2 /></button>
                  )}
                </td>
              </tr>
            ))}

            
            {(ordem.status !== 'finalizada' || ehAdmin) && (
              <tr>
                <td>
                  <select
                    value={servicoSelecionado}
                    onChange={(e) => {
                      const id = e.target.value;
                      setServicoSelecionado(id);
                      const servico = todosServicos.find(s => s.id === parseInt(id));
                      if (servico) {
                        setValorUnitarioCustom(servico.valor_unitario);
                      }
                    }}
                  >
                    <option value="">-- adicionar serviço --</option>
                    {todosServicos.map(s => (
                      <option key={s.id} value={s.id}>{s.descricao}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={quantidadeServico}
                    onChange={e => setQuantidadeServico(parseInt(e.target.value) || 1)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorUnitarioCustom}
                    onChange={e => setValorUnitarioCustom(e.target.value)}
                  />
                </td>
                <td colSpan="1"></td>
                <td><button className="btn" onClick={adicionarServico}>Adicionar</button></td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="total">TOTAL: R$ {calcularTotal()}</div>
        <div className="form-buttons">
          
          {/* <button className="btn-primary" onClick={salvarOrdem}>Salvar</button> */}
          <button className="btn-primary" onClick={salvarOrdem} disabled={ordem.status === 'finalizada' && !ehAdmin}>
            Salvar
          </button>

          <button type="button" className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default OrdemServicoForm;
