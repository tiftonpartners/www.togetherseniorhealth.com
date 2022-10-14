import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Grid,
    InputLabel,
    List,
    ListItem,
    makeStyles,
    MenuItem,
    Select,
    TextField
} from '@material-ui/core';
import { KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';
import moment, { Moment } from 'moment-timezone';
import _ from 'lodash';
import { useDispatch } from 'react-redux';
import {
    ISkipSessionPayload,
    IUpdateSessionPayload,
    skipSessionAsync,
    updateSessionAsync
} from 'store/classes/actions';
import { IClassSession } from 'types/session';
import { IAuth0User } from 'types/auth0';
import SelectUserFromRole from 'tsh-components/Roles/select-user-by-role';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { SessionUpdateValidator } from 'store/classes/validation';
import useRequirePermissions from 'util/hooks/useRequirePermissions';
import SessionForceTimeLink from './session-force-time-link';
import SessionRecordings from './session-recordings';

export interface ISessionEditFormProps {
    classId: string;
    session: IClassSession;
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
    sessionDetails: {
        marginBottom: theme.spacing(4)
    }
}));

const SessionEditForm: React.FC<ISessionEditFormProps> = props => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const classUpdatePermitted = useRequirePermissions(['update:class']);

    const { classId, session, onSubmit, onCancel } = props;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        errors
    } = useForm({
        resolver: yupResolver(SessionUpdateValidator)
    });

    const callUpdateSession = useCallback(
        (payload: IUpdateSessionPayload) =>
            dispatch(updateSessionAsync.request(payload)),
        [dispatch]
    );

    const callSkipSession = useCallback(
        (payload: ISkipSessionPayload) =>
            dispatch(skipSessionAsync.request(payload)),
        [dispatch]
    );

    const [instructorId, setInstructorId] = useState<string>(
        session.instructorId || undefined
    );

    const [tz, setTz] = useState<string>(session.tz || 'America/Los_Angeles');

    const [startDate, setStartDate] = useState<Moment>(
        moment(session.scheduledStartTime).tz(tz)
    );
    const [startTime, setStartTime] = useState<Moment>(
        moment(session.scheduledStartTime).tz(tz)
    );

    const lobbyOpenTime = moment(session.lobbyOpenTime)
        .tz(tz)
        .format('hh:mm A');
    const lobbyCloseTime = moment(session.lobbyCloseTime)
        .tz(tz)
        .format('hh:mm A');

    const timezones = moment.tz.zonesForCountry('US');

    const handleChangeStartTime = (time: Moment) => {
        setStartTime(time);
    };

    const handleChangeTz = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        setTz(event.target.value);
    };

    const handleChangeInstructor = (instructorId: string) => {
        setInstructorId(instructorId);
    };

    const handleFormSubmit = (form: any) => {
        const date0Z = moment(form.startDate0Z)
            .tz(tz)
            .format('YYYY-MM-DD');
        const scheduledStartTime = startTime
            .set({
                year: moment(form.startDate0Z).year(),
                month: moment(form.startDate0Z).month(),
                date: moment(form.startDate0Z).date(),
                seconds: 0,
                milliseconds: 0
            })
            .toISOString();
        callUpdateSession({
            classId,
            session: {
                ...session,
                instructorId,
                date0Z,
                scheduledStartTime,
                tz,
                helpMessage: _.get(form, 'helpMessage'),
                disableEmails: _.get(form, 'disableEmails')
            }
        });

        if (onSubmit) {
            onSubmit();
        }
    };

    const handleFormCancel = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        handleSubmit((form: any) => {
            callSkipSession({
                classId,
                session: {
                    ...session,
                    instructorId,
                    scheduledStartTime: startTime.toISOString(),
                    tz,
                    helpMessage: _.get(form, 'helpMessage'),
                    disableEmails: _.get(form, 'disableEmails')
                }
            });
        })(e);
    };

    return (
        <form noValidate onSubmit={handleSubmit(handleFormSubmit)}>
            <Grid container spacing={2} className={classes.sessionDetails}>
                <Grid item xs={4}>
                    <label className={classes.sectionHeader}>
                        <span>Session Details</span>
                    </label>

                    <List disablePadding dense>
                        <ListItem disableGutters>
                            <strong>Scheduled Start Time:</strong>
                            <Box pl={1}>{startTime.format('hh:mm A')}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Lobby Open Time:</strong>
                            <Box pl={1}>{lobbyOpenTime}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Lobby Close Time:</strong>
                            <Box pl={1}>{lobbyCloseTime}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Time Zone:</strong>
                            <Box pl={1}>{session.tz}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Help Message:</strong>
                            <Box pl={1}>{session.helpMessage}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Emails Enabled:</strong>
                            <Box pl={1} flex={1}>
                                {session.disableEmails ? 'No' : 'Yes'}
                            </Box>
                        </ListItem>
                    </List>
                </Grid>

                <Grid item xs={4}>
                    <label className={classes.sectionHeader}>
                        <span>Recordings</span>
                    </label>
                    <SessionRecordings sessionAcronym={session.acronym} />
                </Grid>

                <Grid item xs={4}>
                    <label className={classes.sectionHeader}>
                        <span>Testing</span>
                    </label>

                    <ListItem disableGutters>
                        <SessionForceTimeLink
                            dateTime={session.lobbyOpenTime.toString()}
                        />
                    </ListItem>
                </Grid>
            </Grid>

            {classUpdatePermitted.permitted && (
                <>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <label className={classes.sectionHeader}>
                                <span>Edit Session</span>
                            </label>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <FormGroup className={classes.formGroup}>
                                <FormControl
                                    error={errors.startDate0Z !== undefined}
                                >
                                    <Controller
                                        as={
                                            <KeyboardDatePicker
                                                margin="normal"
                                                id="sessionStartDateEdit"
                                                label="Start Date"
                                                name="startDate0Z"
                                                format="MM / DD / yyyy"
                                                autoOk
                                                value={watch('startDate0Z')}
                                                onChange={() => {}}
                                                KeyboardButtonProps={{
                                                    'aria-label':
                                                        'change start date'
                                                }}
                                                error={
                                                    errors.startDate0Z !==
                                                    undefined
                                                }
                                            />
                                        }
                                        defaultValue={startDate}
                                        name="startDate0Z"
                                        control={control}
                                    />
                                    <FormHelperText>
                                        {errors.startDate0Z?.message}
                                    </FormHelperText>
                                </FormControl>
                            </FormGroup>
                        </Grid>
                        <Grid item xs={4}>
                            <FormGroup className={classes.formGroup}>
                                <KeyboardTimePicker
                                    margin="normal"
                                    id="sessionScheduleStartTimeEdit"
                                    label="Start Time"
                                    name="startTime"
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
                        <Grid item xs={4}>
                            <SelectUserFromRole
                                formLabel="Instructor"
                                role="instructor"
                                onSelectUser={handleChangeInstructor}
                                defaultUserId={session.instructorId}
                                selectedUserId={instructorId}
                                required={true}
                            />
                        </Grid>
                        <Grid item xs={5}>
                            <TextField
                                variant="outlined"
                                id="sessionHelpMessageEdit"
                                name="helpMessage"
                                label="Help Message"
                                type="text"
                                fullWidth
                                multiline
                                rows={3}
                                defaultValue={session.helpMessage}
                                inputRef={register}
                                error={errors.helpMessage !== undefined}
                                helperText={errors.helpMessage?.message}
                            />
                        </Grid>
                        <Grid item xs={3}>
                            <FormGroup className={classes.formGroup}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            inputRef={register}
                                            defaultChecked={
                                                session.disableEmails
                                            }
                                            name="disableEmails"
                                        />
                                    }
                                    label="Disable Session Emails?"
                                />
                            </FormGroup>
                        </Grid>
                    </Grid>

                    <Box mt={2}>
                        <Grid container spacing={2} justifyContent="flex-end">
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={e => {
                                        handleFormCancel(e);
                                    }}
                                >
                                    Skip
                                </Button>
                            </Grid>

                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                >
                                    Save Session
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </>
            )}
        </form>
    );
};

export default SessionEditForm;
