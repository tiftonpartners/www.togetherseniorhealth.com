import React, { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createSelector } from 'reselect';
import {
    Box,
    Checkbox,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    ListItemText,
    makeStyles,
    MenuItem,
    Paper,
    Select,
    TableCell,
    TableRow,
    Typography
} from '@material-ui/core';
import { Selector, useDispatch, useSelector } from 'react-redux';
import { getMyPrograms } from 'store/programs/selectors';
import { RootState } from 'typesafe-actions';
import {
    getAllAdHocSessionsAsync,
    getMyAdHocSessionsAsync
} from 'store/sessions/actions';
import MUIDataTable, {
    MUIDataTableColumnDef,
    MUIDataTableOptions
} from 'mui-datatables';
import moment, { Moment } from 'moment-timezone';
import _ from 'lodash';
import ToggleChip from '../General/toggle-chip';
import {
    AdHocSessionType,
    adHocSessionTypes,
    IAdHocSession,
    IAdHocSessionsCollectionDTO,
    SessionType
} from 'types/session';
import SessionSchedule from './session-schedule';
import theme from 'containers/themes/theme';
import { getAuth0UsersByRoleAsync } from 'store/auth0Users/actions';
import { IAuth0User } from 'types/auth0';
import Auth0NameDisplayByRole from './auth0-name-display-by-role';
import UserDetailsDisplay from 'tsh-components/User/user-details-display';
import { UserType } from 'types/user';
import { IProgram } from 'types/program';
import { getMyProgramsAsync } from 'store/programs/actions';

interface IExpandableRowProps {
    userId: string;
    session: IAdHocSession;
    colspan: number;
}

const ExpandableRow: React.FC<IExpandableRowProps> = React.memo(
    (props: IExpandableRowProps) => (
        <TableRow>
            <TableCell colSpan={props.colspan}>
                <Box px={1}>
                    <UserDetailsDisplay userId={props.userId} />

                    <Box pt={4}>
                        <SessionSchedule
                            userId={props.userId}
                            buttonText="Reschedule"
                            session={props.session}
                            buttonBackground={theme.palette.success.main}
                        />
                    </Box>
                </Box>
            </TableCell>
        </TableRow>
    )
);

interface IAdhocFacilitatorsFilterProps {
    filterValue: string[];
    onOptionSelect: (value: string) => void;
}

const AdhocFacilitatorsFilter: React.FC<IAdhocFacilitatorsFilterProps> = React.memo(
    (props: IAdhocFacilitatorsFilterProps) => {
        const { filterValue, onOptionSelect } = props;
        const dispatch = useDispatch();

        const usersByRole = useSelector<RootState, string[]>(
            state => state.auth0Users.byRole['adhocFacilitators']
        );

        const adhocFacilitators = useSelector<RootState, IAuth0User[]>(
            state => {
                return usersByRole
                    ? usersByRole.map(userId =>
                          _.get(state.auth0Users.collection, userId)
                      )
                    : [];
            }
        );

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
        }, [callGetUsersByRole]);

        return (
            <>
                {adhocFacilitators && adhocFacilitators.length > 0 && (
                    <FormControl>
                        <InputLabel>Meeting Facilitator</InputLabel>
                        <Select
                            value={filterValue}
                            onChange={event => {
                                onOptionSelect(event.target.value as string);
                            }}
                        >
                            <MenuItem key="All" value="">
                                All
                            </MenuItem>
                            {adhocFacilitators.map(item => (
                                <MenuItem key={item.name} value={item.user_id}>
                                    {item.name}
                                </MenuItem>
                            ))}{' '}
                        </Select>
                    </FormControl>
                )}
            </>
        );
    }
);

export interface IAdHocSessionTableProps {
    userId?: string;
    fromDate?: string;
    toDate?: string;
}

const useStyles = makeStyles(theme => ({
    presetDayWrappr: {
        alignItems: 'center',
        display: 'flex',
        flex: 1
    },
    presetDayChip: {
        display: 'inline-flex',
        marginRight: theme.spacing(1)
    }
}));

const getAdHocSessionCollection: Selector<
    RootState,
    IAdHocSessionsCollectionDTO
> = state => state.sessions.collection;
const getMyAdHocSessions: Selector<RootState, string[]> = state =>
    state.sessions.my;
