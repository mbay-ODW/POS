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
    label: string;
    active: boolean;
    stock: Stock;
    price: Price;
    image?: string;
    thresholds: Threshold;
    schemaVersion?: string;
    lastModified?: Date;
    creationTime?: Date;
  }