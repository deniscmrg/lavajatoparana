// import React, { useEffect, useState } from 'react';
// import api from '../../api/axios';
// import ClienteForm from './clienteForm';
// import { Edit, Trash2 } from 'lucide-react';
// import './clientes.css';
// import Paginacao from '../../components/paginacao';

// function Clientes() {
//   const [clientes, setClientes] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const [editData, setEditData] = useState(null);
//   const [filtro, setFiltro] = useState('');
//   const [sortColumn, setSortColumn] = useState('nome');
//   const [sortDirection, setSortDirection] = useState('asc');

//   // Paginação frontend
//   const [paginaAtual, setPaginaAtual] = useState(1);
//   const clientesPorPagina = 11;

//   const fetchClientes = async () => {
//     try {
//       const res = await api.get('/clientes/');
//       setClientes(Array.isArray(res.data.results) ? res.data.results : res.data);
//       setPaginaAtual(1);
//     } catch (error) {
//       console.error('Erro ao buscar clientes:', error);
//       alert('Erro de sessão. Faça login novamente.');
//     }
//   };

//   useEffect(() => { fetchClientes(); }, []);

//   const handleNew = () => { setEditData(null); setShowForm(true); };
//   const handleEdit = (cliente) => { setEditData(cliente); setShowForm(true); };
//   const handleCloseForm = () => { setShowForm(false); fetchClientes(); };
//   const handleDelete = async (id) => {
//     if (window.confirm('Deseja excluir este cliente?')) {
//       await api.delete(`clientes/${id}/`);
//       fetchClientes();
//     }
//   };

//   const handleSort = (column) => {
//     if (sortColumn === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     else { setSortColumn(column); setSortDirection('asc'); }
//   };

//   const renderSortArrow = (column) => (sortColumn === column ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '');

//   const formatarCelularExibicao = (numero) => {
//     const numeros = numero.replace(/\D/g, '');
//     if (numeros.length <= 10) return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
//     return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
//   };

//   // 🟢 FILTRO + ORDENAÇÃO
//   const clientesFiltrados = [...clientes]
//     .filter(c =>
//       c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
//       c.celular.toLowerCase().includes(filtro.toLowerCase())
//     )
//     .sort((a, b) => {
//       const valA = a[sortColumn]?.toString().toLowerCase() || '';
//       const valB = b[sortColumn]?.toString().toLowerCase() || '';
//       if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
//       if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
//       return 0;
//     });

//   // 🟢 PAGINAÇÃO FRONTEND
//   const indexUltimo = paginaAtual * clientesPorPagina;
//   const indexPrimeiro = indexUltimo - clientesPorPagina;
//   const clientesNaPagina = clientesFiltrados.slice(indexPrimeiro, indexUltimo);
//   const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

//   return (
//     <div className="pagina-clientes">
//       <div className="header-clientes">
//         <h2>Clientes</h2>
//         <button className="btn btn-primary" onClick={handleNew}>Novo Cliente</button>
//       </div>

//       <div className="filtro-clientes">
//         <input
//           type="text"
//           placeholder="Filtrar por nome ou celular"
//           value={filtro}
//           onChange={(e) => setFiltro(e.target.value)}
//         />
//       </div>

//       <div className='tabela-scroll'> 
//         <table className='tabela'>
//           <thead>
//             <tr>
//               <th onClick={() => handleSort('nome')}>Nome{renderSortArrow('nome')}</th>
//               <th onClick={() => handleSort('email')}>Email{renderSortArrow('email')}</th>
//               <th onClick={() => handleSort('celular')}>Celular{renderSortArrow('celular')}</th>
//               <th onClick={() => handleSort('tipo')}>Tipo{renderSortArrow('tipo')}</th>
//               <th>Ações</th>
//             </tr>
//           </thead>
//           <tbody>
//             {clientesNaPagina.map((c) => (
//               <tr key={c.id}>
//                 <td>{c.nome}</td>
//                 <td>{c.email}</td>
//                 <td>{formatarCelularExibicao(c.celular)}</td>
//                 <td>{c.tipo}</td>
//                 <td>
//                   <button className="icon-button editar" onClick={() => handleEdit(c)} title="Editar">
//                     <Edit size={18} />
//                   </button>
//                   <button className="icon-button excluir" onClick={() => handleDelete(c.id)} title="Excluir">
//                     <Trash2 size={18} />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>      

