// src/pages/caixa/ResumoCaixaModal.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './caixa.css';

const money = (v) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function ResumoCaixaModal({ filtros, onClose }) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [resumo, setResumo] = useState({
    entradas: {},
    saidas: {},
    total_entradas: 0,
    total_saidas: 0,
    saldo: 0,
  });

  useEffect(() => {
  const fetchResumo = async () => {
    setLoading(true);
    setErro(null);
    try {
      const { data } = await api.get('caixa/resumo/', {
        params: filtros, // só passa o que você já tem de filtros
      });
      setResumo(data);
    } catch (e) {
      console.error(e);
      setErro('Falha ao carregar o resumo do caixa.');
    } finally {
      setLoading(false);
    }
  };

  fetchResumo();
}, [filtros]);


  return (
    <div className="form-overlay">
      <div className="form-container">
        <h3>Resumo do Caixa</h3>

        {loading && <div>Carregando…</div>}
        {erro && <div style={{ color: 'crimson' }}>{erro}</div>}

        {!loading && !erro && (
          <>
            <h4>Entradas</h4>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Forma de Pagamento</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(resumo.entradas).map(([forma, total]) => (
                  <tr key={`entrada-${forma}`}>
                    <td>{forma}</td>
                    <td>{money(total)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid #2B9FAE' }}>
                  <td>Total de Entradas</td>
                  <td>{money(resumo.total_entradas)}</td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ marginTop: '2rem' }}>Saídas</h4>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Forma de Pagamento</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(resumo.saidas).map(([forma, total]) => (
                  <tr key={`saida-${forma}`}>
                    <td>{forma}</td>
                    <td>{money(total)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid #2B9FAE' }}>
                  <td>Total de Saídas</td>
                  <td>{money(resumo.total_saidas)}</td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ marginTop: '2rem' }}>Saldo Final</h4>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
              {money(resumo.saldo)}
            </div>
          </>
        )}

        <div className="form-buttons">
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default ResumoCaixaModal;

