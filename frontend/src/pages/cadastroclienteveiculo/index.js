import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './cadastroclienteveiculo.css';

const CadastroClienteVeiculo = ({ placa, onClose, onConfirm }) => {
  const [nome, setNome] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('particular');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [clienteExistente, setClienteExistente] = useState(null);

  useEffect(() => {
    async function fetchMarcas() {
      try {
        const res = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
        const data = await res.json();
        setMarcas(data);
      } catch (err) {
        console.error('Erro ao carregar marcas FIPE:', err);
      }
    }
    fetchMarcas();
  }, []);

  useEffect(() => {
    async function fetchModelos() {
      if (!marca) {
        setModelos([]);
        return;
      }
      try {
        const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marca}/modelos`);
        const data = await res.json();
        setModelos(data.modelos);
      } catch (err) {
        console.error('Erro ao carregar modelos FIPE:', err);
      }
    }
    fetchModelos();
  }, [marca]);

  const verificarCliente = async () => {
    try {
      const res = await api.get(`/clientes/?celular=${celular}`);
      const cliente = res.data.find(c => c.celular === celular);
      if (cliente) {
        setClienteExistente(cliente);
        setNome(cliente.nome);
        setEmail(cliente.email);
        setTipo(cliente.tipo);
        alert('Cliente já cadastrado. Dados preenchidos automaticamente.');
      } else {
        setClienteExistente(null);
        alert('Cliente não encontrado. Preencha os dados para cadastrar.');
      }
    } catch (err) {
      console.error('Erro ao verificar cliente:', err);
      alert('Erro ao verificar cliente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let clienteId;
      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        const clienteRes = await api.post('/clientes/', {
          nome,
          email,
          celular,
          tipo,
        });
        clienteId = clienteRes.data.id;
      }

      const veiculoRes = await api.post('/veiculos/', {
        placa,
        marca: marcas.find((m) => m.codigo === marca)?.nome || '',
        modelo,
        cor: cor || '',
        cliente: clienteId,
      });

      console.log('dados enviados no onConfirm:', clienteId, veiculoRes.data.placa )
      onConfirm({ placa: veiculoRes.data.placa, cliente_id: clienteId });
      onClose();
    } catch (err) {
      console.error('Erro ao cadastrar cliente/veículo:', err);
      alert('Erro ao cadastrar cliente ou veículo.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo cadastro-cv">
        <h3>Cadastro de Cliente & Veículo</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ flexGrow: 1 }}>
                <label>Celular</label>
                <input
                  type="text"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  required
                />
              </div>
              <button type="button" className="btn" onClick={verificarCliente}>Verificar</button>
            </div>
            <div>
              <label>Nome do Proprietário</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={!!clienteExistente}
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!clienteExistente}
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} required disabled={!!clienteExistente}>
                <option value="particular">Particular</option>
                <option value="lojista">Lojista</option>
              </select>
            </div>
            <div>
              <label>Placa</label>
              <input type="text" value={placa} disabled />
            </div>
            <div>
              <label>Marca</label>
              <select value={marca} onChange={(e) => setMarca(e.target.value)} required>
                <option value="">Selecione</option>
                {marcas.map((m) => (
                  <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Modelo</label>
              <select value={modelo} onChange={(e) => setModelo(e.target.value)} required>
                <option value="">Selecione</option>
                {modelos.map((m) => (
                  <option key={m.codigo} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Cor</label>
              <input type="text" value={cor} onChange={(e) => setCor(e.target.value)} />
            </div>
          </div>

          <div className="modal-botoes">
            <button type="submit" className="btn btn-primary">Salvar</button>
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroClienteVeiculo;