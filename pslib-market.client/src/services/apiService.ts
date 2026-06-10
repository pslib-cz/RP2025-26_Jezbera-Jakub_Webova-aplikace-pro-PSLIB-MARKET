import type { Book, BookActivityLog, ReservedBook, Tag } from "../types/models";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isLocalhostAbsoluteApi = /^https?:\/\/localhost:\d+(\/api)?\/?$/i.test(
  configuredApiBaseUrl ?? "",
);

const rawApiBaseUrl =
  import.meta.env.DEV && isLocalhostAbsoluteApi
    ? "/api"
    : configuredApiBaseUrl || "/api";
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

const createAuthHeaders = (token?: string): HeadersInit => {
  if (!token) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
};

export type BooksPageResponse = {
  items: Book[];
  filteredCount: number;
  visibleCount: number;
  minPrice: number;
  maxPrice: number;
  page: number;
  pageSize: number;
};

export type PagedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type BooksQueryParams = {
  token?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  subjects?: string[];
  conditions?: number[];
  saleStatuses?: string[];
  sort?: string;
};

export type AuditLogQueryParams = {
  token: string;
  page?: number;
  pageSize?: number;
};

const appendValues = (
  queryParams: URLSearchParams,
  key: string,
  values?: Array<string | number>,
) => {
  values?.forEach((value) => queryParams.append(key, String(value)));
};

export const getBooks = async (
  params: BooksQueryParams = {},
): Promise<BooksPageResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page != null) {
    queryParams.set("page", String(params.page));
  }
  if (params.pageSize != null) {
    queryParams.set("pageSize", String(params.pageSize));
  }
  if (params.search?.trim()) {
    queryParams.set("search", params.search.trim());
  }
  if (params.minPrice != null) {
    queryParams.set("minPrice", String(params.minPrice));
  }
  if (params.maxPrice != null) {
    queryParams.set("maxPrice", String(params.maxPrice));
  }
  appendValues(queryParams, "subjects", params.subjects);
  appendValues(queryParams, "conditions", params.conditions);
  appendValues(queryParams, "saleStatuses", params.saleStatuses);
  if (params.sort?.trim()) {
    queryParams.set("sort", params.sort.trim());
  }

  const response = await fetch(
    `${API_BASE_URL}/books${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
    {
      headers: createAuthHeaders(params.token),
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Nepodařilo se stáhnout inzeráty z backendu.");
  }

  return await response.json();
};

export const getMyBooks = async (token: string): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/books/my`, {
    headers: createAuthHeaders(token),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nepodařilo se stáhnout inzeráty z backendu.");
  }

  return await response.json();
};

export const getReservedByMe = async (token: string): Promise<ReservedBook[]> => {
  const response = await fetch(`${API_BASE_URL}/books/reserved-by-me`, {
    headers: createAuthHeaders(token),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Nepodařilo se stáhnout rezervované inzeráty z backendu.");
  }
  return await response.json();
}

export const changeBookSaleStatus = async (
  bookId: number,
  newStatus: number,
  token: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/status`, {
    method: "PATCH",
    headers: {
      ...createAuthHeaders(token),
      "Content-Type": "application/json",
    },
      credentials: "include",
    body: JSON.stringify(newStatus),
  });

  if (!response.ok) {
    throw new Error("Nepodařilo se aktualizovat stav prodeje knihy.");
  }
};

export const approveBook = async (
  bookId: number,
  token: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/approve`, {
    method: "PATCH",
    headers: createAuthHeaders(token),
    credentials: "include",
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Nepodařilo se schválit inzerát.");
  }
};

export const rejectBook = async (
  bookId: number,
  token: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/reject`, {
    method: "PATCH",
    headers: createAuthHeaders(token),
    credentials: "include",
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Nepodařilo se zamítnout inzerát.");
  }
};

export const getPendingBooks = async (token: string): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/books/pending`, {
    headers: createAuthHeaders(token),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nepodařilo se stáhnout čekající inzeráty z backendu.");
  }

  return await response.json();
};

export const reserveBook = async (
  bookId: number,
  token: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/reserve`, {
    method: "POST",
    headers: createAuthHeaders(token),
    credentials: "include",
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Nepodařilo se odeslat zájem o knihu.");
  }
};

export const getAuditLogs = async (
  params: AuditLogQueryParams,
): Promise<PagedResponse<BookActivityLog>> => {
  const queryParams = new URLSearchParams();

  if (params.page != null) {
    queryParams.set("page", String(params.page));
  }
  if (params.pageSize != null) {
    queryParams.set("pageSize", String(params.pageSize));
  }

  const response = await fetch(
    `${API_BASE_URL}/auditlog${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
    {
      headers: createAuthHeaders(params.token),
      credentials: "include",
    },
  );

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Nepodařilo se načíst audit log.");
  }

  return await response.json();
};

export const getTags = async (): Promise<Tag[]> => {
  const response = await fetch(`${API_BASE_URL}/tags`, {
    credentials: "include",
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Nepodařilo se načíst audit log.");
  }

  return await response.json();
};

export const createTag = async (
  tagData: { name: string; bgColor: string; textColor: string },
  token: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tags`, {
    method: "POST",
    headers: {
      ...createAuthHeaders(token),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(tagData),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Nepodařilo se vytvořit nový předmět.");
  }
};

export const updateTag = async (
  currentName: string,
  tagData: { name: string; bgColor: string; textColor: string },
  token: string,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/tags/${encodeURIComponent(currentName)}`,
    {
      method: "PUT",
      headers: {
        ...createAuthHeaders(token),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(tagData),
    },
  );

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Nepodařilo se upravit předmět.");
  }
};

export const deleteTag = async (name: string, token: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/tags/${encodeURIComponent(name)}`,
    {
      method: "DELETE",
      headers: createAuthHeaders(token),
      credentials: "include",
    },
  );

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Nepodařilo se smazat předmět.");
  }
};


export const deleteBook = async (id: number, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: "DELETE",
    headers: createAuthHeaders(token),
    credentials: "include",
  });
    if (!response.ok) throw new Error("Nepodařilo se smazat inzerát.");
};



