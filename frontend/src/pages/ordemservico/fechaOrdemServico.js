// import React, { useState } from 'react';
// import './fechaOrdemServico.css';

// const FechaOrdemServico = ({ ordem, onClose, onConfirm }) => {
//   const [formaPagamento, setFormaPagamento] = useState('dinheiro');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onConfirm(formaPagamento);
//     onClose();
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-conteudo fechar-os">
//         <h2>Fechar Ordem de Serviço</h2>

//         <div className="resumo-total-os">
//           <strong>Total da OS: </strong>
//           R$ {ordem?.total?.toFixed(2).replace('.', ',')}
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Forma de Pagamento</label>
//             <select
//               value={formaPagamento}
//               onChange={(e) => setFormaPagamento(e.target.value)}
//               required
//             >
//               <option value="dinheiro">Dinheiro</option>
//               <option value="pix">Pix</option>
//               <option value="debito">Cartão de Débito</option>
//               <option value="credito">Cartão de Crédito</option>
//               {ordem?.cliente?.tipo === 'lojista' && (
//                 <option value="faturar">Faturar</option>
//               )}
//             </select>
//           </div>

//           <div className="modal-botoes">
//             <button type="submit" className="btn btn-primary">Confirmar</button>
//             <button type="button" className="btn btn-primary" onClick={onClose}>Cancelar</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default FechaOrdemServico;

import React, { useState } from 'react';
import './fechaOrdemServico.css';

const FechaOrdemServico = ({ ordem, onClose, onConfirm }) => {
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formaPagamento);
    onClose();
  };

  // const calcularTotal = () => {
  //   if (!ordem?.servicos) return 0;
  //   return ordem.servicos.reduce((soma, servico) => {
  //     const valor = parseFloat(servico.valor) || 0;
  //     const quantidade = parseFloat(servico.quantidade) || 1;
  //     return soma + valor * quantidade;
  //   }, 0);
  // };

  const calcularTotal = () => {
    if (!ordem?.servicos) return 0;
    return ordem.servicos.reduce((soma, s) => {
      const valor = parseFloat(s.valor_unitario || s.valor || 0);
      const qtd = parseFloat(s.quantidade || 1);
      return soma + valor * qtd;
    }, 0);
  };

  const total = ordem.total || calcularTotal();

  // const total = calcularTotal();

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo fechar-os">
        <h2>Fechar Ordem de Serviço</h2>

        <div className="resumo-total-os">
          <strong>Total da OS: </strong>
          R$ {calcularTotal().toFixed(2).replace('.', ',')}
          {/* R$ {(ordem?.servicos?.reduce((soma, s) => {
            const qtd = parseFloat(s.quantidade || 1);
            const valor = parseFloat(s.valor_unitario || s.valor || 0);
            return soma + qtd * valor;
          }, 0) || 0).toFixed(2).replace('.', ',')} */}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Forma de Pagamento</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              required
            >
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="debito">Cartão de Débito</option>
              <option value="credito">Cartão de Crédito</option>
              {ordem?.cliente?.tipo === 'lojista' && (
                <option value="faturar">Faturar</option>
              )}
            </select>
          </div>

          <div className="modal-botoes">
            <button type="submit" className="btn btn-primary">Confirmar</button>
            <button type="button" className="btn btn-primary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FechaOrdemServico;
