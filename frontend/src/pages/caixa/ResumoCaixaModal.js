// // src/pages/caixa/ResumoCaixaModal.js
// import React from 'react';
// import './caixa.css';

// function ResumoCaixaModal({ lancamentos, onClose }) {
//   const entradas = lancamentos.filter(l => l.tipo === 'entrada');

//   const resumo = entradas.reduce((acc, lanc) => {
//     const forma = lanc.forma_pagamento || 'Não informado';
//     const valor = parseFloat(lanc.valor) || 0;
//     acc[forma] = (acc[forma] || 0) + valor;
//     return acc;
//   }, {});

//   const totalGeral = Object.values(resumo).reduce((soma, valor) => soma + valor, 0);

//   return (
//     <div className="form-overlay">
//       <div className="form-container">
//         <h3>Resumo de Entradas</h3>
//         <table className="tabela">
//           <thead>
//             <tr>
//               <th>Forma de Pagamento</th>
//               <th>Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             {Object.entries(resumo).map(([forma, total]) => (
//               <tr key={forma}>
//                 <td>{forma}</td>
//                 <td>R$ {total.toFixed(2)}</td>
//               </tr>
//             ))}
//             <tr style={{ fontWeight: 'bold', borderTop: '2px solid #2B9FAE' }}>
//               <td>Total Geral</td>
//               <td>R$ {totalGeral.toFixed(2)}</td>
//             </tr>
//           </tbody>
//         </table>
//         <div className="form-buttons">
//           <button className="btn btn-primary" onClick={onClose}>Fechar</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ResumoCaixaModal;

// src/pages/caixa/ResumoCaixaModal.js
import React from 'react';
import './caixa.css';

function ResumoCaixaModal({ lancamentos, onClose }) {
  const entradas = lancamentos.filter(l => l.tipo === 'entrada');
  const saidas = lancamentos.filter(l => l.tipo === 'saida');

  const calcularResumo = (lista) =>
    lista.reduce((acc, lanc) => {
      const forma = lanc.forma_pagamento || 'Não informado';
      const valor = parseFloat(lanc.valor) || 0;
      acc[forma] = (acc[forma] || 0) + valor;
      return acc;
    }, {});

  const resumoEntradas = calcularResumo(entradas);
  const resumoSaidas = calcularResumo(saidas);

  const totalEntradas = Object.values(resumoEntradas).reduce((soma, val) => soma + val, 0);
  const totalSaidas = Object.values(resumoSaidas).reduce((soma, val) => soma + val, 0);
  const saldoFinal = totalEntradas - totalSaidas;

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h3>Resumo do Caixa</h3>

        <h4>Entradas</h4>
        <table className="tabela">
          <thead>
            <tr>
              <th>Forma de Pagamento</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(resumoEntradas).map(([forma, total]) => (
              <tr key={`entrada-${forma}`}>
                <td>{forma}</td>
                <td>R$ {total.toFixed(2)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #2B9FAE' }}>
              <td>Total de Entradas</td>
              <td>R$ {totalEntradas.toFixed(2)}</td>
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
            {Object.entries(resumoSaidas).map(([forma, total]) => (
              <tr key={`saida-${forma}`}>
                <td>{forma}</td>
                <td>R$ {total.toFixed(2)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #2B9FAE' }}>
              <td>Total de Saídas</td>
              <td>R$ {totalSaidas.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <h4 style={{ marginTop: '2rem' }}>Saldo Final</h4>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          R$ {saldoFinal.toFixed(2)}
        </div>

        <div className="form-buttons">
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default ResumoCaixaModal;
