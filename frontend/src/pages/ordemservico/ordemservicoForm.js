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
  const [todosServicos, setTodosServicos] = useState([]); // sempre array
  const [servicoSelecionado, setServicoSelecionado] = useState('');
  const [valorUnitarioCustom, setValorUnitarioCustom] = useState('');

  // --- CORREÇÃO: trata paginação do DRF + forçar page_size alto (se quiser)
  useEffect(() => {
    axios
      .get('/servicos/', { params: { page_size: 500 } })
      .then(res => {
        const data = res.data;
        const lista = Array.isArray(data) ? data : (data?.results ?? []);
        setTodosServicos(Array.isArray(lista) ? lista : []);
      })
      .catch(err => {
        console.error('[SERVIÇOS API] Erro:', err);
        setTodosServicos([]); // garante array
      });
  }, []);

  const buscarPorPlaca = async (placaInput) => {
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
        veiculo_id: v.placa, // se a PK do veículo é a placa, tudo certo
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
    if (!editData) return;

    if (typeof editData === 'string') {
      buscarPorPlaca(editData);
      return;
    }

    // edição de uma OS existente
    if (editData.id) {
      axios.get(`/ordens-servico/${editData.id}/`).then(res => {
        const d = res.data;

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
          servicos: (d.servicos_ordem || []).map(s => ({
            ...s,
            // normaliza para o formulário
            descricao: s.servico?.descricao ?? s.descricao,
            quantidade: s.quantidade,
            valor_unitario: s.valor, // no backend é "valor"
          })),
        });
      });
    } else if (editData.placa && !editData.id) {
      (async () => {
        try {
          const { placa, cliente_id } = editData;
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
      })();
    }
  }, [editData]);

  const adicionarServico = () => {
    const lista = Array.isArray(todosServicos) ? todosServicos : [];
    const s = lista.find(x => String(x.id) === String(servicoSelecionado));
    if (!s) return;

    const unit =
      valorUnitarioCustom !== '' && !isNaN(parseFloat(valorUnitarioCustom))
        ? parseFloat(valorUnitarioCustom)
        : (s.valor_unitario ?? s.valor ?? 0);

    const novoServico = {
      id: s.id,
      descricao: s.descricao,
      quantidade: quantidadeServico || 1,
      valor_unitario: parseFloat(unit),
    };

    setOrdem(prev => ({
      ...prev,
      servicos: [...prev.servicos, novoServico],
    }));
    setServicoSelecionado('');
    setQuantidadeServico(1);
    setValorUnitarioCustom('');
  };

  const removerServico = (idx) => {
    setOrdem(prev => ({ ...prev, servicos: prev.servicos.filter((_, i) => i !== idx) }));
  };

  const calcularTotal = () => {
    const total = (ordem.servicos || []).reduce((sum, s) => {
      const q = Number(s.quantidade || 1);
      const vu = Number(s.valor_unitario || 0);
      const sub = isNaN(q * vu) ? 0 : q * vu;
      return sum + sub;
    }, 0);
    return total.toFixed(2);
  };

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
      };

      const osRes = ordem.id
        ? await axios.put(`/ordens-servico/${ordem.id}/`, payload)
        : await axios.post('/ordens-servico/', payload);

      // Remove serviços antigos ao editar
      if (ordem.id) {
        const servicosAntigos = await axios.get(`/ordens-servico/${osRes.data.id}/`);
        const antigos = servicosAntigos.data?.servicos_ordem ?? [];
        await Promise.all(
          antigos.map(s => axios.delete(`/servicos-ordem/${s.id}/`))
        );
      }

      // Recria serviços da OS
      await Promise.all(
        (ordem.servicos || []).map(s => {
          const servicoId = s.servico || s.id || s.servico_id;
          const valor = parseFloat(s.valor_unitario ?? s.valor ?? 0);
          const quantidade = parseInt(s.quantidade ?? 1, 10);

          return axios.post('/servicos-ordem/', {
            ordem_servico: osRes.data.id,
            servico: servicoId,
            quantidade,
            valor,
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
            <input className="read-only" value={ordem.forma_pagamento} readOnly />
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
          <div>
            <label>Placa</label>
            <input
              value={ordem.placa}
              className='read-only'
              readOnly
              onChange={e => setOrdem({ ...ordem, placa: e.target.value.toUpperCase() })}
              onBlur={() => buscarPorPlaca(ordem.placa)}
            />
          </div>
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
            {(ordem.servicos || []).map((s, i) => {
              const qtd = Number(s.quantidade || 1);
              const vu = Number(s.valor_unitario || 0);
              const sub = isNaN(qtd * vu) ? 0 : qtd * vu;
              return (
                <tr key={i}>
                  <td style={{ width: '300px' }}>{s.descricao}</td>
                  <td style={{ width: '150px' }}>{qtd}</td>
                  <td style={{ width: '150px' }}>R$ {vu.toFixed(2)}</td>
                  <td style={{ width: '150px' }}>R$ {sub.toFixed(2)}</td>
                  <td style={{ width: '80px' }}>
                    {(ordem.status !== 'finalizada' || ehAdmin) && (
                      <button className="icon-button excluir" onClick={() => removerServico(i)}>
                        <FiTrash2 />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {(ordem.status !== 'finalizada' || ehAdmin) && (
              <tr>
                <td>
                  <select
                    value={servicoSelecionado}
                    onChange={(e) => {
                      const id = e.target.value;
                      setServicoSelecionado(id);
                      const lista = Array.isArray(todosServicos) ? todosServicos : [];
                      const servico = lista.find(s => String(s.id) === String(id));
                      if (servico) {
                        // fallback para nome do campo no backend
                        const defaultVU = servico.valor_unitario ?? servico.valor ?? 0;
                        setValorUnitarioCustom(defaultVU);
                      } else {
                        setValorUnitarioCustom('');
                      }
                    }}
                  >
                    <option value="">-- adicionar serviço --</option>
                    {(Array.isArray(todosServicos) ? todosServicos : []).map(s => (
                      <option key={s.id} value={s.id}>{s.descricao}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={quantidadeServico}
                    onChange={e => setQuantidadeServico(parseInt(e.target.value, 10) || 1)}
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
