import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    ListItem,
    makeStyles,
    MenuItem,
    Paper,
    Select,
    TableCell,
    TableRow,
    Tooltip
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import {
    addUser,
    cancelAddUser,
    closeUserByIdAsync,
    getAllUsersAsync,
    getUserNumberAsync,
    ICloseUserByIdPayload,
    IGetUserNumberPayload,
    IMakeParticipantByIdPayload,
    makeParticipantByIdAsync,
    toggleEditUser
} from 'store/users/actions';
import MUIDataTable, {
    MUIDataTableColumnDef,
    MUIDataTableOptions
} from 'mui-datatables';
import _ from 'lodash';
import UserForm from './user-form';
import UserDisplay from './user-details-display';
import theme from 'containers/themes/theme';
import SessionSchedule from '../Session/session-schedule';
import {
    getProspectsCollection,
    getUsersCollection,
    makeGetIsUserEditing,
    makeGetUser,
    makeGetUserCollectionByState,
    makeGetUserNumber
} from 'store/users/selectors';
import { getMyPrograms } from 'store/programs/selectors';
import DoneIcon from '@material-ui/icons/Done';
import {
    IAVUser,
    IAVUserCollectionDTO,
    IneligibilityReason,
    WithdrawnReason,
    UserState,
    UserType
} from 'types/user';
import UserDetailsDisplay from './user-details-display';
import UserCaregiverDetailsDisplay from './user-cg-details-display';
import UserScheduleDisplay from './user-schedule-display';
import ConfirmModal, { IConfirmModalProps } from 'util/modals/ConfirmModal';
import { useModal } from 'util/modals';
import UserOutcomeConfirmModal, {
    IUserOutcomeConfirmModalProps
} from './user-outcome-confirm-modal';
import UserAssignToClassModal, {
    IUserAssignToClassModalProps
} from './user-assign-to-class';
import UserClassDisplay from './user-class-display';
import {
    assignUserToClassByIdAsync,
    IAssignUserToClassByIdPayload
} from 'store/classes/actions';
import { useRouter } from 'next/router';
import UserRTCLink from './user-rtc-link';
import { IProgram, IProgramCollectionDTO } from 'types/program';
import { getMyProgramsAsync } from 'store/programs/actions';
import RequirePermissions from 'util/RequirePermissions';
import UserEmergencyDetailsDisplay from './user-emergency-details-display';
import UserMiscDetailsDisplay from './user-misc-details-display';
import useRequirePermissions from 'util/hooks/useRequirePermissions';

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
        width: '100%',
        '& label': {
            fontSize: 14,
            fontWeight: 'bold',
            marginRight: theme.spacing(2),
            textTransform: 'uppercase'
        },
        '& .MuiButtonBase-root': {
            fontSize: 12
        }
    },
    testingSection: {
        '& .MuiListItem-root': {
            padding: '2px 0'
        }
    }
}));

interface IExpandableRowProps {
    userId: string;
    colSpan: number;
}

