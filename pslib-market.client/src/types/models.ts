export interface Tag {
  id: number;
  name: string;
  bgColor: string;
  textColor: string;
}

export interface Book {
  id: number;
  title: string;
  description?: string;
  price: number;
  createdAt?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  condition: number | string;
  saleStatus: number;
  tags?: Tag[]; 
  reservations?: BookReservation[];
}

export interface BookReservation {
  id?: number;
  reservedByUserName?: string;
  reservedByUserEmail?: string;
  reservedAt?: string;
}

export interface BookActivityLog {
  id: number;
  bookId: number;
  userId: string;
  action: string;
  details?: string;
  timeStamp: string;
  book?: {
    id: number;
    title: string;
  };
}

export interface ReservedBook {
  id: number;
  title: string;
  saleStatus: number;
  reservedAt: string | null;
  ownerName: string;
  ownerEmail: string | null;
  queuePosition: number;
  queueLength: number;
  price: number;
  
}