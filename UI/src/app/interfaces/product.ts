interface Stock {
    current: number;
  }
  
  interface Price {
    current: number;
  }
  
  interface Threshold {
    warning: number;
    info: number;
  }
  
  export interface Product {
    _id?: string;
    category: string;
    name: string;
    shortName: string;
    active: boolean;
    stock: Stock;
    price: Price;
    image?: string;
    thresholds: Threshold;
    lastModified?: Date;
    creationTime?: Date;
    createdBy?: string;
    modifiedBy?: string;
  }