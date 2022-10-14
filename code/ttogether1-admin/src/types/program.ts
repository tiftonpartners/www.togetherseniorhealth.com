import { ICollectionDTO } from './dto';

export interface IProgram {
    acronym: string;
    shortName: string;
    longName: string;
    description: string;
    logoUrl: string;
    createdOn?: Date;
}

export interface IProgramCollectionDTO extends ICollectionDTO<IProgram> {}
