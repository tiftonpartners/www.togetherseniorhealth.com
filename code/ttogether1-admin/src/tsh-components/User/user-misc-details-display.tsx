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
import { IAVUser, UserType } from 'types/user';
import RequirePermissions from 'util/RequirePermissions';
import useRequirePermissions from 'util/hooks/useRequirePermissions';

export interface IUserMiscDetailsDisplayProps {
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

const UserMiscDetailsDisplay: React.FC<IUserMiscDetailsDisplayProps> = props => {
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
            {userToDisplay &&
                permitted &&
                (userToDisplay.referredBy ||
                    userToDisplay.communication ||
                    userToDisplay.notes) && (
                    <>
                        <label className={classes.sectionHeader}>
                            <span>Misc.</span>
                            <RequirePermissions perms={[`update:${userSlug}`]}>
                                {editable && (
                                    <Tooltip title={'Edit User'}>
                                        <IconButton
                                            className={classes.editButton}
                                            onClick={handleEditClick}
                                        >
                                            <EditIcon
                                                className={
                                                    classes.editButtonIcon
                                                }
                                            />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </RequirePermissions>
                        </label>

                        <List disablePadding dense className={classes.list}>
                            {userToDisplay.referredBy && (
                                <ListItem disableGutters>
                                    <strong>Referred By:</strong>
                                    <Box pl={1}>{userToDisplay.referredBy}</Box>
                                </ListItem>
                            )}
                            {userToDisplay.communication && (
                                <ListItem disableGutters>
                                    <strong>Communication / Status:</strong>
                                    <Box pl={1}>
                                        {userToDisplay.communication}
                                    </Box>
                                </ListItem>
                            )}
                            {userToDisplay.notes && (
                                <ListItem disableGutters>
                                    <strong>Notes:</strong>
                                    <Box pl={1}>{userToDisplay.notes}</Box>
                                </ListItem>
                            )}
                        </List>
                    </>
                )}
        </>
    );
};

export default UserMiscDetailsDisplay;