const ExpandableRow: React.FC<IExpandableRowProps> = React.memo(
    (props: IExpandableRowProps) => {
        const { userId, colSpan } = props;
        const classes = useStyles();
        const { showModal } = useModal();
        const dispatch = useDispatch();

        const [isMeetNow, setMeetNow] = useState(false);

        const getUser = makeGetUser(userId);
        const user = useSelector<RootState, IAVUser>(state => getUser(state));

        const getUserNumber = makeGetUserNumber(userId);
        const userNumber = useSelector<RootState, string>(state =>
            getUserNumber(state)
        );

        const getIsUserEditing = makeGetIsUserEditing(userId);
        const isEditing = useSelector<RootState, boolean>(state =>
            getIsUserEditing(state)
        );

        const sessionSchedulePermitted = useRequirePermissions([
            'update:session',
            'create:session',
            user && user.__t === UserType.Prospect
                ? 'update:prospect'
                : 'update:participant'
        ]);

        const callMakeParticipantById = useCallback(
            (payload: IMakeParticipantByIdPayload) =>
                dispatch(makeParticipantByIdAsync.request(payload)),
            [dispatch]
        );

        const callCloseUserById = useCallback(
            (payload: ICloseUserByIdPayload) =>
                dispatch(closeUserByIdAsync.request(payload)),
            [dispatch]
        );

        const callGetUserNumber = useCallback(
            (payload: IGetUserNumberPayload) =>
                dispatch(getUserNumberAsync.request(payload)),
            [dispatch]
        );

        const callToggleEditUser = useCallback(
            () =>
                dispatch(
                    toggleEditUser({
                        userId
                    })
                ),
            [dispatch, userId]
        );

        const callCancelAddUser = useCallback(() => dispatch(cancelAddUser()), [
            dispatch
        ]);

        const handleMeetNow = () => {
            setMeetNow(!isMeetNow);
        };

        const handleCloseProspect = () => {
            const modal = showModal(UserOutcomeConfirmModal, {
                title: 'Select Ineligibility Reason',
                isParticipant: user.__t === UserType.Participant,
                onSubmit: (outcome: IneligibilityReason | WithdrawnReason) => {
                    callCloseUserById({
                        userId,
                        outcome
                    });
                    modal.hide();
                },
                onCancel: () => modal.hide()
            } as IUserOutcomeConfirmModalProps);
        };

        const handleCloseParticipant = () => {
            const modal = showModal(UserOutcomeConfirmModal, {
                title: 'Select Withdrawn Reason',
                isParticipant: user.__t === UserType.Participant,
                onSubmit: (outcome: IneligibilityReason | WithdrawnReason) => {
                    callCloseUserById({
                        userId,
                        outcome
                    });
                    modal.hide();
                },
                onCancel: () => modal.hide()
            } as IUserOutcomeConfirmModalProps);
        };

        const handleMakeParticipant = () => {
            const modal = showModal(ConfirmModal, {
                title: 'Make User A Screened Participant?',
                onSubmit: () => {
                    callMakeParticipantById({
                        userId
                    });
                    modal.hide();
                },
                onCancel: () => modal.hide()
            } as IConfirmModalProps);
        };

        const handleAssignToClass = () => {
            const modal = showModal(UserAssignToClassModal, {
                title: 'Assign to Class',
                submitText: 'Assign',
                userId,
                onSubmit: () => {
                    console.log('Assigned');
                    modal.hide();
                },
                onCancel: () => modal.hide()
            } as IUserAssignToClassModalProps);
        };

        const handleFormCancel = useCallback(() => {
            if (isEditing) {
                callToggleEditUser();
            } else {
                callCancelAddUser();
            }
        }, [dispatch, isEditing]);

        useEffect(() => {
            if (!userNumber) {
                callGetUserNumber({
                    id: userId
                });
            }
        }, [userId]);

        return (
            <TableRow>
                <TableCell colSpan={colSpan}>
                    <Box px={1}>
                        {user && user._id && !isEditing && (
                            <>
                                <Grid container spacing={2}>
                                    <Grid item xs={3}>
                                        <UserDetailsDisplay
                                            userId={user.userId}
                                            editable={true}
                                        />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <UserCaregiverDetailsDisplay
                                            userId={user.userId}
                                            editable={true}
                                        />
                                    </Grid>
                                    <RequirePermissions
                                        perms={['query:session']}
                                    >
                                        <Grid item xs={3}>
                                            <UserScheduleDisplay
                                                userId={user.userId}
                                            />
                                        </Grid>
                                    </RequirePermissions>

                                    <Grid item xs={3}>
                                        {user.state === UserState.Assigned && (
                                            <Box mb={5}>
                                                <UserClassDisplay
                                                    userId={user.userId}
                                                />
                                            </Box>
                                        )}
                                        {user.__t === UserType.Prospect && (
                                            <RequirePermissions
                                                perms={['update:prospect']}
                                            >
                                                <Box mb={5}>
                                                    <label
                                                        className={
                                                            classes.sectionHeader
                                                        }
                                                    >
                                                        <span>Actions</span>
                                                    </label>

                                                    <Grid container>
                                                        <>
                                                            <Box mr={2}>
                                                                <Button
                                                                    variant="contained"
                                                                    color="secondary"
                                                                    size="small"
                                                                    onClick={
                                                                        handleCloseProspect
                                                                    }
                                                                >
                                                                    Hold
                                                                </Button>
                                                            </Box>

                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                size="small"
                                                                onClick={
                                                                    handleMakeParticipant
                                                                }
                                                            >
                                                                Screened
                                                                Participant
                                                            </Button>
                                                        </>
                                                    </Grid>
                                                </Box>
                                            </RequirePermissions>
                                        )}
                                        {user.__t === UserType.Participant && (
                                            <RequirePermissions
                                                perms={['update:participant']}
                                            >
                                                <Box mb={5}>
                                                    <label
                                                        className={
                                                            classes.sectionHeader
                                                        }
                                                    >
                                                        <span>Actions</span>
                                                    </label>

                                                    <Grid container>
                                                        <>
                                                            <Box mr={2}>
                                                                <Button
                                                                    variant="contained"
                                                                    color="secondary"
                                                                    size="small"
                                                                    onClick={
                                                                        handleCloseParticipant
                                                                    }
                                                                >
                                                                    Hold
                                                                </Button>
                                                            </Box>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                size="small"
                                                                onClick={
                                                                    handleAssignToClass
                                                                }
                                                            >
                                                                Assign to Class
                                                            </Button>
                                                        </>
                                                    </Grid>
                                                </Box>
                                            </RequirePermissions>
                                        )}
                                        <Box>
                                            <label
                                                className={
                                                    classes.sectionHeader
                                                }
                                            >
                                                <span>Testing</span>
                                            </label>

                                            <Grid
                                                container
                                                className={
                                                    classes.testingSection
                                                }
                                            >
                                                {user && (
                                                    <ListItem disableGutters>
                                                        <UserRTCLink
                                                            email={user.email}
                                                            userId={user.userId}
                                                        />
                                                    </ListItem>
                                                )}
                                                {userNumber && (
                                                    <ListItem disableGutters>
                                                        <strong>
                                                            User Number:{' '}
                                                        </strong>
                                                        <Box pl={1}>
                                                            {userNumber}
                                                        </Box>
                                                    </ListItem>
                                                )}
                                            </Grid>
                                        </Box>
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2}>
                                    <Grid item xs={3}>
                                        <UserEmergencyDetailsDisplay
                                            userId={user.userId}
                                            editable={true}
                                        />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <UserMiscDetailsDisplay
                                            userId={user.userId}
                                            editable={true}
                                        />
                                    </Grid>
                                </Grid>

                                {sessionSchedulePermitted &&
                                    !sessionSchedulePermitted.loading &&
                                    sessionSchedulePermitted.permitted && (
                                        <Box pt={4}>
                                            <Box
                                                className={
                                                    classes.sectionHeader
                                                }
                                            >
                                                <label>New Session</label>
                                                <Chip
                                                    label="Meet Now"
                                                    color={
                                                        isMeetNow
                                                            ? 'primary'
                                                            : 'default'
                                                    }
                                                    clickable
                                                    size="small"
                                                    deleteIcon={<DoneIcon />}
                                                    onClick={handleMeetNow}
                                                    onDelete={handleMeetNow}
                                                />
                                            </Box>

                                            <SessionSchedule
                                                userId={user.userId}
                                                buttonText={
                                                    isMeetNow
                                                        ? 'Start Now'
                                                        : 'Schedule'
                                                }
                                                buttonBackground={
                                                    theme.palette.success.main
                                                }
                                                isMeetNow={isMeetNow}
                                            />
                                        </Box>
                                    )}
                            </>
                        )}

                        {(!user || !user._id || isEditing) && (
                            <UserForm
                                userToUpsert={user}
                                userType={
                                    (user && user.__t) || UserType.Prospect
                                }
                                onCancel={handleFormCancel}
                            />
                        )}
                    </Box>
                </TableCell>
            </TableRow>
        );
    }
);

