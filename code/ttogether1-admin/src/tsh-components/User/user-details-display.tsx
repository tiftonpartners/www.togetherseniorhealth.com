import React, { useCallback, useEffect } from 'react';
import {
    Box,
    IconButton,
    List,
    ListItem,
    makeStyles,
    Tooltip
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { useModal } from 'util/modals';
import { Selector, useDispatch, useSelector } from 'react-redux';
import { getAVUserAsync, toggleEditUser } from 'store/users/actions';
import UserTicketDisplay from './user-ticket-display';
import { RootState } from 'typesafe-actions';
import _ from 'lodash';
import { makeGetUser } from 'store/users/selectors';
import { IAVUser, UserType, userTypes } from 'types/user';
import RequirePermissions from 'util/RequirePermissions';
import useRequirePermissions from 'util/hooks/useRequirePermissions';

export interface IAVUserDetailsDisplayProps {
    userId: string;
    editable?: boolean;
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
    list: {
        '& .MuiListItem-root': {
            flexWrap: 'wrap'
        }
    },
    editButton: {
        padding: 4,
        marginLeft: 6
    },
    editButtonIcon: {
        fill: theme.palette.success.main,
        fontSize: 16
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

const UserDetailsDisplay: React.FC<IAVUserDetailsDisplayProps> = props => {
    const { userId, editable } = props;

    const classes = useStyles();
    const dispatch = useDispatch();
    const { showModal } = useModal();

    const getUser = makeGetUser(userId);
    const userToDisplay = useSelector<RootState, IAVUser>(state =>
        getUser(state)
    );

    const userSlug =
        userToDisplay && userToDisplay.__t === UserType.Participant
            ? 'participant'
            : 'prospect';
    const { permitted } = useRequirePermissions([`get:${userSlug}`]);

    const callToggleEditUser = useCallback(
        () =>
            dispatch(
                toggleEditUser({
                    userId: userToDisplay.userId
                })
            ),
        [dispatch, userId]
    );

    const callGetAVUser = useCallback(
        () =>
            dispatch(
                getAVUserAsync.request({
                    userId
                })
            ),
        [dispatch, userId]
    );

    useEffect(() => {
        if (!userToDisplay) {
            callGetAVUser();
        }
    }, [callGetAVUser]);

    const handleEditClick = () => {
        callToggleEditUser();
    };

    return (
        <>
            {userToDisplay && permitted && (
                <>
                    <label className={classes.sectionHeader}>
                        <span>User</span>
                        <RequirePermissions perms={[`update:${userSlug}`]}>
                            {editable && (
                                <Tooltip title={'Edit User'}>
                                    <IconButton
                                        className={classes.editButton}
                                        onClick={handleEditClick}
                                    >
                                        <EditIcon
                                            className={classes.editButtonIcon}
                                        />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </RequirePermissions>
                    </label>

                    <List disablePadding dense className={classes.list}>
                        <ListItem disableGutters>
                            <strong>Screener ID:</strong>
                            <Box pl={1}>{userToDisplay.sid}</Box>
                        </ListItem>
                        {userToDisplay.pidn && (
                            <ListItem disableGutters>
                                <strong>Participant ID:</strong>
                                <Box pl={1}>{userToDisplay.pidn}</Box>
                            </ListItem>
                        )}
                        <ListItem disableGutters>
                            <strong>First Name:</strong>
                            <Box pl={1}>{userToDisplay.firstName}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Last Name:</strong>
                            <Box pl={1}>{userToDisplay.lastName}</Box>
                        </ListItem>
                        {userToDisplay.screenName && (
                            <ListItem disableGutters>
                                <strong>Screen Name:</strong>
                                <Box pl={1}>{userToDisplay.screenName}</Box>
                            </ListItem>
                        )}

                        <ListItem disableGutters>
                            <strong>Primary Phone:</strong>
                            <Box pl={1}>{userToDisplay.primaryPhone}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Mobile Phone:</strong>
                            <Box pl={1}>{userToDisplay.mobilePhone}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Email: </strong>
                            <Box pl={1}>{userToDisplay.email}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Class Emails Enabled: </strong>
                            <Box pl={1}>
                                {userToDisplay.disableClassEmails
                                    ? 'No'
                                    : 'Yes'}
                            </Box>
                        </ListItem>
                        {userToDisplay.contactMethod && (
                            <ListItem disableGutters>
                                <strong>Preferred Contact Method:</strong>
                                <Box pl={1}>{userToDisplay.contactMethod}</Box>
                            </ListItem>
                        )}
                        <ListItem disableGutters>
                            <strong>Street Address: </strong>
                            <Box pl={1}>{userToDisplay.streetAddress}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>City: </strong>
                            <Box pl={1}>{userToDisplay.city}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Zip Code: </strong>
                            <Box pl={1}>{userToDisplay.zipCode}</Box>
                        </ListItem>
                        {userToDisplay.ticket && (
                            <ListItem disableGutters>
                                <UserTicketDisplay
                                    ticket={userToDisplay.ticket}
                                />
                            </ListItem>
                        )}
                    </List>
                </>
            )}
        </>
    );
};

export default UserDetailsDisplay;
