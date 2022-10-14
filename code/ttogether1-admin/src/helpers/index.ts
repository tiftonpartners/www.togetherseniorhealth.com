export function flatten<T extends Record<string, any>>(
    object: T,
    path: string | null = null,
    separator = '.'
): T {
    return Object.keys(object).reduce((acc: T, key: string): T => {
        const value = object[key];
        const newPath = Array.isArray(object)
            ? `${path ? path : ''}[${key}]`
            : [path, key].filter(Boolean).join(separator);
        const isObject = [
            typeof value === 'object',
            value !== null,
            !(value instanceof Date),
            !(value instanceof RegExp),
            !Array.isArray(value)
        ].every(Boolean);

        return isObject
            ? { ...acc, ...flatten(value, newPath, separator) }
            : { ...acc, [newPath]: value };
    }, {} as T);
}

export function normalize(str: string, sep: string = '-') {
    let i,
        frags = str.split(sep);
    for (i = 0; i < frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
}
