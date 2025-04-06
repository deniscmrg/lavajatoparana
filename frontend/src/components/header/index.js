// import React from 'react';
// import './header.css';

// const Header = () => {
//   return (
//     <header className="header">
//       <span>Bem-vindo, Administrador</span>
//     </header>
//   );
// };

// export default Header;

// src/components/header/index.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css'; // Estilo separado

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <header className="main-header">
      <h1 className="title">Administrador</h1>

      <button className="logout-button" onClick={handleLogout}>
        Sair
      </button>
    </header>
  );
}

export default Header;
