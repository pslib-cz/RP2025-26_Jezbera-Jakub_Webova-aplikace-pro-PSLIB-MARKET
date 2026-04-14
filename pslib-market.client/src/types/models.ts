export interface Tag {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  description?: string;
  price: number;
  imageId: number | null;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  condition: number | string;
  saleStatus: number;
  tags: string[];
}