import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './cadastroclienteveiculo.css';
import InputMask from 'react-input-mask';

const CadastroClienteVeiculo = ({ placa, onClose, onConfirm }) => {
  const [tipo, setTipo] = useState('particular');
  const [nome, setNome] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [lojistas, setLojistas] = useState([]);
  const [lojistaId, setLojistaId] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [clienteExistente, setClienteExistente] = useState(null);
  const [camposBloqueados, setCamposBloqueados] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
        setMarcas(await res.json());
      } catch (err) {
        console.error('Erro ao carregar marcas FIPE:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!marca) return setModelos([]);
    (async () => {
      try {
        const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marca}/modelos`);
        const data = await res.json();
        setModelos(data.modelos);
      } catch (err) {
        console.error('Erro ao carregar modelos FIPE:', err);
      }
    })();
  }, [marca]);

  useEffect(() => {
    if (tipo === 'lojista') {
      (async () => {
        try {
          const res = await api.get('/clientes/');
          setLojistas(res.data.filter(c => c.tipo === 'lojista'));  

          // const res = await api.get('/clientes/?tipo=lojista');
          // setLojistas(res.data);
        } catch (err) {
          setLojistas([]);
          alert('Erro ao buscar lojistas.');
        }
      })();
    } else {
      setLojistaId('');
    }
  }, [tipo]);

  
  const verificarCliente = async () => {
    try {
      const celularLimpo = celular.replace(/\D/g, '');
      const { data } = await api.get(`/clientes/?celular=${celularLimpo}`);
      const cliente = data.find((c) => c.celular === celularLimpo);

      if (cliente) {
        if (cliente.tipo === 'lojista') {
          alert('Este celular pertence a um cliente lojista. O tipo será alterado para "Lojista".');
          setTipo('lojista');
          setCelular('');
          setNome('');
          setEmail('');
          setClienteExistente(null);
          setCamposBloqueados(true);
        } else {
          setClienteExistente(cliente);
          setNome(cliente.nome);
          setEmail(cliente.email);
          setCamposBloqueados(true);
          alert('Cliente já cadastrado. Dados preenchidos automaticamente.');
        }
      } else {
        setClienteExistente(null);
        setNome('');
        setEmail('');
        setCamposBloqueados(false);
        alert('Cliente não encontrado. Preencha os dados para cadastrar.');
      }
    } catch (err) {
      console.error('Erro ao verificar cliente:', err);
      alert('Erro ao verificar cliente.');
    }
  };


  const formatarCelular = (valor) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const validarEmail = (valor) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(valor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tipo === 'lojista' && !lojistaId) {
      alert('Selecione um lojista.');
      return;
    }
    if (tipo === 'particular' && email && !validarEmail(email)) {
      alert('Formato de e-mail inválido.');
      return;
    }
    try {
      let clienteId = null;
      if (tipo === 'lojista') {
        clienteId = lojistaId;
      } else {

        const celularLimpo = celular.replace(/\D/g, '');

        clienteId = clienteExistente
          ? clienteExistente.id
          : (await api.post('/clientes/', { nome, email, celular: celularLimpo, tipo })).data.id;

      }
      const veiculoRes = await api.post('/veiculos/', {
        placa,
        marca: marcas.find((m) => m.codigo === marca)?.nome || '',
        modelo,
        cor,
        cliente: clienteId,
      });

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
        <h3>Veículo não encontrado – cadastre abaixo</h3>
        <form onSubmit={handleSubmit}>
          <div className="linha-tipo">
            <label>Tipo</label>
            <select
              className='tipo'
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setNome('');
                setCelular('');
                setEmail('');
                setClienteExistente(null);
              }}
              required
            >
              <option value="particular">Particular</option>
              <option value="lojista">Lojista</option>
            </select>
          </div>

          {tipo === 'particular' && (
            <div className="linha-cliente">
              <div>
                <label>Celular</label>
                <input
                  type="text"
                  value={celular}
                  onChange={(e) => setCelular(formatarCelular(e.target.value))}
                  required
                />
              </div>
              <div className="btn-wrap">
                <label>&nbsp;</label>
                <button type="button" className="btn-verificar" onClick={verificarCliente}>Verificar</button>
              </div>
              <div>
                <label>Nome do Proprietário</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  disabled={camposBloqueados}
                  // disabled={!!clienteExistente}
                />
              </div>
              <div className="email">
                <label>Email</label>
                <input className="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={camposBloqueados}
                  // disabled={!!clienteExistente}
                />
              </div>
            </div>
          )}

          {tipo === 'lojista' && (
            <div className="linha-cliente">
              <div style={{ width: '100%' }}>
                <label>Lojista</label>
                <select
                className='lojista'
                  value={lojistaId}
                  onChange={(e) => setLojistaId(e.target.value)}
                  required
                >
                  <option value="">Selecione o lojista</option>
                  {lojistas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} ({l.celular})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="linha-veiculo">
            <div>
              <label>Marca</label>
              <select className='marca' value={marca} onChange={(e) => setMarca(e.target.value)} required>
                <option value="">Selecione</option>
                {marcas.map((m) => (
                  <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Modelo</label>
              <select className='modelo' value={modelo} onChange={(e) => setModelo(e.target.value)} required>
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
            <div>
              <label>Placa</label>
              <input className='placa' type="text" value={placa} disabled />
            </div>
          </div>

          <div className="modal-botoes">
            <button type="submit" className="btn btn-primary">Salvar</button>
            <button type="button" className="btn btn-primary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroClienteVeiculo;

