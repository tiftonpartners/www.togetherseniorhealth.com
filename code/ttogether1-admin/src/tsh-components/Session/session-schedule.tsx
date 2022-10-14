import React, { useCallback, useEffect, useState } from 'react';
import moment, { Moment } from 'moment-timezone';

import CheckIcon from '@material-ui/icons/Check';
import ToggleButton from '@material-ui/lab/ToggleButton';
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
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
import { KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';
import { adHocSessionTypes, IAdHocSession } from 'types/session';
import { useDispatch, useSelector } from 'react-redux';
import {
    rescheduleAdHocSessionAsync,
    scheduleAdHocSessionAsync
} from 'store/sessions/actions';
import { RootState } from 'typesafe-actions';
import { IAuth0User } from 'types/auth0';
import _ from 'lodash';
import { getAuth0UsersByRoleAsync } from 'store/auth0Users/actions';
import RequirePermissions from 'util/RequirePermissions';
import useRequirePermissions from 'util/hooks/useRequirePermissions';
import ClassSessionScheduleForm from 'tsh-components/Class/class-sessions-schedule-form';

export interface ISessionScheduleProps {
    userId?: string; // id of user the session is for
    session?: IAdHocSession; // if passed we are rescheduling or editing current session
    orientation?: 'hor' | 'ver';
    buttonText?: string;
    buttonBackground?: string;
    resetOnSubmit?: boolean;
    isMeetNow?: boolean;

    onSubmit?: (
        startDate: Moment,
        startTime: Moment,
        tz: string,
        instructor: IAuth0User,
        participants: string[],
        type: string,
        notes?: string
    ) => void;
    onCancel?: () => void;
}

const now = moment().tz('America/Los_Angeles');

const initialState = {
    submitted: false,
    tz: 'America/Los_Angeles',
    startDate: moment()
        .tz('America/Los_Angeles')
        .minute(Math.ceil(now.minute() / 15) * 15),
    startTime: moment()
        .tz('America/Los_Angeles')
        .minute(Math.ceil(now.minute() / 15) * 15),
    durationMins: 60 as number | string,
    instructor: undefined as IAuth0User,
    participants: [] as string[],
    sessionType: '',
    notes: '',
    sendEmail: false
};

const SessionSchedule = React.memo((props: ISessionScheduleProps) => {
    const {
        onCancel,
        userId,
        orientation = 'hor',
        session,
        buttonText,
        buttonBackground,
        resetOnSubmit = true,
        isMeetNow = false,
        onSubmit
    } = props;
    const { permitted } = useRequirePermissions([
        'update:session',
        'create:session'
    ]);

    if (!permitted) {
        return;
    }

    if (!session && !userId) {
        throw 'Must either pass a user id for creating a session or a session object to edit';
    }

    const usersByRole = useSelector<RootState, string[]>(
        state => state.auth0Users.byRole['adhocFacilitators']
    );

    const adhocFacilitators = useSelector<RootState, IAuth0User[]>(state => {
        return usersByRole
            ? usersByRole.map(userId =>
                  _.get(state.auth0Users.collection, userId)
              )
            : [];
    });

    const timezones = moment.tz.zonesForCountry('US');

    const useStyles = makeStyles(theme => ({
        formGroup: {
            marginBottom: theme.spacing(3),
            width: '100%'
        },
        formLabel: {
            fontSize: 12,
            marginBottom: theme.spacing(1),
            marginTop: 2
        },
        checkbox: {
            padding: '4px 8px'
        },
        fieldsContainer: {
            flex: 1
        },
        buttonContainer: {
            display: 'inline-flex',
            flexDirection: 'column',
            width: 150,
            justifyContent: 'flex-end',

            '& button': {
                marginLeft: theme.spacing(1)
            }
        },
        submitButton: {
            backgroundColor: buttonBackground || theme.palette.primary.main,

            '& .MuiButton-label': {
                whiteSpace: 'nowrap'
            }
        },
        cancelButton: {
            marginTop: theme.spacing(2)
        },
        sendEmailButton: {
            height: 40,
            width: 40
        }
    }));

    const classes = useStyles();

    const [hasDateError, setHasDateError] = useState(false);
    const [hasTimeError, setHasTimeError] = useState(false);
    const state = session
        ? {
              ...initialState,
              tz: session.tz,
              startDate: moment(session.scheduledStartTime).tz(session.tz),
              startTime: moment(session.scheduledStartTime).tz(session.tz),
              durationMins: session.durationMins,
              instructor: adhocFacilitators.find(
                  user => user.user_id === session.instructorId
              ),
              participants: session.participants,
              sessionType: session.sessionType as string,
              notes: session.notes
          }
        : { ...initialState };

    const [
        {
            submitted,
            tz,
            startDate,
            startTime,
            durationMins,
            instructor,
            participants,
            sessionType,
            notes,
            sendEmail
        },
        setState
    ] = useState(state);

    const dispatch = useDispatch();

    const callScheduleSession = useCallback(
        (
            startDate: string,
            tz: string,
            duration: string | number,
            instructor: string,
            participants: string[],
            sessionType: string,
            notes?: string,
            sendEmail?: boolean
        ) =>
            dispatch(
                scheduleAdHocSessionAsync.request({
                    userId,
                    scheduleParams: {
                        type: sessionType,
                        startTime: startDate,
                        tz,
                        duration,
                        participants: [userId].concat(participants),
                        instructorId: instructor,
                        notes,
                        sendEmail
                    }
                })
            ),
        [dispatch, userId]
    );

    const callRescheduleSession = useCallback(
        (
            acronym: string,
            startTime: string,
            tz: string,
            duration: string | number,
            instructor: string,
            participants: string[],
            sessionType: string,
            notes?: string,
            sendEmail?: boolean
        ) =>
            dispatch(
                rescheduleAdHocSessionAsync.request({
                    userId,
                    scheduleParams: {
                        acronym,
                        type: sessionType,
                        startTime,
                        tz,
                        duration,
                        participants,
                        instructorId: instructor,
                        notes,
                        sendEmail
                    }
                })
            ),
        [dispatch, userId]
    );

    const handleChangeDate = (date: Moment) => {
        if (submitted) {
            if (
                moment(date)
                    .tz(tz)
                    .isSameOrAfter(moment.tz(tz), 'days')
            ) {
                setHasDateError(false);
            } else {
                setHasDateError(true);
            }
        }

        if (date.isValid()) {
            const newDate = startDate;

            newDate.set('year', date.year());
            newDate.set('month', date.month());
            newDate.set('date', date.date());
            setState(prevState => ({ ...prevState, startDate: newDate }));
        }
    };

    const handleChangeStartTime = (time: Moment) => {
        if (submitted) {
            // Time only matters if user is selecting current day
            if (startDate.isSame(moment.tz(tz), 'days')) {
                if (
                    moment(time)
                        .tz(tz)
                        .isSameOrAfter(moment.tz(tz), 'minutes')
                ) {
                    setHasTimeError(false);
                } else {
                    setHasTimeError(true);
                }
            }
        }

        if (time.isValid()) {
            const newTime = startTime;

            newTime.set('hours', time.hours());
            newTime.set('minutes', time.minutes());
            setState(prevState => ({ ...prevState, startTime: newTime }));
        }
    };

    const handleChangeTz = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        setState(prevState => ({ ...prevState, tz: event.target.value }));
    };

    const handleChangeDuration = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        setState(prevState => ({
            ...prevState,
            durationMins: Number(event.target.value)
        }));
    };

    const handleChangeInstructor = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        const instructor = adhocFacilitators.find(
            user => user.user_id === event.target.value
        );
        setState(prevState => ({ ...prevState, instructor }));
    };

    const handleChangeSessionType = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        setState(prevState => ({
            ...prevState,
            sessionType: event.target.value
        }));
    };

    const handleToggleParticipants = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        const participantId = event.target.value;
        const index = participants.indexOf(participantId);
        const array = [...participants];

        if (index > -1) {
            array.splice(index, 1);
        } else {
            array.push(participantId);
        }
        setState(prevState => ({ ...prevState, participants: array }));
    };

    const handleToggleSendEmail = () => {
        setState(prevState => ({
            ...prevState,
            sendEmail: !prevState.sendEmail
        }));
    };

    const handleSubmit = () => {
        setState(prevState => ({
            ...prevState,
            submitted: true
        }));
        if (sessionType !== '' && instructor) {
            // Combine date and time into one timestamp
            startDate
                .tz(tz)
                .hours(startTime.hours())
                .minutes(startTime.minutes())
                .seconds(0)
                .milliseconds(0);

            if (
                moment(startDate)
                    .tz(tz)
                    .isBefore(moment().tz(tz), 'days') &&
                !isMeetNow
            ) {
                setHasDateError(true);
                return;
            } else {
                setHasDateError(false);
            }

            if (
                moment(startDate)
                    .tz(tz)
                    .isBefore(moment().tz(tz), 'minutes') &&
                !isMeetNow
            ) {
                setHasTimeError(true);
                return;
            } else {
                setHasTimeError(false);
            }

            let now = moment().tz('America/Los_Angeles');
            now.minute(Math.floor(now.minute() / 15) * 15)
                .seconds(0)
                .milliseconds(0);

            if (session && session._id) {
                callRescheduleSession(
                    session.acronym,
                    startDate.toISOString(true),
                    tz,
                    durationMins,
                    instructor.user_id,
                    participants,
                    sessionType,
                    notes,
                    sendEmail
                );
            } else {
                callScheduleSession(
                    isMeetNow
                        ? now.toISOString(true)
                        : startDate.toISOString(true),
                    tz,
                    durationMins,
                    instructor.user_id,
                    participants,
                    sessionType,
                    notes,
                    sendEmail
                );
            }

            if (onSubmit) {
                onSubmit(
                    startDate,
                    startTime,
                    tz,
                    instructor,
                    participants,
                    sessionType
                );
            }

            if (resetOnSubmit) {
                setState({ ...initialState });
            }
        }
    };

    const callGetUsersByRole = useCallback(() => {
        return dispatch(
            getAuth0UsersByRoleAsync.request({
                role: 'adhocFacilitators'
            })
        );
    }, [dispatch]);

    useEffect(() => {
        if (!adhocFacilitators || adhocFacilitators.length == 0) {
            callGetUsersByRole();
        }

        if (adhocFacilitators && session) {
            const instructor = adhocFacilitators.find(
                user => user.user_id === session.instructorId
            );
            setState(prevState => ({ ...prevState, instructor }));
        }
    }, [callGetUsersByRole, adhocFacilitators.length]);

    return (
        <div>
            <Grid container alignItems="flex-end" spacing={2}>
                <Grid className={classes.fieldsContainer} container item>
                    <Grid container spacing={2}>
                        <Grid item xs={3}>
                            <FormGroup className={classes.formGroup}>
                                <FormControl error={hasDateError && !isMeetNow}>
                                    <KeyboardDatePicker
                                        margin="normal"
                                        label="Start Date"
                                        name="startDate"
                                        format="MM / DD / yyyy"
                                        autoOk
                                        error={hasDateError && !isMeetNow}
                                        disabled={isMeetNow}
                                        value={isMeetNow ? null : startDate}
                                        emptyLabel="Now"
                                        onChange={handleChangeDate}
                                        KeyboardButtonProps={{
                                            'aria-label': 'change start date'
                                        }}
                                    />
                                    {hasDateError && !isMeetNow && (
                                        <FormHelperText>
                                            Must select date in the future
                                        </FormHelperText>
                                    )}
                                </FormControl>
                            </FormGroup>
                        </Grid>
                        <Grid item xs={3}>
                            <FormGroup className={classes.formGroup}>
                                <FormControl error={hasTimeError && !isMeetNow}>
                                    <KeyboardTimePicker
                                        margin="normal"
                                        minutesStep={15}
                                        label="Start Time"
                                        name="startTime"
                                        error={hasTimeError && !isMeetNow}
                                        disabled={isMeetNow}
                                        value={isMeetNow ? null : startTime}
                                        emptyLabel="Now"
                                        onChange={handleChangeStartTime}
                                        KeyboardButtonProps={{
                                            'aria-label': 'change start time'
                                        }}
                                    />
                                    {hasTimeError && !isMeetNow && (
                                        <FormHelperText>
                                            Must select time in the future
                                        </FormHelperText>
                                    )}
                                </FormControl>
                            </FormGroup>
                        </Grid>
                        <Grid item xs={3}>
                            <FormGroup className={classes.formGroup}>
                                <FormControl margin="normal">
                                    <InputLabel id="timezone-select-label">
                                        Timezone
                                    </InputLabel>
                                    <Select
                                        labelId="timezone-select-label"
                                        id="timezone-select"
                                        value={tz}
                                        disabled={isMeetNow}
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
                        <Grid item xs={3}>
                            <FormGroup className={classes.formGroup}>
                                <FormControl margin="normal">
                                    <InputLabel id="duration-select-label">
                                        Duration (minutes)
                                    </InputLabel>
                                    <Select
                                        labelId="duration-select-label"
                                        id="duration-select"
                                        value={durationMins}
                                        onChange={handleChangeDuration}
                                    >
                                        <MenuItem key={30} value={30}>
                                            30
                                        </MenuItem>
                                        <MenuItem key={60} value={60}>
                                            60
                                        </MenuItem>
                                        <MenuItem key={90} value={90}>
                                            90
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </FormGroup>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item xs={3}>
                            <FormGroup className={classes.formGroup}>
                                {/* TODO: Update to use select-user-by-role component */}
                                <FormControl
                                    margin="normal"
                                    error={!instructor && submitted}
                                >
                                    <InputLabel>Meeting Facilitator</InputLabel>
                                    <Select
                                        labelId="instructor-select-label"
                                        id="instructor-select"
                                        value={
                                            instructor ? instructor.user_id : ''
                                        }
                                        onChange={handleChangeInstructor}
                                        fullWidth
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {adhocFacilitators.map(item => (
                                            <MenuItem
                                                key={item.user_id}
                                                value={item.user_id}
                                            >
                                                {item.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        {!instructor &&
                                            submitted &&
                                            'Must select at least one meeting facilitator'}
                                    </FormHelperText>
                                </FormControl>
                            </FormGroup>
                        </Grid>
                        <Grid item xs={3}>
                            <FormGroup className={classes.formGroup}>
                                <FormControl
                                    margin="normal"
                                    error={
                                        (!sessionType || sessionType === '') &&
                                        submitted
                                    }
                                >
                                    <InputLabel id="session-type-select-label">
                                        Type
                                    </InputLabel>
                                    <Select
                                        labelId="session-type-select-label"
                                        id="session-type-select"
                                        value={sessionType}
                                        onChange={handleChangeSessionType}
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {Array.from(
                                            adHocSessionTypes.keys()
                                        ).map(key => (
                                            <MenuItem key={key} value={key}>
                                                {adHocSessionTypes.get(key)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        {(!sessionType || sessionType === '') &&
                                            submitted &&
                                            'Must select a session type'}
                                    </FormHelperText>
                                </FormControl>
                            </FormGroup>
                        </Grid>
                        <Grid item xs={3}>
                            <FormControl margin="normal">
                                <FormLabel className={classes.formLabel}>
                                    Additional Participants
                                </FormLabel>
                                <FormGroup>
                                    {adhocFacilitators.map(item => (
                                        <FormControlLabel
                                            key={item.user_id}
                                            control={
                                                <Checkbox
                                                    className={classes.checkbox}
                                                    checked={
                                                        participants.indexOf(
                                                            item.user_id
                                                        ) > -1
                                                    }
                                                    onChange={
                                                        handleToggleParticipants
                                                    }
                                                    disabled={
                                                        instructor &&
                                                        instructor.user_id ==
                                                            item.user_id
                                                    }
                                                    name={item.user_id}
                                                    value={item.user_id}
                                                />
                                            }
                                            label={item.name}
                                        />
                                    ))}
                                </FormGroup>
                            </FormControl>
                        </Grid>
                        <Grid item xs={3}>
                            <FormControl margin="normal">
                                <FormLabel className={classes.formLabel}>
                                    Send Email?
                                </FormLabel>
                                <FormGroup>
                                    <ToggleButton
                                        value="check"
                                        className={classes.sendEmailButton}
                                        selected={sendEmail}
                                        onChange={handleToggleSendEmail}
                                    >
                                        {sendEmail && <CheckIcon />}
                                    </ToggleButton>
                                </FormGroup>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container justifyContent="flex-end" spacing={2}>
                <Grid className={classes.buttonContainer} item>
                    <Button
                        variant="contained"
                        color="primary"
                        className={classes.submitButton}
                        onClick={handleSubmit}
                    >
                        {buttonText || 'Submit'}
                    </Button>

                    {session && onCancel && (
                        <Button
                            variant="contained"
                            color="secondary"
                            className={classes.cancelButton}
                            onClick={onCancel}
                        >
                            {'Cancel'}
                        </Button>
                    )}
                </Grid>
            </Grid>
        </div>
    );
});

export default SessionSchedule;
