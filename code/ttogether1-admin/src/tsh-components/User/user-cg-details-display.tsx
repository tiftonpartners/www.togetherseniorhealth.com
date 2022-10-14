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
import { useDispatch, useSelector } from 'react-redux';
import {
    getAVUserAsync,
    getUserAsync,
    toggleEditUser
} from 'store/users/actions';
import { RootState } from 'typesafe-actions';
import _ from 'lodash';
import { makeGetUser } from 'store/users/selectors';
import { IAVUser, UserType } from 'types/user';
import RequirePermissions from 'util/RequirePermissions';
import useRequirePermissions from 'util/hooks/useRequirePermissions';

export interface IAVUserCaregiverDetailsDisplayProps {
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

const UserCaregiverDetailsDisplay: React.FC<IAVUserCaregiverDetailsDisplayProps> = props => {
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
                        <span>Caregiver</span>
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
                            <strong>Caregiver First Name:</strong>
                            <Box pl={1}>{userToDisplay.caregiverFirstName}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Caregiver Last Name:</strong>
                            <Box pl={1}>{userToDisplay.caregiverLastName}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Caregiver Phone:</strong>
                            <Box pl={1}>{userToDisplay.caregiverPhone}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Caregiver Mobile Phone:</strong>
                            <Box pl={1}>
                                {userToDisplay.caregiverMobilePhone}
                            </Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Caregiver Email:</strong>
                            <Box pl={1}>{userToDisplay.caregiverEmail}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Class Emails Enabled: </strong>
                            <Box pl={1}>
                                {userToDisplay.disableCaregiverClassEmails
                                    ? 'No'
                                    : 'Yes'}
                            </Box>
                        </ListItem>
                        {userToDisplay.caregiverContactMethod && (
                            <ListItem disableGutters>
                                <strong>
                                    Preferred Caregiver Contact Method:
                                </strong>
                                <Box pl={1}>
                                    {userToDisplay.caregiverContactMethod}
                                </Box>
                            </ListItem>
                        )}
                        <ListItem disableGutters>
                            <strong>Caregiver Street Address: </strong>
                            <Box pl={1}>
                                {userToDisplay.caregiverStreetAddress}
                            </Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Caregiver City: </strong>
                            <Box pl={1}>{userToDisplay.caregiverCity}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Caregiver Zip Code: </strong>
                            <Box pl={1}>{userToDisplay.caregiverZipCode}</Box>
                        </ListItem>
                        <ListItem disableGutters>
                            <strong>Caregiver Relationship:</strong>
                            <Box pl={1}>{userToDisplay.caregiverRel}</Box>
                        </ListItem>
                    </List>
                </>
            )}
        </>
    );
};

export default UserCaregiverDetailsDisplay;
