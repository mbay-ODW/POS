  export interface OrderDetails {
    id: string;
    product: string;
    amount: number;
  }
  
  export interface Order {
    _id?: string;
    orders: OrderDetails[];
    creationTime?: Date;
    lastModified?: Date;
    createdBy?: string;
    modifiedBy?: string;
  }
  