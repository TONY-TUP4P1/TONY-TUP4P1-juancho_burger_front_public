import { useContext } from 'react';
import { DataContext } from '../context/DataContext'; // Asegura que la ruta sea correcta

export const useData = () => {
  const context = useContext(DataContext);
  
  if (!context) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  
  return context;
};

export default useData;