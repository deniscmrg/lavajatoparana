import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './servicos.css';

function ServicoForm({ onClose, editData }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState('ativo'); // default string

  useEffect(() => {
    if (editData) {
      setDescricao(editData.descricao || '');
      setValor(editData.valor_unitario || '');
      setStatus(editData.status || 'ativo'); // já vem 'ativo' ou 'inativo'
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      descricao,
      valor_unitario: valor === '' ? null : parseFloat(valor),
      status, // string: 'ativo' ou 'inativo'
    };

    try {
      if (editData) {
        await api.put(`servicos/${editData.id}/`, payload);
      } else {
        await api.post('servicos/', payload);
      }
      onClose();
    } catch (err) {
      if (err.response) {
        console.error('Erro ao salvar serviço:', err.response.data);
        alert(JSON.stringify(err.response.data));
      } else {
        console.error(err);
        alert('Erro ao salvar serviço.');
      }
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
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>

          <div className="form-buttons">
            <button className="btn btn-primary" type="submit">Salvar</button>
            <button className="btn btn-primary" type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ServicoForm;


