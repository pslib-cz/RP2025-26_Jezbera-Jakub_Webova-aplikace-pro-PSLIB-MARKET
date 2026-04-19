import type { Book } from '../types/models';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isLocalhostAbsoluteApi = /^https?:\/\/localhost:\d+(\/api)?\/?$/i.test(configuredApiBaseUrl ?? '');

const rawApiBaseUrl = import.meta.env.DEV && isLocalhostAbsoluteApi
  ? '/api'
  : configuredApiBaseUrl || '/api';
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

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

export const getTags = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/tags`);

  if (!response.ok) {
    throw new Error('Nepodařilo se stáhnout předměty z backendu.');
  }

  return await response.json();
};


export const getMyBooks = async (token: string): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/books/my`, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Nepodařilo se stáhnout vaše inzeráty z backendu.');
  }

  return await response.json();
};

export const changeBookSaleStatus = async (bookId: number, newStatus: number, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/status`, {
    method: 'PATCH',
    headers: {
      ...createAuthHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newStatus),
  });

  if (!response.ok) {
    throw new Error('Nepodařilo se aktualizovat stav prodeje knihy.');
  }
};


export const createTag = async (tagName: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tags`, {
    method: 'POST',
    headers: {
      ...createAuthHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tagName),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || 'Nepodařilo se vytvořit nový předmět.');
  }
};

export const approveBook = async (bookId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/approve`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || 'Nepodařilo se schválit inzerát.');
  }
};

export const rejectBook = async (bookId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/reject`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || 'Nepodařilo se zamítnout inzerát.');
  }
};

export const getPendingBooks = async (token: string): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/books/pending`, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Nepodařilo se stáhnout čekající inzeráty z backendu.');
  }

  return await response.json();
};