export interface IUserListingTableProps {
    userType: UserType;
    userState: UserState;
}

const UserListingTable: React.FC<IUserListingTableProps> = React.memo(props => {
    const { userType, userState } = props;
    const dispatch = useDispatch();

    const programs = useSelector<RootState, IProgram[]>(state =>
        getMyPrograms(state)
    );

    const selectedProgram = useSelector<RootState, string>(
        state => state.global.selectedProgram
    );

    const getUsersCollection = makeGetUserCollectionByState(
        userType,
        userState,
        selectedProgram
    );
    const userCollection = useSelector<
        RootState,
        IAVUserCollectionDTO | undefined
    >(state => getUsersCollection(state));

    const newUser = useSelector<RootState, IAVUser>(state => state.users.add);
    const isLoadingUsers = useSelector<RootState, boolean>(
        state => state.users.loading
    );

    const isAdding = _.get(newUser, 'isNew');

    let userRows = [];

    if (userCollection) {
        userRows = isAdding
            ? [newUser].concat(Object.values(userCollection) as IAVUser[])
            : (Object.values(userCollection) as IAVUser[]);

        userRows = userRows.map(user => {
            const program = programs.find(
                program => program.acronym === user.program
            );
            return {
                ...user,
                program: program ? program.shortName : user.program
            };
        });
    }

    const callGetAllUsers = useCallback(() => {
        if (selectedProgram) {
            return dispatch(
                getAllUsersAsync.request({
                    program: selectedProgram,
                    userType,
                    userState
                })
            );
        }
    }, [dispatch, selectedProgram, userType, userState]);

    const callGetMyPrograms = useCallback(
        () => dispatch(getMyProgramsAsync.request({})),
        [dispatch]
    );

    // TODO: move this into user form
    const handleAddClick = useCallback(() => {
        dispatch(addUser());
    }, [dispatch]);

    useEffect(() => {
        callGetAllUsers();

        if (!programs) {
            callGetMyPrograms();
        }
    }, [callGetAllUsers, callGetMyPrograms]);

    const columns: MUIDataTableColumnDef[] = [
        {
            label: 'Id',
            name: 'userId',
            options: {
                display: false,
                filter: false,
                searchable: false,
                viewColumns: false
            }
        },
        {
            label: 'Created On',
            name: 'createdOn',
            options: {
                display: false,
                filter: false,
                searchable: false,
                viewColumns: false
            }
        },
        {
            label: 'Screener Id',
            name: 'sid',
            options: {
                filter: false,
                searchable: true,
                viewColumns: true
            }
        },
        {
            label: 'Participant Id',
            name: 'pidn',
            options: {
                filter: false,
                searchable: true,
                viewColumns: true
            }
        },
        {
            label: 'Screen Name',
            name: 'screenName',
            options: {
                filter: false,
                searchable: true
            }
        },
        {
            label: 'First Name',
            name: 'firstName',
            options: {
                filter: false,
                searchable: true
            }
        },
        {
            label: 'Last Name',
            name: 'lastName',
            options: {
                filter: false,
                searchable: true
            }
        },
        {
            label: 'Caregiver First Name',
            name: 'caregiverFirstName',
            options: {
                filter: false,
                searchable: true
            }
        },
        {
            label: 'Caregiver Last Name',
            name: 'caregiverLastName',
            options: {
                filter: false,
                searchable: true
            }
        },
        {
            label: 'Program',
            name: 'program',
            options: {
                searchable: false,
                filter: false
            }
        },
        {
            label: ' ',
            name: 'actions',
            options: {
                filter: false,
                sort: false,
                empty: true,
                viewColumns: false,
                customBodyRender: (value, tableMeta) => {
                    return <></>;
                }
            }
        }
    ];

    const options: MUIDataTableOptions = {
        filter: false,
        page: isAdding ? 0 : undefined,
        selectableRows: 'none',
        sortOrder: isAdding
            ? {
                  name: 'createdOn',
                  direction: 'asc'
              }
            : {
                  name: 'createdOn',
                  direction: 'desc'
              },
        rowsExpanded: isAdding ? [0] : [],
        expandableRows: true,
        expandableRowsHeader: false,
        renderExpandableRow: (rows, meta) => {
            const colSpan = rows.length + 1;
            const userId = rows[0]; // user id column
            return <ExpandableRow userId={userId} colSpan={colSpan} />;
        },
        customToolbar: () => {
            return (
                <>
                    {userType === UserType.Prospect && (
                        <RequirePermissions perms={['create:prospect']}>
                            <Tooltip
                                title={`Add Prospect`}
                                onClick={handleAddClick}
                            >
                                <IconButton>
                                    <AddIcon />
                                </IconButton>
                            </Tooltip>
                        </RequirePermissions>
                    )}
                </>
            );
        }
    };

    if (isAdding) {
        options.searchText = '';
        options.searchOpen = false;
    }
    return (
        <>
            {!isLoadingUsers && userRows && (
                <MUIDataTable
                    title={
                        userType === UserType.Prospect
                            ? 'Prospects'
                            : 'Participants'
                    }
                    data={userRows}
                    columns={columns}
                    options={options}
                />
            )}
            {isLoadingUsers && (
                <Paper>
                    <Box
                        display="flex"
                        height="400px"
                        width={1}
                        justifyContent="center"
                        alignItems="center"
                    >
                        <CircularProgress />
                    </Box>
                </Paper>
            )}
        </>
    );
});

export default UserListingTable;
