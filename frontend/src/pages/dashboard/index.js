// src/pages/dashboard/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import './dashboard.css';

const Dashboard = () => {
  const hoje = new Date();
  const [mes, setMes] = useState(String(hoje.getMonth() + 1).padStart(2, '0'));
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [ordensAbertas, setOrdensAbertas] = useState([]);
  const [faturasAbertas, setFaturasAbertas] = useState([]);
  const [debugResumo, setDebugResumo] = useState(null); // 👈 debug

  const formataDataBR = (d) => {
    if (!d) return 'Sem data';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? 'Sem data' : dt.toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    const fetchResumo = async () => {
      try {
        const mesNum = Number(mes);
        const anoNum = Number(ano);

        const { data } = await api.get(`/dashboard/resumo/?ano=${anoNum}&mes=${mesNum}`);

        // 👇 DEBUG: guarda o payload bruto
        setDebugResumo(data);
        console.log('[DASHBOARD] Resumo recebido:', data);

        // gráfico já vem pronto do backend, mas forçamos tipagem
        const graficoTipado = Array.isArray(data?.grafico)
          ? data.grafico.map((g) => ({
              dia: String(g.dia).padStart(2, '0'),
              valor: Number(g.valor) || 0,
              quantidade: Number(g.quantidade) || 0,
            }))
          : [];
        setDadosGrafico(graficoTipado);

        // painel OS abertas
        const osNorm = (data?.os_abertas || []).map((os) => ({
          id: os.id,
          veiculo: { placa: os.placa || '-' },
          data: os.data,
        }));
        setOrdensAbertas(osNorm);

        // painel faturas
        setFaturasAbertas(Array.isArray(data?.faturas_abertas) ? data.faturas_abertas : []);
      } catch (err) {
        console.error('Erro ao carregar resumo do dashboard:', err);
        setDadosGrafico([]);
        setOrdensAbertas([]);
        setFaturasAbertas([]);
        setDebugResumo(null);
      }
    };

    fetchResumo();
  }, [mes, ano]);

  const totalOSFinalizadas = useMemo(
    () => dadosGrafico.reduce((acc, d) => acc + (Number(d.quantidade) || 0), 0),
    [dadosGrafico]
  );
  const totalEntradas = useMemo(
    () => dadosGrafico.reduce((acc, d) => acc + (Number(d.valor) || 0), 0),
    [dadosGrafico]
  );

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
          {opcoesMes.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <select value={ano} onChange={(e) => setAno(e.target.value)}>
          {anosDisponiveis.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Resumo numérico (ajuda a validar backend) */}
      <div style={{ display: 'flex', gap: 24, margin: '8px 0 4px 4px', fontSize: 14 }}>
        <span><strong>Total Entradas:</strong> R$ {totalEntradas.toFixed(2)}</span>
        <span><strong>OS finalizadas no mês:</strong> {totalOSFinalizadas}</span>
      </div>

      <div className="grafico-container">
        <h3>Entradas por Dia - {opcoesMes.find(mo => mo.value === mes)?.label}/{ano}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis yAxisId="esquerda" orientation="left" tickFormatter={(v) => `R$ ${v}`} />
            <YAxis yAxisId="direita" orientation="right" allowDecimals={false} />
            <Tooltip formatter={(value, name) => (name === 'valor' ? `R$ ${value}` : value)} />
            <Bar yAxisId="esquerda" dataKey="valor" name="Valor (R$)" fill="#2B9FAE" />
            <Bar yAxisId="direita" dataKey="quantidade" name="Qtd OSs" fill="#4CAF50" />
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
                    <td>{os.veiculo?.placa || '-'}</td>
                    <td>{formataDataBR(os.data)}</td>
                  </tr>
                ))}
                {ordensAbertas.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center' }}>Nenhuma OS aberta</td></tr>
                )}
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
                    <td>{fat.cliente_nome || '-'}</td>
                    <td>{formataDataBR(fat.data_vencimento)}</td>
                  </tr>
                ))}
                {faturasAbertas.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center' }}>Nenhuma fatura em aberto</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DEBUG VISUAL OPCIONAL (apagar depois) */}
      {/* {process.env.NODE_ENV !== 'production' && debugResumo && (
        <pre style={{ background:'#f7f7f7', padding:8, borderRadius:6, marginTop:8, overflowX:'auto' }}>
      {JSON.stringify(debugResumo.grafico?.slice(0, 10), null, 2)}
        </pre>
      )} */}
    </div>
  );
};

export default Dashboard;
