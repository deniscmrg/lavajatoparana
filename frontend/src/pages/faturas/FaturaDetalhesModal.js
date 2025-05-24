import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './faturas.css';
import { format } from 'date-fns';

function FaturaDetalhesModal({ faturaId, onClose }) {
  const [fatura, setFatura] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState('');

  useEffect(() => {
    const fetchFatura = async () => {
      try {
        const res = await api.get(`/faturas/${faturaId}/`);
        setFatura(res.data);
        // setFormaPagamento(res.data.forma_pagamento || ''); 
        const forma = res.data.forma_pagamento?.toLowerCase?.() || '';
        console.log('🧪 Forma recebida e convertida:', forma);
        setFormaPagamento(forma);

      } catch (err) {
        console.error('Erro ao buscar fatura:', err);
        alert('Erro ao carregar detalhes da fatura.');
      }
    };
    fetchFatura();
  }, [faturaId]);

  const receberFatura = async () => {
    if (!formaPagamento) {
      alert('Selecione uma forma de pagamento antes de receber.');
      return;
    }

    if (!window.confirm('Confirmar recebimento da fatura?')) return;

    try {
      await api.post(`/faturas/${faturaId}/receber/`, {
        forma_pagamento: formaPagamento,
      });
      onClose(); // fecha modal
    } catch (err) {
      console.error('Erro ao receber fatura:', err);
      const msg = err.response?.data?.erro || 'Erro ao registrar recebimento.';
      alert(msg);
    }
    
  };

  if (!fatura) return null;

  const vencimento = format(new Date(fatura.data_vencimento), 'dd/MM/yyyy');
  const pagamento = fatura.data_pagamento ? format(new Date(fatura.data_pagamento), 'dd/MM/yyyy') : '-';

  const totalGeral = fatura.ordens?.reduce((soma, os) => soma + Number(os.valor_total), 0) || 0;

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h3 className="titulo-fatura">Fatura #{fatura.id}</h3>

        <label>Cliente:</label>
        <input type="text" value={fatura.cliente_nome} readOnly />

        <div className="linha-campos">
          <div className="campo">
            <label>Competência:</label>
            <input type="text" value={fatura.competencia} readOnly />
          </div>
          <div className="campo">
            <label>Vencimento:</label>
            <input type="text" value={vencimento} readOnly />
          </div>
          <div className="campo">
            <label>Pagamento:</label>
            <input type="text" value={pagamento || '-'} readOnly />
          </div>
         
        </div>
        <div className='linha-campos'>
          <div>
            {fatura.status !== 'pago' && (
              <>
                <label>Forma de Pagamento:</label>
                {/* <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} required> */}
                <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} required>
                  <option value="">Selecione</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">Pix</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito">Cartão de Crédito</option>
                </select>
              </>
            )}
          </div>
          <div className="campo">
              <label>Status:</label>
              <input type="text" value={fatura.status} readOnly />
          </div>
        </div>


        <h4>Ordens de Serviço</h4>
        <table className="tabela-detalhes">
          <thead>
            <tr>
              <th>#</th>
              <th>Data</th>
              <th>Veículo</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {fatura.ordens && fatura.ordens.length > 0 ? (
              fatura.ordens.map(ordem => (
                <tr key={ordem.id}>
                  <td>{ordem.id}</td>
                  <td>{format(new Date(ordem.data), 'dd/MM/yyyy')}</td>
                  <td>{ordem.veiculo}</td>
                  <td>R$ {Number(ordem.valor_total).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Nenhuma ordem vinculada.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="total-geral">
          <strong>Total da Fatura:</strong> R$ {totalGeral.toFixed(2)}
        </div>



        <div className="form-buttons">
          {fatura.status !== 'pago' && (
            <button className="btn btn-primary" onClick={receberFatura}>Receber</button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default FaturaDetalhesModal;
