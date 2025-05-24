import { useEffect, useState } from 'react';
import api from '../api/axios';

const usePerfil = () => {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const { data } = await api.get('perfil/');
        setPerfil(data.perfil);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        setPerfil(null);
      }
    };
    fetchPerfil();
  }, []);

  return perfil;
};

export default usePerfil;
