export interface Station {
    _id?: string;
    name: string;
    categories: string[];
    creationTime?: Date;
    lastModified?: Date;
    createdBy?: string;
    modifiedBy?: string;
}
