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
  } else {
    console.warn('[AXIOS] Nenhum token encontrado!');
  }

  return config;
});

export default api;


