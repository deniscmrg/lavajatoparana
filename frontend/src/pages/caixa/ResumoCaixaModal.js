// src/pages/caixa/ResumoCaixaModal.js
import React from 'react';
import './caixa.css';

function ResumoCaixaModal({ lancamentos, onClose }) {
  const entradas = lancamentos.filter(l => l.tipo === 'entrada');

  const resumo = entradas.reduce((acc, lanc) => {
    const forma = lanc.forma_pagamento || 'Não informado';
    const valor = parseFloat(lanc.valor) || 0;
    acc[forma] = (acc[forma] || 0) + valor;
    return acc;
  }, {});

  const totalGeral = Object.values(resumo).reduce((soma, valor) => soma + valor, 0);

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h3>Resumo de Entradas</h3>
        <table className="tabela">
          <thead>
            <tr>
              <th>Forma de Pagamento</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(resumo).map(([forma, total]) => (
              <tr key={forma}>
                <td>{forma}</td>
                <td>R$ {total.toFixed(2)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #2B9FAE' }}>
              <td>Total Geral</td>
              <td>R$ {totalGeral.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div className="form-buttons">
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default ResumoCaixaModal;
