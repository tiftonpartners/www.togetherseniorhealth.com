export interface ICourse {
    _id?: string;
    name: string;
    description: string;
    acronym: string;
    createdOn: Date;
    state: 'waitl' | 'open' | 'done';
    program: string;
    displayCreatedOn?: string; // formatted date
}
