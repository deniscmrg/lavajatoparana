import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: BASE_URL,
});

// Adiciona o token nos headers, se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    //console.log('[AXIOS] Header Authorization foi setado!');
    //console.log(localStorage.getItem('accessToken'))
  } else {
    console.warn('[AXIOS] Nenhum token encontrado!');
  }

  return config;
});

// Interceptor para capturar erro 401 (token inválido ou expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !window.location.pathname.includes('/login')
    ) {
      localStorage.removeItem('accessToken'); // limpa o token
      window.location.href = '/login'; // redireciona para o login
    }

    return Promise.reject(error);
  }
);

export default api;
