import {
    enumToArray,
    validateEmail,
    validateInteger,
    validateName,
    validatePhone,
    validatePhoneOrEmpty
} from 'store/helpers';
import { IAVUser } from 'types/user';
import * as yup from 'yup';

export const UserValidator: yup.ObjectSchema<Partial<IAVUser>> = yup
    .object()
    .shape({
        firstName: yup
            .string()
            .max(24, 'Must be at most 24 characters')
            .matches(validateName, 'Must only contain alphabetic characters')
            .required('First name is required'),
        lastName: yup
            .string()
            .matches(validateName, 'Must only contain alphabetic characters')
            .max(24, 'Must be at most 24 characters')
            .required('Last name is required'),
        screenName: yup
            .string()
            .max(100, 'Must be at most 100 characters')
            .required('Screen name is required'),
        email: yup
            .string()
            .matches(validateEmail, 'Must be valid email address')
            .required('Email is required'),
        disableClassEmails: yup.boolean(),
        primaryPhone: yup
            .string()
            .matches(validatePhone, 'Must be valid phone number')
            .required('Phone number is required'),
        mobilePhone: yup
            .string()
            .matches(validatePhone, 'Must be valid phone number')
            .required('Phone number is required'),
        contactMethod: yup.string(),
        streetAddress: yup.string().max(50, 'Must be at most 50 characters'),
        city: yup.string().max(50, 'Must be at most 50 characters'),
        zipCode: yup.string().max(50, 'Must be at most 10 characters'),
        sid: yup
            .string()
            .required('Screener ID is required')
            .matches(validateInteger, 'Screener ID must be numeric')
            .min(2, 'Screener ID must be at least 2 characters')
            .defined(),
        program: yup.string().required(),
        caregiverFirstName: yup
            .string()
            .matches(validateName, 'Must only contain alphabetic characters')
            .max(24, 'Must be at most 24 characters'),
        caregiverLastName: yup
            .string()
            .matches(validateName, 'Must only contain alphabetic characters')
            .max(24, 'Must be at most 24 characters'),
        caregiverEmail: yup
            .string()
            .test(
                'email',
                'Must be valid email address',
                value =>
                    value === undefined ||
                    value === '' ||
                    validateEmail.test(value)
            ),
        disableCaregiverClassEmails: yup.boolean(),
        caregiverPhone: yup
            .string()
            .test(
                'phone',
                'Must be valid phone number',
                value =>
                    value === undefined ||
                    value === '' ||
                    validatePhone.test(value)
            ),
        caregiverMobilePhone: yup
            .string()
            .test(
                'phone',
                'Must be valid phone number',
                value =>
                    value === undefined ||
                    value === '' ||
                    validatePhone.test(value)
            ),
        caregiverContactMethod: yup.string(),
        caregiverStreetAddress: yup
            .string()
            .max(50, 'Must be at most 50 characters'),
        caregiverCity: yup.string().max(50, 'Must be at most 50 characters'),
        caregiverZipCode: yup.string().max(50, 'Must be at most 10 characters'),
        caregiverRel: yup
            .string()
            .matches(validateName, 'Must only contain alphabetic characters')
            .max(24, 'Must be at most 24 characters'),

        localEmergencyPhone: yup
            .string()
            .matches(validatePhoneOrEmpty, 'Must be valid phone number'),
        primaryEmergencyPhone: yup
            .string()
            .matches(validatePhoneOrEmpty, 'Must be valid phone number'),
        secondaryEmergencyPhone: yup
            .string()
            .matches(validatePhoneOrEmpty, 'Must be valid phone number'),
        referredBy: yup.string().max(50, 'Must be at most 50 characters'),
        communication: yup.string().max(50, 'Must be at most 50 characters'),
        notes: yup.string().max(255, 'Must be at most 255 characters')
    })
    .defined();
