// src/pages/dashboard/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import './dashboard.css';

const Dashboard = () => {
  const hoje = new Date();
  const [mes, setMes] = useState((hoje.getMonth() + 1).toString().padStart(2, '0'));
  const [ano, setAno] = useState(hoje.getFullYear().toString());
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [ordensAbertas, setOrdensAbertas] = useState([]);
  const [faturasAbertas, setFaturasAbertas] = useState([]);

  useEffect(() => {
    const fetchEntradas = async () => {
      try {
        const res = await api.get('/caixa/');
        const apenasEntradas = res.data.filter(item => item.tipo === 'entrada');

        // Agrupar por dia dentro do mês/ano escolhido
        const agrupado = {};

        apenasEntradas.forEach(item => {
          const [dataCompleta] = item.data.split('T');
          const [anoItem, mesItem, diaItem] = dataCompleta.split('-');

          if (anoItem === ano && mesItem === mes) {
            agrupado[diaItem] = (agrupado[diaItem] || 0) + parseFloat(item.valor);
          }
        });

        const diasDoMes = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

        const dados = diasDoMes.map(dia => ({
          dia,
          valor: Number((agrupado[dia] || 0).toFixed(2))
        }));

        setDadosGrafico(dados);
      } catch (error) {
        console.error('Erro ao buscar entradas:', error);
      }

      const fetchOS = async () => {
        try {
          const res = await api.get('/ordens-servico/?status=aberta');
          setOrdensAbertas(res.data);
        } catch (err) {
          console.error('Erro ao buscar OSs abertas:', err);
        }
      };

      const fetchFaturas = async () => {
        try {
          const res = await api.get('/faturas/');
          const abertas = res.data.filter(f => !f.data_pagamento);
          setFaturasAbertas(abertas);
        } catch (err) {
          console.error('Erro ao buscar faturas abertas:', err);
        }
      };

      fetchOS();
      fetchFaturas();

    };

    fetchEntradas();
  }, [mes, ano]);

  const opcoesMes = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const anosDisponiveis = ['2023', '2024', '2025'];

  return (
    <div className="pagina-dashboard">
      <div className="filtros-dashboard">
        <select value={mes} onChange={(e) => setMes(e.target.value)}>
          {opcoesMes.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <select value={ano} onChange={(e) => setAno(e.target.value)}>
          {anosDisponiveis.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="grafico-container">
        <h3>Entradas por Dia - {opcoesMes.find(m => m.value === mes).label}/{ano}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="valor" fill="#2B9FAE" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="painel-dashboard">
        <div className="painel">
          <h3>OSs Abertas</h3>
          <div className="painel-scroll">
            <table className="painel-tabela">
              <thead>
                <tr>
                  <th>OS</th>
                  <th>Placa</th>
                  <th>Entrada</th>
                </tr>
              </thead>
              <tbody>
                {ordensAbertas.map(os => (
                  <tr key={os.id}>
                    <td>#{os.id}</td>
                    <td>{os.veiculo?.placa}</td>
                    <td>
                      {os.data
                        ? new Date(os.data).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="painel">
          <h3>Faturas Abertas</h3>
          <div className="painel-scroll">
            <table className="painel-tabela">
              <thead>
                <tr>
                  <th>Fatura</th>
                  <th>Lojista</th>
                  <th>Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {faturasAbertas.map(fat => (
                  <tr key={fat.id}>
                    <td>#{fat.id}</td>
                    <td>{fat.cliente_nome}</td>
                    <td>
                      {fat.data_vencimento
                        ? new Date(fat.data_vencimento).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
