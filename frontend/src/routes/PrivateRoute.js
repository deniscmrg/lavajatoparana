// import React from 'react';
// import { Navigate, Outlet } from 'react-router-dom';

// const PrivateRoute = () => {
//   const token = localStorage.getItem('accessToken');
//   return token ? <Outlet /> : <Navigate to="/login" replace />;
// };

// export default PrivateRoute;

// PrivateRoute.js
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import usePerfil from '../hooks/usePerfil';

const PrivateRoute = ({ allowedRoles = [] }) => {
  const token = localStorage.getItem('accessToken');
  const perfil = usePerfil();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!perfil) {
    return <div className="loading">Carregando...</div>;
  }

  console.log('PERFIL:', perfil);
  console.log('ALLOWED:', allowedRoles);
  if (allowedRoles.includes(perfil)) {
    return <Outlet />;
  }

  return <Navigate to="/acesso-negado" state={{ from: location }} replace />;
};

export default PrivateRoute;
