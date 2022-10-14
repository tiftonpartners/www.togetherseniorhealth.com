import { enumToArray, validateAcronym } from 'store/helpers';
import { ICourse } from 'types/course';
import * as yup from 'yup';

export const CourseValidator: yup.ObjectSchema<Partial<ICourse>> = yup
    .object()
    .shape({
        name: yup
            .string()
            .max(24, 'Must be at most 24 characters')
            .required('Name is required'),
        description: yup
            .string()
            .defined()
            .max(120, 'Must be at most 120 characters')
            .required('Description is required'),
        acronym: yup
            .string()
            .matches(
                validateAcronym,
                'Must consist of only capital letters, digits, or dashes'
            )
            .max(8, 'Must be at most 8 characters')
            .required('Acronym is required'),
        program: yup.string()
    })
    .defined();
