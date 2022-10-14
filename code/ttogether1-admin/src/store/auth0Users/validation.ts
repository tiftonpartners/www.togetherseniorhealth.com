import { UserData as Auth0UserData } from 'auth0';
import * as yup from 'yup';

export const UserValidator: yup.ObjectSchema<Partial<Auth0UserData>> = yup
    .object()
    .shape({
        nickname: yup.string().required('Nickname is required'),
        username: yup.string().required('Username is required'),
        picture: yup.string().required('Picture is required')
    })
    .defined();
