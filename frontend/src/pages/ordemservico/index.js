// import React, { useEffect, useState } from 'react';
// import './ordemServico.css';
// import api from '../../api/axios';
// import OrdemServicoForm from './ordemservicoForm';
// import CadastroClienteVeiculo from '../cadastroclienteveiculo';
// import ModalPlaca from '../buscaplaca';

// function OrdensServico() {
//   const [ordens, setOrdens] = useState([]);
//   const [filtro, setFiltro] = useState('');
//   const [formAberto, setFormAberto] = useState(false);
//   const [cadastroAberto, setCadastroAberto] = useState(false);
//   const [ordemParaEditar, setOrdemParaEditar] = useState(null);

//   const [modalPlacaAberto, setModalPlacaAberto] = useState(false);
//   const [placaBusca, setPlacaBusca] = useState('');

//   // Carrega lista de ordens
//   const carregarOrdens = async () => {
//     try {
//       const res = await api.get('/ordens-servico/');
//       setOrdens(res.data.sort((a, b) => new Date(b.data) - new Date(a.data)));
//     } catch {
//       alert('Erro ao carregar ordens de serviço.');
//     }
//   };

//   useEffect(() => { carregarOrdens(); }, []);

//   // Recebe placa do modal e busca o veículo
//   const handleConfirmPlaca = (placa) => {
//     setPlacaBusca(placa);
//     setModalPlacaAberto(false);
//     buscarPlaca(placa);
//   };

//   // Busca veículo pelo endpoint de placa e decide próximo modal
//   const buscarPlaca = async (placa) => {
//     try {
//       const res = await api.get(`/veiculos/${placa}/`);
//       const veiculo = res.data;

//       // busca cliente do veículo
//       const clienteRes = await api.get(`/clientes/${veiculo.cliente}/`);

//       const ordemPreenchida = {
//         placa: veiculo.placa,
//         marca: veiculo.marca,
//         modelo: veiculo.modelo,
//         cliente_nome: clienteRes.data.nome,
//         cliente_celular: clienteRes.data.celular,
//         cliente_email: clienteRes.data.email,
//         cliente_tipo: clienteRes.data.tipo,
//         veiculo_id: veiculo.id,
//         cliente_id: clienteRes.data.id,
//       };

//       setOrdemParaEditar({ ...ordemPreenchida });
//       setFormAberto(true);
//     } catch (err) {
//       if (err.response?.status === 404) {
//         setCadastroAberto(true);
//       } else {
//         alert('Erro ao buscar veículo.');
//       }
//     }
//   };

//   // Abrir OS existente
//   const abrirForm = (os = null) => {
//     setOrdemParaEditar(os);
//     setFormAberto(true);
//   };

//   // Excluir OS
//   const excluirOrdem = async (id) => {
//     if (!window.confirm('Deseja realmente excluir esta ordem de serviço?')) return;
//     try {
//       await api.delete(`/ordens-servico/${id}/`);
//       carregarOrdens();
//     } catch {
//       alert('Erro ao excluir a OS.');
//     }
//   };

//   // Filtrar ordens
//   // const ordensFiltradas = ordens.filter(os =>
//   //   os.cliente_nome.toLowerCase().includes(filtro.toLowerCase()) ||
//   //   os.placa.toLowerCase().includes(filtro.toLowerCase())
//   // );

//   const ordensFiltradas = ordens.filter(os =>
//     (os.cliente_nome?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
//     (os.placa?.toLowerCase() || '').includes(filtro.toLowerCase())
//   );

//   return (
//     <div className="pagina-listagem">
//       <div className="cabecalho">
//         <h2>Ordens de Serviço</h2>
//         <button className="btn btn-primary" onClick={() => setModalPlacaAberto(true)}>
//           + Nova OS
//         </button>
//       </div>

//       <input
//         className="input-filtro"
//         placeholder="Filtrar por cliente ou placa..."
//         value={filtro}
//         onChange={e => setFiltro(e.target.value)}
//       />

