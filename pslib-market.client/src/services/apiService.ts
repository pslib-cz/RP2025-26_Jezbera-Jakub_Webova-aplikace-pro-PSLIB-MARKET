import type { Book } from '../types/models';

export const getBooks = async (): Promise<Book[]> => {
  const response = await fetch('http://localhost:5263/api/books');
  
  if (!response.ok) {
    throw new Error('Nepodařilo se stáhnout inzeráty z backendu.');
  }
  
  return await response.json();
};