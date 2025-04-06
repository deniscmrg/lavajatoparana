import React from 'react';
import Sidebar from '../sidebar';
import Header from '../header';
import './layout.css'; // vamos criar esse CSS também
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="layout">
    <Sidebar />
    <div className="main-area">
      <Header />
      <main className="content">
        <Outlet />
      </main>
    </div>
  </div>
  );
};

export default Layout;