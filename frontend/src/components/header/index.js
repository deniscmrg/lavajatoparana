import React from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css';
import usePerfil from '../../hooks/usePerfil'; // ajuste o caminho se necessário

function Header() {
  const navigate = useNavigate();
  const perfil = usePerfil();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <header className="main-header">
      <h1 className="title">
        {perfil === 'admin' && 'Administrador'}
        {perfil === 'operador' && 'Operador'}
      </h1>

      <button className="logout-button" onClick={handleLogout}>
        Sair
      </button>
    </header>
  );
}

export default Header;