//       <table className="tabela">
//         <thead>
//           <tr>
//             <th>ID</th><th>Data</th><th>Cliente</th><th>Placa</th><th>Status</th><th>Pagamento</th><th>Ações</th>
//           </tr>
//         </thead>
//         <tbody>
//           {ordensFiltradas.map(os => (
//             <tr key={os.id}>
//               <td>{os.id}</td>
//               <td>{new Date(os.data).toLocaleString()}</td>
//               <td>{os.cliente_nome}</td>
//               <td>{os.placa}</td>
//               <td>{os.status}</td>
//               <td>{os.forma_pagamento}</td>
//               <td>
//                 <button className="icon-button" onClick={() => abrirForm(os)}>✏️</button>
//                 <button className="icon-button excluir" onClick={() => excluirOrdem(os.id)}>🗑️</button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {/* Modal para informar placa */}
//       <ModalPlaca
//         isOpen={modalPlacaAberto}
//         onClose={() => setModalPlacaAberto(false)}
//         onConfirm={handleConfirmPlaca}
//       />

//       {/* Modal: formulário de OS */}
//       {formAberto && (
//         // <OrdemServicoForm
//         //   onClose={() => { setFormAberto(false); carregarOrdens(); }}
//         //   editData={ordemParaEditar}
//         // />

//       <OrdemServicoForm
//         editData={ordemParaEditar}
//         onClose={() => {
//           setFormAberto(false);
//           setOrdemParaEditar(null);
//           carregarOrdens(); // <- essa é a função que você quer passar
//         }}
//         atualizarOrdens={carregarOrdens}
//       />


//       )}

//       {/* Modal: cadastro cliente + veículo */}
//       {cadastroAberto && (
//         <CadastroClienteVeiculo
//           placa={placaBusca}
//           onClose={() => setCadastroAberto(false)}
//           onConfirm={veiculo => { setOrdemParaEditar({ veiculo }); setCadastroAberto(false); setFormAberto(true); }}
//         />
//       )}
//     </div>
//   );
// }

// export default OrdensServico;
import React, { useEffect, useState } from 'react';
import './ordemServico.css';
import api from '../../api/axios';
import OrdemServicoForm from './ordemservicoForm';
import CadastroClienteVeiculo from '../cadastroclienteveiculo';
import ModalPlaca from '../buscaplaca';

function OrdensServico() {
  const [ordens, setOrdens] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [ordemParaEditar, setOrdemParaEditar] = useState(null);

  const [modalPlacaAberto, setModalPlacaAberto] = useState(false);
  const [placaBusca, setPlacaBusca] = useState('');

  const carregarOrdens = async () => {
    try {
      const res = await api.get('/ordens-servico/');
      setOrdens(res.data.sort((a, b) => new Date(b.data) - new Date(a.data)));
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

  const excluirOrdem = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta ordem de serviço?')) return;
    try {
      await api.delete(`/ordens-servico/${id}/`);
      carregarOrdens();
    } catch {
      alert('Erro ao excluir a OS.');
    }
  };

  const ordensFiltradas = ordens.filter(os =>
    (os.cliente?.nome?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
    (os.veiculo?.placa?.toLowerCase() || '').includes(filtro.toLowerCase())
  );

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
            <th>ID</th><th>Data</th><th>Cliente</th><th>Placa</th><th>Status</th><th>Pagamento</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {ordensFiltradas.map(os => (
            <tr key={os.id}>
              <td>{os.id}</td>
              <td>{new Date(os.data).toLocaleDateString()}</td>
              <td>{os.cliente?.nome || ''}</td>
              <td>{os.veiculo?.placa || ''}</td>
              <td>{os.status}</td>
              <td>{os.forma_pagamento}</td>
              <td>
                <button className="icon-button" onClick={() => abrirForm(os)}>✏️</button>
                <button className="icon-button excluir" onClick={() => excluirOrdem(os.id)}>🗑️</button>
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