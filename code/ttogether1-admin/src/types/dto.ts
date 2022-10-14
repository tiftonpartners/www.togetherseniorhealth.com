export interface IDTO {
    _id: string;
}

export interface ICollectionDTO<T = any> {
    [key: string]: T;
}
