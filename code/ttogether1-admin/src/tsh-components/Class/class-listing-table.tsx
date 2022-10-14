import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import MUIDataTable, {
    MUIDataTableColumnDef,
    MUIDataTableOptions
} from 'mui-datatables';
import { IClass, Schedule } from 'types/class';
import {
    deleteClassByIdAsync,
    getClassesByCourseAcronymAsync
} from 'store/classes/actions';
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Paper,
    TableCell,
    TableRow,
    Tooltip
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { useRouter } from 'next/router';
import { useModal } from 'util/modals';
import DeleteIcon from '@material-ui/icons/Delete';
import ClassUpsertModal, { IClassUpsertModalProps } from './class-upsert-modal';
import moment from 'moment-timezone';
import { makeGetClass, makeGetClassesByCourse } from 'store/classes/selectors';
import ClassSessionScheduleForm from './class-sessions-schedule-form';
import _ from 'lodash';
import { getMyProgramsAsync } from 'store/programs/actions';
import { getMyPrograms } from 'store/programs/selectors';
import ClassDisplay from './class-display';
import RequirePermissions from 'util/RequirePermissions';
import { IProgram } from 'types/program';

interface IExpandableRowProps {
    classId: string;
    courseAcronym: string;
    colSpan: number;
    onFormCancel?: () => void;
    onFormSubmit?: () => void;
}

const ExpandableRow: React.FC<IExpandableRowProps> = React.memo(
    (props: IExpandableRowProps) => {
        const {
            classId,
            courseAcronym,
            colSpan,
            onFormCancel,
            onFormSubmit
        } = props;

        const getClass = makeGetClass(classId);
        const klass = useSelector<RootState, IClass>(state => getClass(state));
        const hasSessions =
            klass && klass.sessions && klass.sessions.length > 0;

        return (
            <>
                {klass && (
                    <TableRow>
                        <TableCell colSpan={colSpan}>
                            <Box px={1}>
                                <ClassDisplay
                                    classId={klass._id}
                                    courseAcronym={courseAcronym}
                                />
                                {!hasSessions && (
                                    <Box mt={2}>
                                        <RequirePermissions
                                            perms={[
                                                'create:session',
                                                'get:class'
                                            ]}
                                        >
                                            <ClassSessionScheduleForm
                                                classToSchedule={klass}
                                                hideCancel={true}
                                                onCancel={onFormCancel}
                                                onSubmit={onFormSubmit}
                                            />
                                        </RequirePermissions>
                                    </Box>
                                )}
                            </Box>
                        </TableCell>
                    </TableRow>
                )}
            </>
        );
    }
);

const Toolbar: React.FC<{ courseAcronym: string }> = React.memo(
    ({ courseAcronym }) => {
        const { showModal } = useModal();

        const handleAddClick = useCallback(() => {
            const modal = showModal(ClassUpsertModal, {
                courseAcronym,
                onSubmit: () => modal.hide(),
                onCancel: () => modal.hide()
            } as IClassUpsertModalProps);
        }, [showModal]);

        return (
            <RequirePermissions perms={['create:class']}>
                <Tooltip title={'Add Class'} onClick={handleAddClick}>
                    <IconButton>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </RequirePermissions>
        );
    }
);

