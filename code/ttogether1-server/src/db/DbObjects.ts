/*
 * Interfaces and Classes for data objects stored in the Database.
 *
 * The general idea is that objects that are retrieved from the Database in
 * JSON format are coersed into interfaces for better type support, autocompletion,
 * and to document expected fields.
 *
 * Additional functionality (usually derrived properties and utility functions) are layed
 * on the objects by defining additional objects constructed from the basic objects as
 * they come from the database.
 */

/* All database objects implement this class, including creation and last update times */
export interface DbObjectI {
    _id?: string;
    created: Date;
    lastupdate?: Date;
    versionId?: number;

    removeDbUpdated(): void; // Remove fields updated by the DB
}

/* Equivalent class */
export class DbObject implements DbObjectI {
    _id: string | undefined = '';
    created = new Date();
    lastupdate: Date | undefined = new Date();
    versionId: number | undefined = 0;

    constructor(obj?: any) {
        this._id = '';
        obj && Object.assign(this, obj);
    }

    removeDbUpdated(): void {
        delete this.lastupdate;
        delete this.versionId;
        delete this._id;
    }
}
