export interface Tag {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  description?: string;
  price: number;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  condition: number | string;
  saleStatus: number;
  tags: string[];
  reservations?: BookReservation[];
}

export interface BookReservation {
  id?: number;
  reservedByUserName?: string;
  reservedByUserEmail?: string;
  reservedAt?: string;
}