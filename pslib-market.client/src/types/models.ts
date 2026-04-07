export interface Tag {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  price: number;
  ownerId: string;
  saleStatus: number;
  tags: Tag[];
}