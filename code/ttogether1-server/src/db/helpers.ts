export const validateEmail = (email: string) => {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

export const validatePhone = (phone: string) => {
    let re = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
    return re.test(phone);
};

export const enumToArray = (e: any) => Object.keys(e).map((key) => e[key]);

export const convertArrayToObject = <T>(
    array: T[],
    key: keyof T,
    value: keyof T
) => {
    const initialValue = {} as { [k: string]: any };
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [String(item[key])]: item[value],
        };
    }, initialValue);
};

export async function asyncFilter<T extends Object>(
    arr: T[],
    callback: (item: T) => Promise<boolean>
): Promise<T[]> {
    const fail = Symbol();
    return (
        await Promise.all(
            arr.map(async (item) => ((await callback(item)) ? item : fail))
        )
    ).filter((i) => i !== fail) as T[];
}

export interface IErrorCode extends Error {
    status?: number;
}
export class ErrorCode extends Error implements IErrorCode {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
    }
}
