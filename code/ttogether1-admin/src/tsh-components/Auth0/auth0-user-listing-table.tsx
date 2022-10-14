import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Grid,
    IconButton,
    makeStyles,
    Paper,
    TableCell,
    TableRow
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { useDispatch, useSelector } from 'react-redux';
import { useModal } from 'util/modals';
import { RootState } from 'typesafe-actions';
import { IAuth0User, IAuth0UserCollectionDTO } from 'types/auth0';
import { getAllPrograms } from 'store/programs/selectors';
import { getAllRoles, makeGetRolesForUser } from 'store/auth0Users/selectors';
import { flatten } from 'helpers';
import MUIDataTable, {
    MUIDataTableColumnDef,
    MUIDataTableOptions
} from 'mui-datatables';
import Auth0UserListingEditModal, {
    IAuth0UserListingEditModalProps
} from './auth0-user-edit-modal';
import RequirePermissions from 'util/RequirePermissions';
import { IProgram } from 'types/program';
import { getAllProgramsAsync } from 'store/programs/actions';
import {
    getAllAuth0RolesAsync,
    getAllAuth0UsersAsync,
    getAuth0RolesByUserAsync,
    IUpdateAuth0UserPayload,
    IUpdateAuth0UserRolesPayload,
    updateAuth0UserAsync,
    updateAuth0UserRolesAsync
} from 'store/auth0Users/actions';
import _ from 'lodash';
import ToggleChip from 'tsh-components/General/toggle-chip';
import { Role } from 'auth0';
import useRequirePermissions from 'util/hooks/useRequirePermissions';

interface IExpandableRowProps {
    userId: string;
    colSpan: number;
    programsAssigned: string[];
    onFormCancel?: () => void;
    onFormSubmit?: () => void;
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
    chip: {
        marginBottom: theme.spacing(1),
        marginRight: theme.spacing(1)
    }
}));

