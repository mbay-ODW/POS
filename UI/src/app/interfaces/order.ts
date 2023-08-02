export interface OrderProduct {
    id: string;
    name: string;
  }
  
  
  export interface OrderDetails {
    id: string;
    product: OrderProduct;
    amount: number;
  }
  
  export interface Order {
    _id?: string;
    orders: OrderDetails[];
    creationTime?: Date;
    schemaVersion?: string;
    lastModified?: Date;
  }
  