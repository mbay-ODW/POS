import { Product } from "./product";

  export interface OrderDetails {
    id: string;
    product: Product;
    amount: number;
  }
  
  export interface Order {
    _id?: string;
    orders: OrderDetails[];
    creationTime?: Date;
    schemaVersion?: string;
    lastModified?: Date;
  }
  