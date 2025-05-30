import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import logo from '../../assets/logo.jpeg';
import './login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('token/', {
        username,
        password
      });

      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);

      // Obtém o perfil do usuário autenticado
      const perfilResponse = await api.get('perfil/', {
        headers: {
          Authorization: `Bearer ${response.data.access}`
        }
      });

      const perfil = perfilResponse.data.perfil;
      localStorage.setItem('usuario', JSON.stringify({ tipo: perfil }));

      // Redireciona com base no perfil
      if (perfil === 'admin') {
        navigate('/dashboard', { replace: true });
      } else if (perfil === 'operador') {
        navigate('/ordens', { replace: true });
      } else {
        navigate('/acesso-negado', { replace: true });
      }

    } catch (error) {
      alert('Usuário ou senha inválidos.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <img
          src={logo}
          alt="Logo"
          className="login-logo"
        />

        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="title">Acesso ao Sistema</h2>

          <input
            className="input-login"
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="input-login"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
