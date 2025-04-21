// src/pages/caixa/CaixaForm.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './caixa.css';

function CaixaForm({ onClose, editData }) {
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState('');
  const [origem, setOrigem] = useState('Lançamento Manual');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('2025-04-20');

  useEffect(() => {
    if (editData) {
      setDescricao(editData.descricao || '');
      setCategoria(editData.categoria || '');
      setOrigem(editData.origem || '');
      setTipo(editData.tipo || '');
      setValor(editData.valor || '');
      setData(editData.data || '');
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { descricao, categoria, tipo, valor, data, origem };
    try {
      if (editData) {
        await api.put(`caixa/${editData.id}/`, payload);
      } else {
        await api.post('caixa/', payload);
      }
      onClose();
    } catch (err) {
      alert('Erro ao salvar lançamento.');
      console.error(err);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h3>{editData ? 'EDITAR LANÇAMENTO' : 'NOVO LANÇAMENTO'}</h3>
        <form onSubmit={handleSubmit}>
                    <label>Descrição:</label>
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

          <label>Categoria:</label>
          <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />

          <label>Tipo:</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} required>
            <option value="">Selecione</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>

          <label>Valor:</label>
          <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required />

          <label>Data:</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />

          <div className="form-buttons">
            <button className="btn btn-primary" type="submit">Salvar</button>
            <button className="btn btn-primary" type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CaixaForm;
