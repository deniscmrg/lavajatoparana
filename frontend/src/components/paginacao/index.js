import React from 'react';
import './paginacao.css';

export default function Paginacao({ paginaAtual, totalPaginas, onPageChange }) {
  const MAX_BOTOES = 5; // quantos botões mostrar antes de usar "..."

  const gerarPaginas = () => {
    let paginas = [];

    if (totalPaginas <= MAX_BOTOES + 2) {
      // Mostra todas
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      // Começo fixo
      paginas.push(1);
      let inicio = Math.max(2, paginaAtual - 1);
      let fim = Math.min(totalPaginas - 1, paginaAtual + 1);

      if (inicio > 2) paginas.push('...');
      for (let i = inicio; i <= fim; i++) paginas.push(i);
      if (fim < totalPaginas - 1) paginas.push('...');
      paginas.push(totalPaginas);
    }

    return paginas;
  };

  const paginas = gerarPaginas();

  return (
    <div className="paginacao">
      <button onClick={() => onPageChange(1)} disabled={paginaAtual === 1}>{"<<"}</button>
      <button onClick={() => onPageChange(paginaAtual - 1)} disabled={paginaAtual === 1}>{"<"}</button>

      {paginas.map((p, idx) => (
        <button
          key={idx}
          onClick={() => typeof p === 'number' && onPageChange(p)}
          disabled={p === '...' || p === paginaAtual}
          className={p === paginaAtual ? 'ativo' : ''}
        >
          {p}
        </button>
      ))}

      <button onClick={() => onPageChange(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>{">"}</button>
      <button onClick={() => onPageChange(totalPaginas)} disabled={paginaAtual === totalPaginas}>{">>"}</button>
    </div>
  );
}
