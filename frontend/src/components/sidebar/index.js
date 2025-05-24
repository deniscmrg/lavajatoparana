
import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.jpeg';
import './sidebar.css';
import usePerfil from '../../hooks/usePerfil';

const todosMenus = [
  { name: 'Tela inicial', path: '/dashboard' },
  { name: 'Ordens de Serviço', path: '/ordens' },
  { name: 'Clientes', path: '/clientes' },
  { name: 'Veiculos', path: '/veiculos' },
  { name: 'Serviços', path: '/servicos' },
  { name: 'Faturas', path: '/faturas' },
  { name: 'Caixa', path: '/caixa' },
  // { name: 'Relatorios', path: '/relatorios' },
];

const Sidebar = () => {
  const perfil = usePerfil();

  if (!perfil) return null; // ou <div>Carregando...</div>

  const menuFiltrado = perfil === 'operador'
    ? todosMenus.filter(item => item.name === 'Ordens de Serviço')
    : todosMenus;

  return (
    <div className="sidebar">
      <img src={logo} alt="Logo" className="sidebar-logo" />
      <nav>
        {menuFiltrado.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'menu-item active' : 'menu-item'
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