//       <Paginacao
//         paginaAtual={paginaAtual}
//         totalPaginas={totalPaginas}
//         onPageChange={setPaginaAtual}
//       />

//       {showForm && (
//         <ClienteForm onClose={handleCloseForm} editData={editData} />
//       )}
//     </div>
//   );
// }

// export default Clientes;


import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import ClienteForm from './clienteForm';
import { Edit, Trash2 } from 'lucide-react';
import './clientes.css';
import Paginacao from '../../components/paginacao';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  // Filtro + Ordenação
  const [filtro, setFiltro] = useState('');
  const [sortColumn, setSortColumn] = useState('nome');
  const [sortDirection, setSortDirection] = useState('asc');

  // Paginação backend
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const fetchClientes = async (
    page = 1,
    search = filtro,
    ordering = `${sortDirection === 'desc' ? '-' : ''}${sortColumn}`
  ) => {
    try {
      const res = await api.get('/clientes/', {
        params: {
          page,
          search,
          ordering,
        },
      });

      if (res.data.results) {
        setClientes(res.data.results);

        const PAGE_SIZE = 11; // ou o valor configurado no backend
        setTotalPaginas(Math.ceil(res.data.count / PAGE_SIZE));
      } else {
        // fallback caso backend não use paginação DRF
        setClientes(res.data);
        setTotalPaginas(1);
      }
      setPaginaAtual(page);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      alert('Erro de sessão. Faça login novamente.');
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Atualiza lista quando filtro mudar
  useEffect(() => {
    fetchClientes(1, filtro);
  }, [filtro]);

  const handleNew = () => {
    setEditData(null);
    setShowForm(true);
  };

  const handleEdit = (cliente) => {
    setEditData(cliente);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    fetchClientes(paginaAtual);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este cliente?')) {
      await api.delete(`clientes/${id}/`);
      fetchClientes(paginaAtual);
    }
  };

  const handleSort = (column) => {
    let newDirection = 'asc';
    if (sortColumn === column && sortDirection === 'asc') {
      newDirection = 'desc';
    }
    setSortColumn(column);
    setSortDirection(newDirection);
    fetchClientes(1, filtro, `${newDirection === 'desc' ? '-' : ''}${column}`);
  };

  const renderSortArrow = (column) =>
    sortColumn === column ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

  const formatarCelularExibicao = (numero) => {
    const numeros = numero.replace(/\D/g, '');
    if (numeros.length <= 10)
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  return (
    <div className="pagina-clientes">
      <div className="header-clientes">
        <h2>Clientes</h2>
        <button className="btn btn-primary" onClick={handleNew}>
          Novo Cliente
        </button>
      </div>

      <div className="filtro-clientes">
        <input
          type="text"
          placeholder="Filtrar por nome ou celular"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              <th onClick={() => handleSort('nome')}>
                Nome{renderSortArrow('nome')}
              </th>
              <th onClick={() => handleSort('email')}>
                Email{renderSortArrow('email')}
              </th>
              <th onClick={() => handleSort('celular')}>
                Celular{renderSortArrow('celular')}
              </th>
              <th onClick={() => handleSort('tipo')}>
                Tipo{renderSortArrow('tipo')}
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{c.email}</td>
                <td>{formatarCelularExibicao(c.celular)}</td>
                <td>{c.tipo}</td>
                <td>
                  <button
                    className="icon-button editar"
                    onClick={() => handleEdit(c)}
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="icon-button excluir"
                    onClick={() => handleDelete(c.id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
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
        onPageChange={(page) => fetchClientes(page, filtro)}
      />

      {showForm && <ClienteForm onClose={handleCloseForm} editData={editData} />}
    </div>
  );
}

export default Clientes;
