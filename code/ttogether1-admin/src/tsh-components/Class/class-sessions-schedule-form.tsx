import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    FormControl,
    FormGroup,
    FormHelperText,
    FormLabel,
    Grid,
    InputLabel,
    makeStyles,
    MenuItem,
    Select,
    TextField
} from '@material-ui/core';
import { IClass } from 'types/class';
import { KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';
import moment, { Moment } from 'moment-timezone';
import ToggleChip from '../General/toggle-chip';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ClassScheduleValidator } from 'store/classes/validation';
import _ from 'lodash';
import { useDispatch } from 'react-redux';
import {
    IScheduleSessionsForClassPayload,
    scheduleSessionsForClassAsync
} from 'store/classes/actions';

export interface IClassSessionScheduleFormProps {
    classToSchedule: IClass;
    hideCancel?: boolean;
    onSubmit?: () => void;
    onCancel?: () => void;
}

const useStyles = makeStyles(theme => ({
    sectionHeader: {
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'inline-flex',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: theme.spacing(2),
        paddingBottom: theme.spacing(1),
        textTransform: 'uppercase',
        width: '100%'
    },
    formGroup: {
        marginBottom: theme.spacing(3)
    },
    weekdayChip: {
        marginBottom: theme.spacing(1),
        marginRight: theme.spacing(1)
    },
    cancelButton: {
        marginRight: theme.spacing(1)
    }
}));

