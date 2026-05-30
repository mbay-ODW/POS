
  export interface OrderDetails {
    product: Product;
    amount: number;
  }
  
  export interface Order {
    _id?: string;
    orders: OrderDetails[];
    total: number;
    station_id?: string;
    creationTime?: Date;
    lastModified?: Date;
    createdBy?: string;
    modifiedBy?: string;
  }
  
  
  export interface Product {
    id?: string;
    category: string;
    name: string;
    shortName?: string;
    price: number;
  }