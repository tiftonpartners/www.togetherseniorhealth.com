import moment from 'moment-timezone';
import { validateAcronym } from 'store/helpers';
import { IClass, Schedule, TimeOfDay } from 'types/class';
import * as yup from 'yup';

export const TimeOfDayValidator: yup.ObjectSchema<TimeOfDay> = yup
    .object()
    .shape({
        hour: yup.number().required('Hour is required'),
        mins: yup.number().required('Minutes is required'),
        tz: yup
            .string()
            .defined()
            .required('Timezone is required')
    })
    .defined();

export const ScheduleValidator: yup.ObjectSchema<Schedule> = yup
    .object()
    .shape({
        weekdays: yup
            .array(yup.string().defined())
            .min(1, 'Must choose at least 1 day of the week.')
            .required('Must choose at least 1 day of the week.'),
        startTime: TimeOfDayValidator
    })
    .defined();

export const ClassValidator = (
    shouldValidateAcronym: boolean = true
): yup.ObjectSchema<Partial<IClass>> =>
    yup
        .object()
        .shape({
            name: yup
                .string()
                .max(80)
                .defined()
                .required('Name is required'),
            acronym: shouldValidateAcronym
                ? yup
                      .string()
                      .matches(
                          validateAcronym,
                          'Must consist of only capital letters, digits, or dashes'
                      )
                      .max(6, 'Must be at most 6 characters')
                      .required('Acronym is required')
                : yup.string(),
            description: yup
                .string()
                .max(80)
                .defined()
                .required('Name is required'),
            helpMessage: yup
                .string()
                .max(80)
                .required('Help message is required'),
            checkPageHelpMessage: yup
                .string()
                .max(80)
                .defined()
                .required('Check page help message is required'),
            disableEmails: yup.boolean()
        })
        .defined();

export const ClassScheduleValidator: yup.ObjectSchema<Partial<IClass>> = yup
    .object()
    .shape({
        startDate0Z: yup
            .string()
            .defined()
            .required('Start date is required'),
        schedule: ScheduleValidator,
        numSessions: yup
            .number()
            .min(1, 'Minimum of 1 session')
            .max(24, 'Maximum of 24 sessions')
            .required('Number of sessions is required'),
        durationMins: yup.number().required('Duration is required'),
        capacity: yup.number().required('Capacity is required'),
        lobbyTimeMins: yup.number()
    })
    .defined();

export const SessionValidator: yup.ObjectSchema<any> = yup
    .object()
    .shape({
        scheduledStartTime: yup
            .string()
            .required('Scheduled start time is required'),
        date0Z: yup.string().required('Date is required'),
        disableEmails: yup.boolean()
    })
    .defined();

export const SessionUpdateValidator: yup.ObjectSchema<any> = yup
    .object()
    .shape({
        helpMessage: yup
            .string()
            .required('Help message is required')
            .max(80, 'Help message can be longer than 80 characters'),
        startDate0Z: yup
            .string()
            .required('Date is required')
            .test('minDate', 'Please select a date in the future', value => {
                console.log(moment(value).utc());
                console.log(moment().utc());
                return moment(value).isSameOrAfter(
                    moment().tz(moment(value).tz()),
                    'days'
                );
            })
    })
    .defined();
