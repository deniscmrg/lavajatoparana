import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../header';
import Sidebar from '../sidebar';
import './layout.css';

function Layout() {
  return (
  <div className="layout">
     <Sidebar />
     <div className="main-area">
       <Header />
      <main className="conteudo">
        <Outlet /> {/* <- ESSENCIAL: onde os filhos são renderizados */}
      </main>
    </div>
  </div>
  );
}

export default Layout;