export interface IClassListingTableProps {
    courseAcronym?: string;
}
const ClassListingTable: React.FC<IClassListingTableProps> = React.memo(
    props => {
        const dispatch = useDispatch();
        const router = useRouter();
        const [columns, setColumns] = useState<MUIDataTableColumnDef[]>(
            undefined
        );
        const [options, setOptions] = useState<MUIDataTableOptions>(undefined);

        const { courseAcronym } = props;

        const getClassesByCourse = makeGetClassesByCourse(courseAcronym);
        const classes = useSelector<RootState, IClass[]>(state =>
            getClassesByCourse(state)
        );

        const isLoading = useSelector<RootState, boolean>(
            state => state.classes.loading
        );

        const programs = useSelector<RootState, IProgram[]>(state =>
            getMyPrograms(state)
        );

        const classRows = classes.map(klass => {
            let status: string = 'Open';
            let now = moment();
            if (klass.sessions && klass.sessions.length > 0) {
                let lastSession = klass.sessions[klass.sessions.length - 1];

                if (
                    now.isAfter(moment(klass.startDate0Z)) &&
                    now.isBefore(moment(lastSession.date0Z))
                ) {
                    status = 'In Progress';
                } else if (now.isAfter(moment(lastSession.date0Z))) {
                    status = 'Completed';
                } else {
                    status = 'Scheduled';
                }
            }

            klass.status = status;
            klass.instructorNickname = _.get(klass, 'instructorData.nickname');
            klass.filled = klass.capacity <= klass.participants.length;
            klass.participantsOf = klass.capacity
                ? `${klass.participants.length} of ${klass.capacity}`
                : '-';

            const program = programs
                ? programs.find(program => program.acronym === klass.program)
                : '';
            klass.programShortName = program
                ? program.shortName
                : klass.program;

            return klass;
        });

        const callGetMyPrograms = useCallback(
            () => dispatch(getMyProgramsAsync.request({})),
            [dispatch]
        );

        const callGetClassesByCourseAcronym = useCallback(
            (courseAcronym: string) =>
                dispatch(getClassesByCourseAcronymAsync.request(courseAcronym)),
            [dispatch]
        );

        const callDeleteClassById = useCallback(
            (classId: string) =>
                dispatch(
                    deleteClassByIdAsync.request({ classId, courseAcronym })
                ),
            [dispatch]
        );

        const navigateToSessionsPage = useCallback(
            (classAcronym: string) => {
                router.push(
                    `/curriculum/course/${courseAcronym}/class/${classAcronym}`
                );
            },
            [router]
        );

        useEffect(() => {
            if (!classes || classes.length === 0) {
                callGetClassesByCourseAcronym(courseAcronym as string);
            }
        }, [callGetClassesByCourseAcronym, courseAcronym]);

        useEffect(() => {
            if (!programs) {
                callGetMyPrograms();
            }
        }, [callGetMyPrograms]);

        useEffect(() => {
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
                    label: 'Acronym',
                    name: 'acronym',
                    options: {
                        filter: false,
                        searchable: true,
                        viewColumns: false,
                        customBodyRender: (value, tableMeta) => {
                            const handleClick = () => {
                                navigateToSessionsPage(tableMeta.rowData[1]);
                            };
                            return (
                                <Button
                                    aria-label="See sessions"
                                    onClick={handleClick}
                                >
                                    {value}
                                </Button>
                            );
                        }
                    }
                },
                {
                    label: 'Name',
                    name: 'name',
                    options: {
                        filter: false,
                        searchable: true,
                        viewColumns: false,
                        customBodyRender: (value, tableMeta) => {
                            const handleClick = () => {
                                navigateToSessionsPage(tableMeta.rowData[1]);
                            };
                            return (
                                <Button
                                    aria-label="See sessions"
                                    onClick={handleClick}
                                >
                                    {value}
                                </Button>
                            );
                        }
                    }
                },
                {
                    label: 'Program',
                    name: 'programShortName',
                    options: {
                        searchable: false,
                        filter: false
                    }
                },
                {
                    label: 'Status',
                    name: 'status',
                    options: {
                        filter: true,
                        searchable: false,
                        viewColumns: false
                    }
                },
                {
                    label: 'Number of Sessions',
                    name: 'numSessions',
                    options: {
                        filter: false,
                        searchable: false,
                        viewColumns: false
                    }
                },
                {
                    label: 'Filled',
                    name: 'filled',
                    options: {
                        filter: true,
                        searchable: false,
                        viewColumns: false,
                        customBodyRender: (value, tableMeta) => {
                            return value ? 'Filled' : 'Not Filled';
                        }
                    }
                },

                {
                    label: 'Start Date',
                    name: 'startDate0Z',
                    options: {
                        filter: false,
                        searchable: true,
                        viewColumns: false,
                        customBodyRender: value => {
                            let startDate: string = moment(value).format('LL');
                            return <>{startDate}</>;
                        }
                    }
                },
                {
                    label: 'Instructor',
                    name: 'instructorNickname',
                    options: {
                        filter: true,
                        searchable: false,
                        viewColumns: false
                    }
                },
                {
                    label: 'Participants',
                    name: 'participantsOf',
                    options: {
                        filter: false,
                        searchable: false,
                        viewColumns: false
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
                            const handleDeleteClick = () => {
                                callDeleteClassById(tableMeta.rowData[0]);
                            };
                            return (
                                <RequirePermissions perms={['delete:class']}>
                                    <IconButton
                                        aria-label="Delete class"
                                        onClick={handleDeleteClick}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </RequirePermissions>
                            );
                        }
                    }
                }
            ];

            setColumns(columns);

            const options: MUIDataTableOptions = {
                selectableRows: 'none',
                customToolbar: () => <Toolbar courseAcronym={courseAcronym} />,
                expandableRows: true,
                expandableRowsHeader: false,
                renderExpandableRow: (rows, meta) => {
                    const colSpan = rows.length + 1;
                    const classId = rows[0]; // class id column
                    return (
                        <ExpandableRow
                            classId={classId}
                            courseAcronym={courseAcronym}
                            colSpan={colSpan}
                        />
                    );
                }
            };

            setOptions(options);
        }, [callDeleteClassById, courseAcronym]);

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
                        title={'Classes'}
                        data={classRows}
                        columns={columns}
                        options={options}
                    />
                )}
            </>
        );
    }
);

export default ClassListingTable;
