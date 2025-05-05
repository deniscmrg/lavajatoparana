import React, { useState } from 'react';
import './fechaOrdemServico.css';

const FechaOrdemServico = ({ ordem, onClose, onConfirm }) => {
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formaPagamento);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo fechar-os">
        <h2>Fechar Ordem de Serviço</h2>
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
              <option value="faturar">Faturar</option>
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
