import React, { useCallback, useEffect } from 'react';
import {
    Box,
    Grid,
    IconButton,
    List,
    ListItem,
    makeStyles,
    Tooltip
} from '@material-ui/core';
import EventIcon from '@material-ui/icons/Event';
import DeleteIcon from '@material-ui/icons/Delete';
import EmailIcon from '@material-ui/icons/Email';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import moment from 'moment-timezone';
import { useModal } from 'util/modals';
import UserRescheduleSessionModal, {
    IUserRescheduleSessionModalProps
} from './user-reschedule-session-modal';
import { Selector, useDispatch, useSelector } from 'react-redux';
import { getAVUserAsync } from 'store/users/actions';
import UserTicketDisplay from './user-ticket-display';
import { RootState } from 'typesafe-actions';
import _ from 'lodash';
import {
    AdHocSessionType,
    adHocSessionTypes,
    IAdHocSession,
    LegacyAdHocSessionType,
    legacyAdHocSessionTypes
} from 'types/session';
import {
    deleteAdHocSessionAsync,
    getAdHocSessionsByUserIdAsync
} from 'store/sessions/actions';
import ConfirmModal, { IConfirmModalProps } from 'util/modals/ConfirmModal';
import Auth0NameDisplay from 'tsh-components/Session/auth0-name-display';
import { createSelector } from 'reselect';
import { makeGetUser } from 'store/users/selectors';
import { IAVUser, UserType } from 'types/user';
import { useRouter } from 'next/router';
import {
    ISendAdHocSessionReminderEmailByUserIdPayload,
    ISendClassReminderEmailByUserIdPayload,
    sendAdHocSessionReminderEmailByUserIdAsync
} from 'store/notifications/actions';
import SessionForceTimeLink from 'tsh-components/Session/session-force-time-link';
import useRequirePermissions from 'util/hooks/useRequirePermissions';

export interface IAVUserScheduleDisplayProps {
    userId: string;
    onSubmit?: () => void;
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
    scheduledSessionCard: {
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        padding: theme.spacing(1),
        marginBottom: theme.spacing(2),
        '& > .MuiGrid-container': {
            flexWrap: 'nowrap'
        },
        '& .MuiListItem-root': {
            flexWrap: 'wrap'
        }
    },
    rescheduleButton: {
        padding: 4
    },
    rescheduleButtonIcon: {
        fill: theme.palette.success.main
    },
    deleteButton: {
        padding: 4
    },
    deleteButtonIcon: {
        fill: theme.palette.error.main
    },
    editButton: {
        padding: 4,
        marginLeft: 6
    },
    editButtonIcon: {
        fill: theme.palette.success.main,
        fontSize: 16
    },
    emailButton: {
        padding: 4
    },
    emailButtonIcon: {
        fill: theme.palette.success.main,
        fontSize: 28
    },
    sessionDetailsContainer: {
        flex: 1
    },
    meetingFacilitatorDisplay: {
        wordBreak: 'break-all'
    },
    tooltipContainer: {
        alignItems: 'center',
        display: 'inline-flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        width: 40
    }
}));

