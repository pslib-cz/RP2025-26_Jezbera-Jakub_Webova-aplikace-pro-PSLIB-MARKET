import type { Book } from '../types/models';

export interface Tag {
  id: number;
  name: string;
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5263/api';

const createAuthHeaders = (token?: string): HeadersInit => {
  if (!token) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
};

export const getBooks = async (token?: string): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/books`, {
    headers: createAuthHeaders(token),
  });
  
  if (!response.ok) {
    throw new Error('Nepodařilo se stáhnout inzeráty z backendu.');
  }
  
  return await response.json();
};

export const getTags = async (): Promise<Tag[]> => {
  const response = await fetch(`${API_BASE_URL}/tags`);
  
  if (!response.ok) {
    throw new Error('Nepodařilo se stáhnout předměty z backendu.');
  }
  
  return await response.json();
};