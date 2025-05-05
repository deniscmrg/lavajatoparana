import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';
import './faturas.css';
import FecharFaturasModal from './FecharFaturasModal';
//import FecharFaturasModal from 'FecharFaturasModal';

const Faturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [ordem, setOrdem] = useState('data_vencimento');
  const [asc, setAsc] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    carregarFaturas();
  }, [ordem, asc]);

  const carregarFaturas = async () => {
    try {
      const res = await api.get('/faturas/');
      const ordenadas = [...res.data].sort((a, b) => {
        const aVal = a[ordem] || '';
        const bVal = b[ordem] || '';
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
      setFaturas(ordenadas);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
    }
  };

  const alternarOrdem = (campo) => {
    if (campo === ordem) {
      setAsc(!asc);
    } else {
      setOrdem(campo);
      setAsc(true);
    }
  };

  const renderSeta = (campo) => {
    if (ordem !== campo) return null;
    return asc ? ' ▲' : ' ▼';
  };

  const fecharFaturas = async ({ competencia, cliente_id }) => {
    try {
      await api.post('faturas/gerar/', {
        competencia,
        cliente_id,
      });
      carregarFaturas();
    } catch (err) {
      console.error('Erro ao fechar faturas:', err);
      alert('Erro ao fechar faturas');
    }
  };

  return (
    <div className="pagina">
      <div className="topo-listagem">
        <h2>Faturas</h2>
        <button className="btn btn-primary" onClick={() => setModalAberto(true)}>Fechar Faturas</button>
      </div>

      <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              <th onClick={() => alternarOrdem('id')}># {renderSeta('id')}</th>
              <th onClick={() => alternarOrdem('cliente_nome')}>Cliente {renderSeta('cliente_nome')}</th>
              <th onClick={() => alternarOrdem('data_vencimento')}>Vencimento {renderSeta('data_vencimento')}</th>
              <th onClick={() => alternarOrdem('data_pagamento')}>Pagamento {renderSeta('data_pagamento')}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {faturas.map(f => (
              <tr key={f.id}>
                <td>{f.id}</td>
                <td>{f.cliente_nome}</td>
                <td>{format(new Date(f.data_vencimento), 'dd/MM/yyyy')}</td>
                <td>{f.data_pagamento ? format(new Date(f.data_pagamento), 'dd/MM/yyyy') : '-'}</td>
                <td>{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <FecharFaturasModal
          onClose={() => setModalAberto(false)}
          onConfirm={fecharFaturas}
        />
      )}
    </div>
  );
};

export default Faturas;
