import { OrderDetails } from "./order";

export interface Cart {
    _id?: string;
    content: OrderDetails[];
    sum: number;
    lastModified?: Date;
    creationTime?: Date;
    createdBy?: string;
    modifiedBy?: string;
}