const getCurrentAdHocSessions: Selector<RootState, string[]> = state =>
    state.sessions.current;

const makeGetAdHocSessionsCollection = (userId: string) => {
    return createSelector<
        RootState,
        IAdHocSessionsCollectionDTO,
        string[],
        string[],
        IAdHocSessionsCollectionDTO
    >(
        [
            getAdHocSessionCollection,
            getMyAdHocSessions,
            getCurrentAdHocSessions
        ],
        (collection, myAdHocSessions, currentAdHocSessions) => {
            const keys = userId ? myAdHocSessions : currentAdHocSessions;
            return Object.keys(collection).reduce((result, key) => {
                if (keys.indexOf(key) > -1) {
                    result[key] = collection[key];
                }
                return result;
            }, {});
        }
    );
};

const AdHocSessionTable: React.FC<IAdHocSessionTableProps> = React.memo(
    (props: IAdHocSessionTableProps) => {
        const { userId, fromDate, toDate } = props;

        const classes = useStyles();
        const dispatch = useDispatch();

        const selectedProgram = useSelector<RootState, string>(
            state => state.global.selectedProgram
        );

        const programs = useSelector<RootState, IProgram[]>(state =>
            getMyPrograms(state)
        );

        const isLoading = useSelector<RootState, boolean>(
            state => state.sessions.loading
        );

        const getAdHocSessionsCollection = makeGetAdHocSessionsCollection(
            userId
        );
        const adHocSessionsCollection = useSelector<
            RootState,
            IAdHocSessionsCollectionDTO
        >(state => getAdHocSessionsCollection(state));

        const [presetDays, setPresetDays] = useState(0);

        const fromDateFinal = !fromDate
            ? moment()
                  .startOf('day')
                  .toISOString()
            : fromDate;

        const toDateFinal = !toDate
            ? Number.isInteger(presetDays)
                ? moment()
                      .endOf('day')
                      .add(presetDays, 'days')
                      .toISOString()
                : undefined
            : toDate;

        const callGetAllAdHocSessions = useCallback(() => {
            if (selectedProgram) {
                dispatch(
                    getAllAdHocSessionsAsync.request({
                        start: fromDateFinal,
                        end: toDateFinal,
                        program: selectedProgram
                    })
                );
            }
        }, [dispatch, toDateFinal, fromDateFinal, selectedProgram]);

        const callGetMyAdHocSessions = useCallback(() => {
            if (selectedProgram) {
                return dispatch(
                    getMyAdHocSessionsAsync.request({
                        userId,
                        start: fromDateFinal,
                        end: toDateFinal,
                        program: selectedProgram
                    })
                );
            }
        }, [dispatch, toDateFinal, fromDateFinal, userId, selectedProgram]);

        const callGetMyPrograms = useCallback(
            () => dispatch(getMyProgramsAsync.request({})),
            [dispatch]
        );

        useEffect(() => {
            if (userId) {
                callGetMyAdHocSessions();
            } else {
                callGetAllAdHocSessions();
            }
        }, [callGetAllAdHocSessions]);

        useEffect(() => {
            if (!programs) {
                callGetMyPrograms();
            }
        }, [callGetMyPrograms]);

        const handlePresetDaysSelect = (days: number) => {
            setPresetDays(days);
        };

        const sessionRows = Object.values(adHocSessionsCollection).map(
            (session: IAdHocSession) => {
                const program = programs.find(
                    program => program.acronym === session.program
                );
                return {
                    ...session,
                    program: program ? program.shortName : session.program
                };
            }
        );

        const columns: MUIDataTableColumnDef[] = [
            {
                label: 'Id',
                name: '_id',
                options: {
                    display: false,
                    filter: false,
                    searchable: false,
                    viewColumns: false
                }
            },
            {
                label: 'Start Time',
                name: 'dateDisplay',
                options: {
                    filter: false,
                    searchable: true,
                    sortCompare: order => {
                        return (obj1, obj2) => {
                            let val1 = moment(obj1.data);
                            let val2 = moment(obj2.data);
                            return (
                                (val1.valueOf() - val2.valueOf()) *
                                (order === 'asc' ? 1 : -1)
                            );
                        };
                    }
                }
            },
            {
                label: 'Session Type',
                name: 'sessionType',
                options: {
                    searchable: false,
                    customBodyRender: value => {
                        return value ? (
                            <>{adHocSessionTypes.get(value)}</>
                        ) : (
                            <></>
                        );
                    },
                    filter: true,
                    filterType: 'custom',
                    customFilterListOptions: {
                        render: (value: string[]) => {
                            return adHocSessionTypes.get(
                                value[0] as AdHocSessionType
                            );
                        }
                    },
                    filterOptions: {
                        logic: (prop, filters) => {
                            if (filters.length) return !filters.includes(prop);
                            return false;
                        },
                        display: (filterList, onChange, index, column) => {
                            const sessionTypes = Array.from(
                                adHocSessionTypes.keys()
                            );
                            return (
                                <FormControl>
                                    <InputLabel>Session Type</InputLabel>
                                    <Select
                                        value={filterList[index]}
                                        onChange={event => {
                                            filterList[index] = [
                                                event.target.value
                                            ] as string[];
                                            onChange(
                                                filterList[index],
                                                index,
                                                column
                                            );
                                        }}
                                    >
                                        <MenuItem key="All" value="">
                                            All
                                        </MenuItem>
                                        {sessionTypes.map(key => (
                                            <MenuItem key={key} value={key}>
                                                {adHocSessionTypes.get(key)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            );
                        }
                    }
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
                label: 'Meeting Facilitator',
                name: 'instructorId',
                options: {
                    searchable: false,
                    customBodyRender: value => {
                        return value ? (
                            <Auth0NameDisplayByRole
                                role="adhocFacilitators"
                                authId={value}
                            />
                        ) : (
                            <></>
                        );
                    },

                    customFilterListOptions: {
                        render: value => {
                            return value ? (
                                <Auth0NameDisplayByRole
                                    role="adhocFacilitators"
                                    authId={value}
                                />
                            ) : (
                                <></>
                            );
                        }
                    },
                    filter: true,
                    filterType: 'custom',
                    filterOptions: {
                        logic: (prop, filters) => {
                            if (filters.length) return !filters.includes(prop);
                            return false;
                        },
                        display: (filterList, onChange, index, column) => {
                            const onOptionSelect = (value: string) => {
                                filterList[index] = [value] as string[];

                                onChange(filterList[index], index, column);
                            };
                            return (
                                <AdhocFacilitatorsFilter
                                    filterValue={filterList[index]}
                                    onOptionSelect={onOptionSelect}
                                />
                            );
                        }
                    }
                }
            }
        ];

        const options: MUIDataTableOptions = {
            selectableRows: 'none',
            expandableRows: true,
            expandableRowsHeader: false,
            renderExpandableRow: (rows, meta) => {
                const colspan = rows.length + 1;
                const row = rows[0]; // id column
                const session = _.get(
                    adHocSessionsCollection,
                    row
                ) as IAdHocSession;
                return (
                    <ExpandableRow
                        userId={session.participants[0]}
                        session={session}
                        colspan={colspan}
                    />
                );
            },
            sortOrder: {
                name: 'scheduledStartTime',
                direction: 'asc'
            }
        };

        const datePresetFilters = [
            {
                label: 'Today',
                days: 0
            },
            {
                label: 'Next 30 Days',
                days: 30
            },
            {
                label: 'All',
                days: 999
            }
        ];

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
                        title={
                            <Grid container spacing={3}>
                                <Grid item>
                                    <Typography variant="h6">
                                        Ad Hoc Sessions
                                    </Typography>
                                </Grid>
                                <Grid item className={classes.presetDayWrappr}>
                                    {datePresetFilters.map(preset => (
                                        <Box
                                            key={`preset-${preset.days}`}
                                            className={classes.presetDayChip}
                                        >
                                            <ToggleChip
                                                id={preset.days}
                                                displayValue={preset.label}
                                                active={
                                                    presetDays === preset.days
                                                }
                                                onChipClicked={
                                                    handlePresetDaysSelect
                                                }
                                            />
                                        </Box>
                                    ))}
                                </Grid>
                            </Grid>
                        }
                        data={sessionRows}
                        columns={columns}
                        options={options}
                    />
                )}
            </>
        );
    }
);

export default AdHocSessionTable;
