export interface Setting {
    _id?: string;
    name: string;
    description: string;
    category: string;
    value: string;
    schemaVersion: string;
    lastModified: Date;
    creationTime: Date;
}