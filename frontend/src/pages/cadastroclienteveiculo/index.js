// // src/pages/cliente-veiculo/CadastroClienteVeiculo.jsx
// import React, { useState, useEffect } from 'react';
// import api from '../../api/axios';
// import './cadastroclienteveiculo.css';

// const CadastroClienteVeiculo = ({ placa, onClose, onConfirm }) => {
//   const [nome, setNome] = useState('');
//   const [celular, setCelular] = useState('');
//   const [email, setEmail] = useState('');
//   const [tipo, setTipo] = useState('particular');
//   const [marca, setMarca] = useState('');
//   const [modelo, setModelo] = useState('');
//   const [cor, setCor] = useState('');
//   const [marcas, setMarcas] = useState([]);
//   const [modelos, setModelos] = useState([]);
//   const [clienteExistente, setClienteExistente] = useState(null);

//   /* --- efeitos FIPE --- */
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
//         setMarcas(await res.json());
//       } catch (err) {
//         console.error('Erro ao carregar marcas FIPE:', err);
//       }
//     })();
//   }, []);

//   useEffect(() => {
//     if (!marca) return setModelos([]);
//     (async () => {
//       try {
//         const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marca}/modelos`);
//         const data = await res.json();
//         setModelos(data.modelos);
//       } catch (err) {
//         console.error('Erro ao carregar modelos FIPE:', err);
//       }
//     })();
//   }, [marca]);

//   /* --- busca de cliente --- */
//   const verificarCliente = async () => {
//     try {
//       const { data } = await api.get(`/clientes/?celular=${celular}`);
//       const cliente = data.find((c) => c.celular === celular);
//       if (cliente) {
//         setClienteExistente(cliente);
//         setNome(cliente.nome);
//         setEmail(cliente.email);
//         setTipo(cliente.tipo);
//         alert('Cliente já cadastrado. Dados preenchidos automaticamente.');
//       } else {
//         setClienteExistente(null);
//         alert('Cliente não encontrado. Preencha os dados para cadastrar.');
//       }
//     } catch (err) {
//       console.error('Erro ao verificar cliente:', err);
//       alert('Erro ao verificar cliente.');
//     }
//   };

//   /* --- submit --- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const clienteId = clienteExistente
//         ? clienteExistente.id
//         : (await api.post('/clientes/', { nome, email, celular, tipo })).data.id;

//       const veiculoRes = await api.post('/veiculos/', {
//         placa,
//         marca: marcas.find((m) => m.codigo === marca)?.nome || '',
//         modelo,
//         cor,
//         cliente: clienteId,
//       });

//       onConfirm({ placa: veiculoRes.data.placa, cliente_id: clienteId });
//       onClose();
//     } catch (err) {
//       console.error('Erro ao cadastrar cliente/veículo:', err);
//       alert('Erro ao cadastrar cliente ou veículo.');
//     }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-conteudo cadastro-cv">
//         <h3>Veículo não encontrado – cadastre abaixo</h3>

//         <form onSubmit={handleSubmit}>
//           {/* --- linha 1: celular + verificar + nome + email --- */}
//           <div className="grid-2">
//             <div className="grid-cliente">
//               <label>Celular</label>
//               <input
//                 type="text"
//                 value={celular}
//                 onChange={(e) => setCelular(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="btn-container">
//               <label>&nbsp;</label>
//               <button
//                 type="button"
//                 className="btn btn-verificar"
//                 onClick={verificarCliente}
//               >
//                 Verificar
//               </button>
//             </div>

//             <div >
//               <label>Nome do Proprietário</label>
//               <input
//                 type="text"
//                 value={nome}
//                 onChange={(e) => setNome(e.target.value)}
//                 required
//                 disabled={!!clienteExistente}
//               />
//             </div>

//             <div className="email-field">
//               <label>Email</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 disabled={!!clienteExistente}
//               />
//             </div>
//           </div>

