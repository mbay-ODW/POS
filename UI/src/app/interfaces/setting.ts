export interface Setting {
    _id?: string;
    name: string;
    description: string;
    category: string;
    value: string;
    lastModified?: Date;
    creationTime?: Date;
    createdBy?: string;
    modifiedBy?: string;
}