const ExpandableRow: React.FC<IExpandableRowProps> = React.memo(
    (props: IExpandableRowProps) => {
        const { userId, colSpan } = props;
        const dispatch = useDispatch();
        const classes = useStyles();
        const rolePermitted = useRequirePermissions(['query:role']);

        const programPermitted = useRequirePermissions(['query:program']);

        const programs = useSelector<RootState, IProgram[] | undefined>(state =>
            getAllPrograms(state)
        );

        const roles = useSelector<RootState, Role[] | undefined>(state =>
            getAllRoles(state)
        );

        const getRolesForUser = useMemo(() => makeGetRolesForUser(userId), [
            userId
        ]);
        const rolesForUser = useSelector<RootState, Role[] | undefined>(state =>
            getRolesForUser(state)
        );

        const [programsAssigned, setProgramsAssigned] = useState<string[]>(
            props.programsAssigned || []
        );

        const [rolesAssigned, setRolesAssigned] = useState<string[]>(
            rolesForUser ? rolesForUser.map(role => role.id) : []
        );

        const callGetAllPrograms = useCallback(
            () => dispatch(getAllProgramsAsync.request({})),
            [dispatch]
        );

        const callGetAllRoles = useCallback(
            () => dispatch(getAllAuth0RolesAsync.request()),
            [dispatch]
        );

        const callGetRolesForUser = useCallback(
            () =>
                dispatch(
                    getAuth0RolesByUserAsync.request({
                        userId
                    })
                ),
            [dispatch]
        );

        const callUpdateAuth0User = useCallback(
            (payload: IUpdateAuth0UserPayload) =>
                dispatch(updateAuth0UserAsync.request(payload)),
            [dispatch]
        );

        const callUpdateAuth0UserRoles = useCallback(
            (payload: IUpdateAuth0UserRolesPayload) =>
                dispatch(updateAuth0UserRolesAsync.request(payload)),
            [dispatch]
        );

        useEffect(() => {
            if (rolePermitted.permitted && !rolePermitted.loading) {
                if (!rolesForUser) {
                    callGetRolesForUser();
                }

                if (!roles) {
                    callGetAllRoles();
                }
            }
        }, [callGetRolesForUser, callGetAllRoles, rolePermitted]);

        useEffect(() => {
            if (
                programPermitted.permitted &&
                !programPermitted.loading &&
                !programs
            ) {
                callGetAllPrograms();
            }
        }, [callGetAllPrograms, programPermitted]);

        useEffect(() => {
            if (
                programs &&
                (props.programsAssigned.includes('*') ||
                    (programs.length > 0 &&
                        programs.length == props.programsAssigned.length))
            ) {
                setProgramsAssigned(programs.map(program => program.acronym));
            }
        }, [programs]);

        useEffect(() => {
            if (rolesForUser && rolesForUser.length > 0) {
                setRolesAssigned(rolesForUser.map(role => role.id));
            }
        }, [rolesForUser]);

        const handleProgramToggle = (acronym: string) => {
            if (acronym === 'All') {
                if (programsAssigned.length === programs.length) {
                    setProgramsAssigned([]);
                } else {
                    setProgramsAssigned(
                        programs.map(program => program.acronym)
                    );
                }
            } else {
                const arr = programsAssigned.includes(acronym)
                    ? programsAssigned.filter(i => i !== acronym) // remove item
                    : [...programsAssigned, acronym]; // add item
                setProgramsAssigned(arr);
            }
        };

        const handleRoleToggle = (role: string) => {
            const arr = rolesAssigned.includes(role)
                ? rolesAssigned.filter(i => i !== role) // remove item
                : [...rolesAssigned, role]; // add item
            setRolesAssigned(arr);
        };

        const handleSubmit = event => {
            event.preventDefault();
            callUpdateAuth0User({
                userId,
                user: {
                    app_metadata: {
                        programs: programsAssigned.join(',')
                    }
                }
            });
            callUpdateAuth0UserRoles({
                userId,
                roles: rolesAssigned
            });
        };

        return (
            <TableRow>
                <TableCell colSpan={colSpan}>
                    <form noValidate onSubmit={handleSubmit}>
                        <Grid container>
                            {programs && programs.length > 0 && (
                                <Grid item xs={4}>
                                    <Box pr={1}>
                                        <label
                                            className={classes.sectionHeader}
                                        >
                                            <span>Programs</span>
                                        </label>
                                        <Grid container>
                                            {programs.map((program, i) => (
                                                <Box
                                                    key={program.acronym}
                                                    className={classes.chip}
                                                >
                                                    <ToggleChip
                                                        id={program.acronym}
                                                        displayValue={
                                                            program.shortName
                                                        }
                                                        active={
                                                            programsAssigned.indexOf(
                                                                program.acronym
                                                            ) > -1
                                                        }
                                                        onChipClicked={
                                                            handleProgramToggle
                                                        }
                                                    />
                                                </Box>
                                            ))}

                                            <Box
                                                key="All"
                                                className={classes.chip}
                                            >
                                                <ToggleChip
                                                    id="All"
                                                    displayValue="All"
                                                    active={
                                                        programsAssigned.length ===
                                                        programs.length
                                                    }
                                                    onChipClicked={
                                                        handleProgramToggle
                                                    }
                                                />
                                            </Box>
                                        </Grid>
                                    </Box>
                                </Grid>
                            )}
                            {roles && roles.length > 0 && (
                                <Grid item xs={4}>
                                    <Box pr={1}>
                                        <label
                                            className={classes.sectionHeader}
                                        >
                                            <span>Roles</span>
                                        </label>
                                        <Grid container>
                                            {roles.map((role, i) => (
                                                <Box
                                                    key={role.id}
                                                    className={classes.chip}
                                                >
                                                    <ToggleChip
                                                        id={role.id}
                                                        displayValue={role.name}
                                                        active={
                                                            rolesAssigned.indexOf(
                                                                role.id
                                                            ) > -1
                                                        }
                                                        onChipClicked={
                                                            handleRoleToggle
                                                        }
                                                    />
                                                </Box>
                                            ))}
                                        </Grid>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                        <Grid container spacing={2} justifyContent="flex-end">
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                >
                                    Save
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </TableCell>
            </TableRow>
        );
    }
);

const Auth0UserListingTable: React.FC = React.memo(() => {
    const dispatch = useDispatch();
    const { showModal } = useModal();

    const auth0UserCollection = useSelector<RootState, IAuth0UserCollectionDTO>(
        state => state.auth0Users.collection
    );
    const userRows = (Object.values(
        auth0UserCollection
    ) as IAuth0User[]).map(user => flatten(user));

    const isLoading = useSelector<RootState, boolean>(
        state => state.auth0Users.loading
    );

    const callGetAllAuth0Users = useCallback(
        () => dispatch(getAllAuth0UsersAsync.request()),
        [dispatch]
    );

    const editUser = React.useCallback(
        (userId: string) => {
            const modal = showModal(Auth0UserListingEditModal, {
                userToEdit: auth0UserCollection[userId],
                onSubmit: () => modal.hide(),
                onCancel: () => modal.hide()
            } as IAuth0UserListingEditModalProps);
        },
        [auth0UserCollection, showModal]
    );

    useEffect(() => {
        if (!userRows || userRows.length == 0) {
            callGetAllAuth0Users();
        }
    }, [callGetAllAuth0Users]);

    const columns: MUIDataTableColumnDef[] = [
        {
            label: 'User ID',
            name: 'user_id',
            options: {
                searchable: true,
                viewColumns: false
            }
        },
        {
            label: 'User Number',
            name: 'userNumber',
            options: {
                searchable: true,
                viewColumns: false
            }
        },
        {
            label: 'Name',
            name: 'name',
            options: {
                searchable: true
            }
        },
        {
            label: 'Username',
            name: 'username',
            options: {
                searchable: true
            }
        },
        {
            label: 'Nickname',
            name: 'nickname',
            options: {
                searchable: true
            }
        },
        {
            label: 'Email',
            name: 'email',
            options: {
                searchable: true
            }
        },
        {
            label: ' ',
            name: 'actions',
            options: {
                sort: false,
                empty: true,
                viewColumns: false,
                customBodyRender: (value, tableMeta) => {
                    const handleEditClick = () => {
                        editUser(tableMeta.rowData[0]);
                    };
                    return (
                        <RequirePermissions perms={['update:user']}>
                            {/* <IconButton aria-label="Delete user">
								<DeleteIcon />
							</IconButton> */}
                            <IconButton
                                aria-label="Edit user"
                                onClick={handleEditClick}
                            >
                                <EditIcon />
                            </IconButton>
                        </RequirePermissions>
                    );
                }
            }
        }
    ];

    const options: MUIDataTableOptions = {
        filter: false,
        selectableRows: 'none',
        expandableRows: true,
        expandableRowsHeader: false,
        renderExpandableRow: (rows, meta) => {
            const colSpan = rows.length;
            const userId = rows[0]; // user id column
            const user = _.get(auth0UserCollection, userId);
            return (
                <ExpandableRow
                    userId={userId}
                    colSpan={colSpan}
                    programsAssigned={
                        user && user.app_metadata
                            ? Array.isArray(user.app_metadata.programs)
                                ? user.app_metadata.programs
                                : user.app_metadata.programs.split(',')
                            : []
                    }
                />
            );
        }
    };
    return (
        <>
            {isLoading && (
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
            {!isLoading && (
                <MUIDataTable
                    title={'Auth0 Users'}
                    data={userRows}
                    columns={columns}
                    options={options}
                />
            )}
        </>
    );
});

export default Auth0UserListingTable;