const UserScheduleDisplay: React.FC<IAVUserScheduleDisplayProps> = props => {
    const { userId } = props;

    const classes = useStyles();
    const dispatch = useDispatch();
    const { showModal } = useModal();

    const getUser = makeGetUser(userId);
    const userToDisplay = useSelector<RootState, IAVUser>(state =>
        getUser(state)
    );
    const fromDateFinal = moment()
        .utc()
        .startOf('day')
        .toISOString();

    const toDateFinal = moment()
        .utc()
        .add(1, 'year')
        .toISOString();

    const sessionUpdatePermitted = useRequirePermissions([
        'update:session',
        userToDisplay && userToDisplay.__t === UserType.Prospect
            ? 'update:prospect'
            : 'update:participant'
    ]);

    const sessionDeletePermitted = useRequirePermissions([
        'delete:session',
        userToDisplay && userToDisplay.__t === UserType.Prospect
            ? 'update:prospect'
            : 'update:participant'
    ]);

    const sessionCreateEmailPermitted = useRequirePermissions([
        'create:email',
        userToDisplay && userToDisplay.__t === UserType.Prospect
            ? 'update:prospect'
            : 'update:participant'
    ]);

    const callGetAVUser = useCallback(
        () =>
            dispatch(
                getAVUserAsync.request({
                    userId
                })
            ),
        [dispatch, userId]
    );

    const callGetAdHocSessionsByUserId = useCallback(
        () =>
            dispatch(
                getAdHocSessionsByUserIdAsync.request({
                    userId: userId,
                    start: fromDateFinal,
                    end: toDateFinal
                })
            ),
        [dispatch, userId]
    );

    const callSendAdHocSessionReminderEmailByUserId = useCallback(
        (payload: ISendAdHocSessionReminderEmailByUserIdPayload) =>
            dispatch(
                sendAdHocSessionReminderEmailByUserIdAsync.request(payload)
            ),
        [dispatch]
    );

    const callDeleteAdHocSession = useCallback(
        (sessionId: string, acronym: string) =>
            dispatch(
                deleteAdHocSessionAsync.request({
                    sessionId,
                    acronym
                })
            ),
        [dispatch]
    );

    const sessionKeysByUserId = useSelector<RootState, string[]>(state =>
        _.get(state.sessions.byUserId, userId)
    );

    // TODO: update to use memoized selectors
    const sessionsByUserId = useSelector<RootState, IAdHocSession[]>(state =>
        sessionKeysByUserId && sessionKeysByUserId.length
            ? sessionKeysByUserId
                  .map(key => _.get(state.sessions.collection, key))
                  .filter(session => {
                      return moment()
                          .utc()
                          .isBefore(moment(session.lobbyCloseTime));
                  })
            : []
    );

    useEffect(() => {
        callGetAdHocSessionsByUserId();

        if (!userToDisplay) {
            callGetAVUser();
        }
    }, [callGetAdHocSessionsByUserId, callGetAVUser]);

    const handleRescheduleClick = (sessionId: string) => {
        const session = sessionsByUserId.find(
            session => session._id === sessionId
        );
        const modal = showModal(UserRescheduleSessionModal, {
            userId,
            sessionScheduleProps: {
                userId: userId,
                session
            },
            onSubmit: () => modal.hide(),
            onCancel: () => modal.hide()
        } as IUserRescheduleSessionModalProps);
    };

    const handleEmailClick = (sessionAcronym: string, userId: string) => {
        const modal = showModal(ConfirmModal, {
            title: 'Send session reminder email?',
            submitText: 'Send',
            onSubmit: () => {
                callSendAdHocSessionReminderEmailByUserId({
                    sessionAcronym,
                    userId
                });
                modal.hide();
            },
            onCancel: () => modal.hide()
        } as IConfirmModalProps);
    };

    const handleDeleteClick = (sessionId: string, acronym: string) => {
        const modal = showModal(ConfirmModal, {
            title: 'Delete Session?',
            submitText: 'Delete Session',
            onSubmit: () => {
                callDeleteAdHocSession(sessionId, acronym);
                modal.hide();
            },
            onCancel: () => modal.hide()
        } as IConfirmModalProps);
    };

    return (
        <>
            <label className={classes.sectionHeader}>
                <span> Upcoming Sessions</span>
                <Tooltip title={'Go to Session'}>
                    <IconButton
                        className={classes.editButton}
                        href={`${process.env.NEXT_PUBLIC_AV_BASE}/session/upcoming`}
                        target="_blank"
                    >
                        <OpenInNewIcon className={classes.editButtonIcon} />
                    </IconButton>
                </Tooltip>
            </label>
            {userToDisplay && sessionsByUserId.length > 0 && (
                <List disablePadding dense>
                    {/* TODO: create scheduled session card component */}
                    {sessionsByUserId.map(session => (
                        <ListItem
                            className={classes.scheduledSessionCard}
                            disableGutters
                            key={session._id}
                        >
                            <Grid
                                container
                                alignItems="flex-start"
                                justifyContent="space-between"
                            >
                                <Grid
                                    item
                                    className={classes.sessionDetailsContainer}
                                >
                                    <List disablePadding dense>
                                        <ListItem disableGutters>
                                            <Box pr={1}>
                                                <strong>Type: </strong>
                                            </Box>
                                            {adHocSessionTypes.get(
                                                session.sessionType as AdHocSessionType
                                            ) ||
                                                legacyAdHocSessionTypes.get(
                                                    session.sessionType as LegacyAdHocSessionType
                                                )}
                                        </ListItem>

                                        <ListItem disableGutters>
                                            <Box pr={1}>
                                                <strong>
                                                    Meeting Facilitator:{' '}
                                                </strong>
                                            </Box>
                                            <Box
                                                className={
                                                    classes.meetingFacilitatorDisplay
                                                }
                                            >
                                                <Auth0NameDisplay
                                                    authId={
                                                        session.instructorId
                                                    }
                                                />
                                            </Box>
                                        </ListItem>

                                        <ListItem disableGutters>
                                            <Box pr={1}>
                                                <strong>Start Time: </strong>
                                            </Box>
                                            {session.dateDisplay}
                                        </ListItem>

                                        <ListItem disableGutters>
                                            <Box pr={1}>
                                                <strong>Duration: </strong>
                                            </Box>
                                            {session.durationMins} minutes
                                        </ListItem>

                                        <Box mt={2}>
                                            <label
                                                className={
                                                    classes.sectionHeader
                                                }
                                            >
                                                <span>Testing</span>
                                            </label>
                                        </Box>

                                        <ListItem disableGutters>
                                            <SessionForceTimeLink
                                                dateTime={session.dateDisplay}
                                            />
                                        </ListItem>
                                    </List>
                                </Grid>
                                <Grid item className={classes.tooltipContainer}>
                                    {sessionUpdatePermitted &&
                                        !sessionUpdatePermitted.loading &&
                                        sessionUpdatePermitted.permitted && (
                                            <Tooltip
                                                title={'Reschedule Session'}
                                            >
                                                <IconButton
                                                    className={
                                                        classes.rescheduleButton
                                                    }
                                                    onClick={() =>
                                                        handleRescheduleClick(
                                                            session._id
                                                        )
                                                    }
                                                >
                                                    <EventIcon
                                                        className={
                                                            classes.rescheduleButtonIcon
                                                        }
                                                        fontSize="large"
                                                    />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    {sessionCreateEmailPermitted &&
                                        !sessionCreateEmailPermitted.loading &&
                                        sessionCreateEmailPermitted.permitted && (
                                            <Tooltip
                                                title={
                                                    'Email ad hoc session reminder'
                                                }
                                            >
                                                <IconButton
                                                    className={
                                                        classes.emailButton
                                                    }
                                                    onClick={() =>
                                                        handleEmailClick(
                                                            session.acronym,
                                                            userId
                                                        )
                                                    }
                                                >
                                                    <EmailIcon
                                                        className={
                                                            classes.emailButtonIcon
                                                        }
                                                    />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    {sessionDeletePermitted &&
                                        !sessionDeletePermitted.loading &&
                                        sessionDeletePermitted.permitted && (
                                            <Tooltip title={'Delete Session'}>
                                                <IconButton
                                                    className={
                                                        classes.deleteButton
                                                    }
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            session._id,
                                                            session.acronym
                                                        )
                                                    }
                                                >
                                                    <DeleteIcon
                                                        className={
                                                            classes.deleteButtonIcon
                                                        }
                                                    />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                </Grid>
                            </Grid>
                        </ListItem>
                    ))}
                </List>
            )}
            {userToDisplay && sessionsByUserId.length === 0 && (
                <List disablePadding dense>
                    <ListItem disableGutters>
                        <Box px={3} width={'100%'} textAlign="center">
                            <i>No sessions</i>
                        </Box>
                    </ListItem>
                </List>
            )}
        </>
    );
};

export default UserScheduleDisplay;
