import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './FecharFaturasModal.css';

const FecharFaturasModal = ({ onClose, onConfirm }) => {
  const [competencia, setCompetencia] = useState('');
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('TODOS');

  useEffect(() => {
    const buscarLojistas = async () => {
      try {
        const res = await api.get('/clientes/');
        const lojistas = res.data.filter(c => c.tipo === 'lojista');
        setClientes(lojistas);
      } catch (err) {
        console.error('Erro ao carregar lojistas:', err);
      }
    };
    buscarLojistas();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ competencia, cliente_id: clienteSelecionado === 'TODOS' ? null : clienteSelecionado });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo">
        <h3>Fechar Faturas</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-linha">
            <label>Competência (MMAAAA)</label>
            <input
              type="text"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              placeholder="052025"
              required
            />
          </div>
          <div className="form-linha">
            <label>Cliente (Lojista)</label>
            <select
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
            >
              <option value="TODOS">Todos os Lojistas</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
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

export default FecharFaturasModal;
