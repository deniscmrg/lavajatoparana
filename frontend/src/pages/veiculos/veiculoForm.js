import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './veiculos.css';

function VeiculoForm({ onClose, editData }) {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');

  const [marcasDisponiveis, setMarcasDisponiveis] = useState([]);
  const [modelosDisponiveis, setModelosDisponiveis] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await api.get('clientes/');
        setClientes(response.data);
      } catch (err) {
        console.error('Erro ao buscar clientes:', err);
      }
    };

    const fetchMarcas = async () => {
      try {
        const res = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
        const data = await res.json();
        setMarcasDisponiveis(data);
      } catch (err) {
        console.error('Erro ao buscar marcas FIPE:', err);
      }
    };

    fetchClientes();
    fetchMarcas();
  }, []);

  useEffect(() => {
    if (editData) {
      setClienteId(editData.cliente);
      setPlaca(editData.placa || '');
      setMarca(editData.marca || '');
      setModelo(editData.modelo || '');
      setCor(editData.cor || '');
    }
  }, [editData]);

  useEffect(() => {
    const marcaSelecionada = marcasDisponiveis.find(m => m.nome === marca);
    if (marcaSelecionada) {
      fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaSelecionada.codigo}/modelos`)
        .then(res => res.json())
        .then(data => setModelosDisponiveis(data.modelos))
        .catch(err => console.error('Erro ao buscar modelos:', err));
    } else {
      setModelosDisponiveis([]);
    }
  }, [marca, marcasDisponiveis]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      cliente: clienteId,
      placa,
      marca,
      modelo,
      cor,
    };

    try {
      if (editData) {
        await api.put(`veiculos/${editData.placa}/`, payload);
      } else {
        await api.post('veiculos/', payload);
      }
      onClose();
    } catch (err) {
      alert('Erro ao salvar veículo.');
      console.error(err);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h3>{editData ? 'EDITAR VEÍCULO' : 'NOVO VEÍCULO'}</h3>
        <form onSubmit={handleSubmit}>
          <label>Cliente:</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
          >
            <option value="">Selecione</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>

          <label>Placa:</label>
          <input
            type="text"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            disabled={editData !== null}
            required
          />

          <label>Marca:</label>
          <input
            list="lista-marcas"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            required
          />
          <datalist id="lista-marcas">
            {marcasDisponiveis.map((m) => (
              <option key={m.codigo} value={m.nome} />
            ))}
          </datalist>

          <label>Modelo:</label>
          <input
            list="lista-modelos"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            required
            disabled={!marca}
          />
          <datalist id="lista-modelos">
            {modelosDisponiveis.map((m) => (
              <option key={m.codigo} value={m.nome} />
            ))}
          </datalist>

          <label>Cor:</label>
          <input
            type="text"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            required
          />

          <div className="form-buttons">
            <button className="btn btn-primary" type="submit">Salvar</button>
            <button className="btn btn-primary" type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VeiculoForm;