const ClassSessionScheduleForm: React.FC<IClassSessionScheduleFormProps> = props => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { classToSchedule, onSubmit, onCancel, hideCancel } = props;
    const { register, handleSubmit, setValue, errors, control } = useForm({
        resolver: yupResolver(ClassScheduleValidator)
    });

    const callScheduleSessionsForClass = useCallback(
        (payload: IScheduleSessionsForClassPayload) =>
            dispatch(scheduleSessionsForClassAsync.request(payload)),
        [dispatch]
    );

    const weekdayOptions: { name: string; abbr: string }[] = [
        {
            name: 'Sunday',
            abbr: 'sun'
        },
        {
            name: 'Monday',
            abbr: 'mon'
        },
        {
            name: 'Tuesday',
            abbr: 'tue'
        },
        {
            name: 'Wednesday',
            abbr: 'wed'
        },
        {
            name: 'Thursday',
            abbr: 'thu'
        },
        {
            name: 'Friday',
            abbr: 'fri'
        },
        {
            name: 'Saturday',
            abbr: 'sat'
        }
    ];

    const [weekdays, setWeekdays] = useState<string[]>(
        _.get(classToSchedule, 'schedule.weekdays') || []
    );
    const [startDate, setStartDate] = useState<Moment>(
        moment(classToSchedule.startDate0Z)
    );
    const [startTime, setStartTime] = useState<Moment>(
        moment({
            day: startDate.day(),
            month: startDate.month(),
            year: startDate.year(),
            hour: _.get(classToSchedule, 'schedule.startTime.hour') || 0,
            minutes: _.get(classToSchedule, 'schedule.startTime.mins') || 0
        })
    );

    const [tz, setTz] = useState<string>('America/Los_Angeles');
    const timezones = moment.tz.zonesForCountry('US');

    useEffect(() => {
        register({
            name: 'schedule.startTime.hour'
        });
        register({
            name: 'schedule.startTime.mins'
        });
        register({ name: 'schedule.startTime.tz' });
        register({ name: 'schedule.weekdays' });
        register({ name: 'startDate0Z' });
        register({ name: 'lobbyTimeMins' });
    }, []);

    useEffect(() => {
        setValue('schedule.startTime.hour', startTime.hour(), {
            shouldValidate: true
        });
        setValue('schedule.startTime.mins', startTime.minute(), {
            shouldValidate: true
        });
        setValue('schedule.startTime.tz', tz, {
            shouldValidate: true
        });
        setValue('weekdays', weekdays, {
            shouldValidate: true
        });
        setValue('startDate0Z', startDate, {
            shouldValidate: true
        });
        setValue('lobbyTimeMins', 15, {
            shouldValidate: true
        });
    }, [setValue, classToSchedule]);

    const handleChangeStartDate = (date: Moment) => {
        setValue('startDate0Z', date.format('YYYY-MM-DD'));
        setStartDate(date);
    };

    const handleChangeStartTime = (time: Moment) => {
        setValue('schedule.startTime.hour', time.hour());
        setValue('schedule.startTime.mins', time.minute());
        setStartTime(time);
    };

    const handleWeekdayToggle = (abbr: string) => {
        const arr = weekdays.includes(abbr)
            ? weekdays.filter(i => i !== abbr) // remove item
            : [...weekdays, abbr]; // add item
        setValue('schedule.weekdays', arr);
        setWeekdays(arr);
    };

    const handleChangeTz = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        setValue('schedule.startTime.tz', event.target.value);
        setTz(event.target.value);
    };

    const handleFormSubmit = (klass: Partial<IClass>) => {
        callScheduleSessionsForClass({
            class: {
                ...classToSchedule,
                ...klass,
                startDate0Z: klass.startDate0Z,
                lobbyTimeMins: 15 // only need to add this here because field is disabled for now
            }
        });

        if (onSubmit) {
            onSubmit();
        }
    };

    return (
        <form noValidate onSubmit={handleSubmit(handleFormSubmit)}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <label className={classes.sectionHeader}>
                        <span>Schedule Sessions</span>
                    </label>
                    <FormControl
                        component="fieldset"
                        error={errors.schedule?.weekdays !== undefined}
                    >
                        <FormLabel component="legend">
                            Days of the Week
                        </FormLabel>

                        <FormGroup className={classes.formGroup}>
                            <Grid container>
                                {weekdayOptions.map((day, i) => (
                                    <Box
                                        key={day.abbr}
                                        className={classes.weekdayChip}
                                    >
                                        <ToggleChip
                                            id={day.abbr}
                                            displayValue={day.name}
                                            active={
                                                weekdays.indexOf(day.abbr) > -1
                                            }
                                            onChipClicked={handleWeekdayToggle}
                                        />
                                    </Box>
                                ))}
                            </Grid>
                            {errors.schedule?.weekdays !== undefined && (
                                <FormHelperText>
                                    {errors.schedule?.weekdays?.message}
                                </FormHelperText>
                            )}
                        </FormGroup>
                    </FormControl>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <FormGroup className={classes.formGroup}>
                        <KeyboardDatePicker
                            margin="normal"
                            id="classStartDateEdit"
                            label="Start Date"
                            name="startDate0Z"
                            format="MM / DD / yyyy"
                            disablePast
                            autoOk
                            value={startDate}
                            onChange={handleChangeStartDate}
                            KeyboardButtonProps={{
                                'aria-label': 'change start date'
                            }}
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={4}>
                    <FormGroup className={classes.formGroup}>
                        <KeyboardTimePicker
                            margin="normal"
                            id="classScheduleStartTimeEdit"
                            label="Start Time"
                            name="schedule.startTime"
                            value={startTime}
                            onChange={handleChangeStartTime}
                            KeyboardButtonProps={{
                                'aria-label': 'change start time'
                            }}
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={4}>
                    <FormGroup className={classes.formGroup}>
                        <FormControl margin="normal">
                            <InputLabel id="timezone-select-label">
                                Timezone
                            </InputLabel>
                            <Select
                                labelId="timezone-select-label"
                                id="timezone-select"
                                value={tz}
                                onChange={handleChangeTz}
                            >
                                {timezones.map(tz => (
                                    <MenuItem key={tz} value={tz}>
                                        {tz}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </FormGroup>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="classNumSessionsEdit"
                            name="numSessions"
                            label="Number of Sessions"
                            type="number"
                            fullWidth
                            inputRef={register}
                            defaultValue={classToSchedule.numSessions || 12}
                            error={errors.numSessions !== undefined}
                            helperText={errors.numSessions?.message}
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={3}>
                    <FormGroup className={classes.formGroup}>
                        <FormControl
                            variant="outlined"
                            fullWidth
                            error={Boolean(errors.durationMins)}
                        >
                            <InputLabel variant="outlined">
                                Duration (minutes)
                            </InputLabel>
                            <Controller
                                as={
                                    <Select fullWidth>
                                        <MenuItem key="30dur" value="30">
                                            30
                                        </MenuItem>
                                        <MenuItem key="60dur" value="60">
                                            60
                                        </MenuItem>
                                        <MenuItem key="90dur" value="90">
                                            90
                                        </MenuItem>
                                    </Select>
                                }
                                name="durationMins"
                                control={control}
                                label="Duration (minutes)"
                                defaultValue={
                                    classToSchedule.durationMins || 60
                                }
                            />
                            <FormHelperText>
                                {errors.durationMins &&
                                    errors.durationMins.message}
                            </FormHelperText>
                        </FormControl>
                    </FormGroup>
                </Grid>
                <Grid item xs={3}>
                    <FormGroup className={classes.formGroup}>
                        <FormControl
                            variant="outlined"
                            fullWidth
                            error={Boolean(errors.capacity)}
                        >
                            <InputLabel variant="outlined">
                                Maximum Participants
                            </InputLabel>
                            <Controller
                                as={
                                    <Select fullWidth>
                                        <MenuItem key="1par" value={1}>
                                            1
                                        </MenuItem>
                                        <MenuItem key="2par" value={2}>
                                            2
                                        </MenuItem>
                                        <MenuItem key="3par" value={3}>
                                            3
                                        </MenuItem>
                                        <MenuItem key="4par" value={4}>
                                            4
                                        </MenuItem>
                                        <MenuItem key="5par" value={5}>
                                            5
                                        </MenuItem>
                                        <MenuItem key="6par" value={6}>
                                            6
                                        </MenuItem>
                                        <MenuItem key="7par" value={7}>
                                            7
                                        </MenuItem>
                                        <MenuItem key="8par" value={8}>
                                            8
                                        </MenuItem>
                                    </Select>
                                }
                                name="capacity"
                                control={control}
                                label="Maximum Participants"
                                defaultValue={classToSchedule.capacity || 8}
                            />
                            <FormHelperText>
                                {errors.capacity && errors.capacity.message}
                            </FormHelperText>
                        </FormControl>
                    </FormGroup>
                </Grid>
                <Grid item xs={3}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="classLobbyTimeMinsEdit"
                            name="lobbyTimeMins"
                            label="Lobby Time (minutes)"
                            type="number"
                            fullWidth
                            disabled
                            inputRef={register}
                            defaultValue={classToSchedule.lobbyTimeMins}
                            error={errors.lobbyTimeMins !== undefined}
                            helperText={errors.lobbyTimeMins?.message}
                        />
                    </FormGroup>
                </Grid>
            </Grid>
            <Grid container spacing={2} justifyContent="flex-end">
                {/* <Grid item>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleFormCancel}
                    >
                        Cancel
                    </Button>
                </Grid> */}

                <Grid item>
                    {!hideCancel && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={onCancel}
                            className={classes.cancelButton}
                        >
                            {'Cancel'}
                        </Button>
                    )}

                    <Button variant="contained" color="primary" type="submit">
                        Schedule Class
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
};

export default ClassSessionScheduleForm;
