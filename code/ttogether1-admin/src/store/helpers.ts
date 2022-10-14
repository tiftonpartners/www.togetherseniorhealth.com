// These mimic regex in server mongoose schema
export const validateEmail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const validatePhone = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
export const validatePhoneOrEmpty = /(^$|^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$)/;

export const validateInteger = /^\d+$/;
export const validateName = /^[a-zA-Z'-]*$/;
export const validateAcronym = /^[A-Z-\d]+$/;

export const enumToArray = (e: any) => Object.keys(e).map(key => e[key]);
