import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './servicos.css';

function ServicoForm({ onClose, editData }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (editData) {
      setDescricao(editData.descricao || '');
      setValor(editData.valor_unitario || '');
      setStatus(editData.status ?? true);
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      descricao,
      valor_unitario: parseFloat(valor),
      status: status ? 'ativo' : 'inativo'  // <-- conversão correta
    };

    try {
      if (editData) {
        await api.put(`servicos/${editData.id}/`, payload);
      } else {
        await api.post('servicos/', payload);
      }
      onClose();
    } catch (err) {
      alert('Erro ao salvar serviço.');
      console.error(err);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h3>{editData ? 'Editar Serviço' : 'Novo Serviço'}</h3>
        <form onSubmit={handleSubmit}>
          <label>Descrição:</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />

          <label>Valor Unitário:</label>
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            step="0.01"
          />

          <label>Status:</label>
          <select value={status ? 'ativo' : 'inativo'} onChange={(e) => setStatus(e.target.value === 'ativo')}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>

          <div className="form-buttons">
            <button className="btn btn-primary" type="submit">Salvar</button>
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ServicoForm;