//           {/* --- linha 2: marca + modelo + cor --- */}
//           <div className="grid-veiculo">
//             <div>
//               <label>Marca</label>
//               <select value={marca} onChange={(e) => setMarca(e.target.value)} required>
//                 <option value="">Selecione</option>
//                 {marcas.map((m) => (
//                   <option key={m.codigo} value={m.codigo}>
//                     {m.nome}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label>Modelo</label>
//               <select value={modelo} onChange={(e) => setModelo(e.target.value)} required>
//                 <option value="">Selecione</option>
//                 {modelos.map((m) => (
//                   <option key={m.codigo} value={m.nome}>
//                     {m.nome}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label>Cor</label>
//               <input type="text" value={cor} onChange={(e) => setCor(e.target.value)} />
//             </div>
//           </div>

//           {/* --- linha 3: tipo + placa --- */}
//           <div className="grid-2">
//             <div>
//               <label>Tipo</label>
//               <select
//                 value={tipo}
//                 onChange={(e) => setTipo(e.target.value)}
//                 required
//                 disabled={!!clienteExistente}
//               >
//                 <option value="particular">Particular</option>
//                 <option value="lojista">Lojista</option>
//               </select>
//             </div>

//             <div>
//               <label>Placa</label>
//               <input type="text" value={placa} disabled />
//             </div>
//           </div>

//           {/* --- botões --- */}
//           <div className="modal-botoes">
//             <button type="submit" className="btn btn-primary">
//               Salvar
//             </button>
//             <button type="button" className="btn" onClick={onClose}>
//               Cancelar
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CadastroClienteVeiculo;


// src/pages/cliente-veiculo/CadastroClienteVeiculo.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './cadastroclienteveiculo.css';

const CadastroClienteVeiculo = ({ placa, onClose, onConfirm }) => {
  /* ------------------------------------------------------------------ */
  const [nome, setNome]         = useState('');
  const [celular, setCelular]   = useState('');
  const [email, setEmail]       = useState('');
  const [tipo, setTipo]         = useState('particular');
  const [marca, setMarca]       = useState('');
  const [modelo, setModelo]     = useState('');
  const [cor, setCor]           = useState('');
  const [marcas, setMarcas]     = useState([]);
  const [modelos, setModelos]   = useState([]);
  const [clienteExistente, setClienteExistente] = useState(null);

  /* --- efeitos FIPE -------------------------------------------------- */
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

  /* --- busca de cliente --------------------------------------------- */
  const verificarCliente = async () => {
    try {
      const { data } = await api.get(`/clientes/?celular=${celular}`);
      const cliente = data.find((c) => c.celular === celular);
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

  /* --- submit -------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const clienteId = clienteExistente
        ? clienteExistente.id
        : (await api.post('/clientes/', { nome, email, celular, tipo })).data.id;

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

  /* ------------------------------------------------------------------ */
  return (
    <div className="modal-overlay">
      <div className="modal-conteudo cadastro-cv">
        <h3>Veículo não encontrado – cadastre abaixo</h3>

        <form onSubmit={handleSubmit}>

          {/* ---- LINHA 1: Celular | Verificar | Nome | Email ------------- */}
          <div className="linha-cliente">

            <div>
              <label>Celular</label>
              <input
                type="text"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                required
              />
            </div>

            <div className="btn-wrap">
              <label>&nbsp;</label> {/* space‑holder pro alinhamento */}
              <button
                type="button"
                className="btn-verificar"
                onClick={verificarCliente}
              >
                Verificar
              </button>
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

            <div className="email">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!clienteExistente}
              />
            </div>
          </div>

          {/* ---- LINHA 2: Marca | Modelo | Cor -------------------------- */}
          <div className="linha-veiculo">

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
          </div>

          {/* ---- LINHA 3: Tipo | Placa ---------------------------------- */}
          <div className="linha-2cols">

            <div>
              <label>Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
                disabled={!!clienteExistente}
              >
                <option value="particular">Particular</option>
                <option value="lojista">Lojista</option>
              </select>
            </div>

            <div>
              <label>Placa</label>
              <input type="text" value={placa} disabled />
            </div>
          </div>

          {/* ---- BOTÕES ------------------------------------------------- */}
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
