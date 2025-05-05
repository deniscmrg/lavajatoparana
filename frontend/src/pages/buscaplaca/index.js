import React, { useState } from 'react';
import './buscaplaca.css';

const ModalPlaca = ({ isOpen, onClose, onConfirm }) => {
  const [placa, setPlaca] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("a bosta da plcaca do modal placa:", placa)
    onConfirm(placa.trim().toUpperCase());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-placa">
        <h2>Nova Ordem de Serviço</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="placa">Digite a placa do veículo:</label>
          <input
            type="text"
            id="placa"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            maxLength={7}
            required
          />
          <div className="buttons">
            <button  type="submit">OK</button>
            <button  type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalPlaca;
