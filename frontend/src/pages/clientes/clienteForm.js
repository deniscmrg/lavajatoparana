// src/pages/clientes/clienteForm.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './clientes.css';

function ClienteForm({ onClose, editData }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [tipo, setTipo] = useState('');

  useEffect(() => {
    if (editData) {
      setNome(editData.nome || '');
      setEmail(editData.email || '');
      setCelular(editData.celular || '');
      setTipo(editData.tipo || '');
    }
  }, [editData]);

  // validar email
  const validarEmail = (valor) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(valor);
  };

  // validar celular
  const formatarCelular = (valor) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // valida o email
    if (email && !validarEmail(email)) {
      alert('Formato de e-mail inválido.');
      return;
    }

    // valida o celular
    const celularNumerico = celular.replace(/\D/g, '');
    if (celularNumerico.length < 10) {
      alert('Número de celular incompleto.');
      return;
    }

    const payload = { nome, email, celular: celularNumerico, tipo };

    try {
      if (editData) {
        await api.put(`clientes/${editData.id}/`, payload);
      } else {
        await api.post('clientes/', payload);
      }
      onClose();
    } catch (err) {
      alert('Erro ao salvar cliente.');
      console.error(err);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h3>{editData ? 'EDITAR CLIENTE' : 'NOVO CLIENTE'}</h3>
        <form onSubmit={handleSubmit}>
          <label>Nome:</label>
          <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} />

          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Celular:</label>
          {/* <input type="text" required value={celular} onChange={(e) => setCelular(e.target.value)} /> */}
          <input
            type="text"
            required
            value={celular}
            onChange={(e) => setCelular(formatarCelular(e.target.value))}
          />

          <label>Tipo:</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} required>
            <option value="">Selecione</option>
            <option value="particular">Particular</option>
            <option value="lojista">Lojista</option>
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

export default ClienteForm;
