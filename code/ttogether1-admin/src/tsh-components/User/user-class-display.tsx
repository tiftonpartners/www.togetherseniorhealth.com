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
import CloseIcon from '@material-ui/icons/Close';
import EmailIcon from '@material-ui/icons/Email';
import { useModal } from 'util/modals';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import _ from 'lodash';
import { IClass } from 'types/class';
import {
    getClassesByUserIdAsync,
    removeUserFromClassByIdAsync
} from 'store/classes/actions';
import { makeGetClassesByUserId } from 'store/classes/selectors';
import ConfirmModal, { IConfirmModalProps } from 'util/modals/ConfirmModal';
import {
    ISendClassReminderEmailByUserIdPayload,
    sendClassReminderEmailByUserIdAsync
} from 'store/notifications/actions';
import RequirePermissions from 'util/RequirePermissions';

export interface IUserClassDisplayProps {
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
        paddingBottom: 12,
        textTransform: 'uppercase',
        width: '100%'
    },

    deleteButton: {
        padding: 3
    },
    deleteButtonIcon: {
        fill: theme.palette.error.main,
        height: 22,
        width: 22
    },
    emailButton: {
        padding: 3
    },
    emailButtonIcon: {
        fill: theme.palette.success.main,
        height: 22,
        width: 22
    }
}));

const UserClassDisplay: React.FC<IUserClassDisplayProps> = props => {
    const { userId } = props;

    const classes = useStyles();
    const dispatch = useDispatch();
    const { showModal } = useModal();

    const getClassCollection = makeGetClassesByUserId(userId);
    const classCollection = useSelector<RootState, IClass[]>(state =>
        getClassCollection(state)
    );

    const callGetClassesByUserId = useCallback(
        () =>
            dispatch(
                getClassesByUserIdAsync.request({
                    userId
                })
            ),
        [dispatch, userId]
    );

    const callRemoveUserFromClassById = useCallback(
        (classId: string) =>
            dispatch(
                removeUserFromClassByIdAsync.request({
                    userId,
                    classId
                })
            ),
        [dispatch, userId]
    );

    const callSendClassReminderEmailByUserId = useCallback(
        (payload: ISendClassReminderEmailByUserIdPayload) =>
            dispatch(sendClassReminderEmailByUserIdAsync.request(payload)),
        [dispatch]
    );

    useEffect(() => {
        callGetClassesByUserId();
    }, [callGetClassesByUserId]);

    const handleDeleteClick = (classId: string) => {
        const modal = showModal(ConfirmModal, {
            title: 'Remove User From Class?',
            submitText: 'Unassign',
            onSubmit: () => {
                callRemoveUserFromClassById(classId);
                modal.hide();
            },
            onCancel: () => modal.hide()
        } as IConfirmModalProps);
    };

    const handleEmailClick = (classAcronym: string, userId: string) => {
        const modal = showModal(ConfirmModal, {
            title: 'Send user class reminder email?',
            submitText: 'Send',
            onSubmit: () => {
                callSendClassReminderEmailByUserId({ classAcronym, userId });
                modal.hide();
            },
            onCancel: () => modal.hide()
        } as IConfirmModalProps);
    };

    return (
        <>
            <label className={classes.sectionHeader}>
                <span>Assigned Classes</span>
            </label>
            {classCollection.length > 0 && (
                <List disablePadding dense>
                    {classCollection.map(klass => (
                        <ListItem disableGutters key={klass._id}>
                            <Grid container alignItems="flex-start">
                                <Grid item xs={9}>
                                    {klass.courseName} - {klass.name}
                                </Grid>
                                <Grid item xs={3}>
                                    <RequirePermissions
                                        perms={[
                                            'create:email',
                                            'update:participant'
                                        ]}
                                    >
                                        <Tooltip title={'Email class reminder'}>
                                            <IconButton
                                                className={classes.emailButton}
                                                onClick={() =>
                                                    handleEmailClick(
                                                        klass.acronym,
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
                                    </RequirePermissions>

                                    <RequirePermissions
                                        perms={[
                                            'update:class',
                                            'update:participant'
                                        ]}
                                    >
                                        <Tooltip title={'Remove from class'}>
                                            <IconButton
                                                className={classes.deleteButton}
                                                onClick={() =>
                                                    handleDeleteClick(klass._id)
                                                }
                                            >
                                                <CloseIcon
                                                    className={
                                                        classes.deleteButtonIcon
                                                    }
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    </RequirePermissions>
                                </Grid>
                            </Grid>
                        </ListItem>
                    ))}
                </List>
            )}

            {classCollection && classCollection.length === 0 && (
                <List disablePadding dense>
                    <ListItem disableGutters>
                        <Box px={3} width={'100%'} textAlign="center">
                            <i>No classes</i>
                        </Box>
                    </ListItem>
                </List>
            )}
        </>
    );
};

export default UserClassDisplay;
