import { OrderDetails } from "./order";

export interface Preview {
    _id?: string;
    orders: OrderDetails[];
    creationTime?: Date;
    lastModified?: Date;
    createdBy?: string;
    modifiedBy?: string;
}
