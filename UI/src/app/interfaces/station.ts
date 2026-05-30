export interface Station {
    _id?: string;
    name: string;
    categories: string[];
    vorlauf?: number;
    creationTime?: Date;
    lastModified?: Date;
    createdBy?: string;
    modifiedBy?: string;
}
