import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import MUIDataTable, {
    MUIDataTableColumnDef,
    MUIDataTableOptions
} from 'mui-datatables';
import { IClass } from 'types/class';
import {
    deleteSessionAsync,
    getClassesByCourseAcronymAsync
} from 'store/classes/actions';
import {
    Box,
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    TableCell,
    TableRow
} from '@material-ui/core';
import { useRouter } from 'next/router';
import { useModal } from 'util/modals';
import moment from 'moment-timezone';
import {
    makeGetClassByAcronym,
    makeGetClassSession
} from 'store/classes/selectors';
import { IClassSession } from 'types/session';
import _ from 'lodash';
import SessionEditForm from './session-edit-form';
import DeleteIcon from '@material-ui/icons/Delete';

import { getMyPrograms } from 'store/programs/selectors';
import { getMyProgramsAsync } from 'store/programs/actions';
import { IProgram } from 'types/program';
import RequirePermissions from 'util/RequirePermissions';
import ConfirmModal, { IConfirmModalProps } from 'util/modals/ConfirmModal';

interface IExpandableRowProps {
    classId: string;
    sessionId: string;
    colSpan: number;
    onFormCancel?: () => void;
    onFormSubmit?: () => void;
}

const ExpandableRow: React.FC<IExpandableRowProps> = React.memo(
    (props: IExpandableRowProps) => {
        const {
            classId,
            sessionId,
            colSpan,
            onFormCancel,
            onFormSubmit
        } = props;

        const getSessions = makeGetClassSession(classId, sessionId);
        const session = useSelector<RootState, IClassSession>(state =>
            getSessions(state)
        );

        return (
            <TableRow>
                <TableCell colSpan={colSpan}>
                    <Box px={1}>
                        <SessionEditForm
                            classId={classId}
                            session={session}
                            onCancel={onFormCancel}
                            onSubmit={onFormSubmit}
                        />
                    </Box>
                </TableCell>
            </TableRow>
        );
    }
);

export interface ISessionListingTableProps {
    courseAcronym: string;
    classAcronym: string;
}
const SessionListingTable: React.FC<ISessionListingTableProps> = React.memo(
    props => {
        const dispatch = useDispatch();
        const router = useRouter();
        const { showModal } = useModal();

        const { courseAcronym, classAcronym } = props;

        const getClass = makeGetClassByAcronym(courseAcronym, classAcronym);
        const classByAcronym = useSelector<RootState, IClass>(state =>
            getClass(state)
        );

        const isLoading = useSelector<RootState, boolean>(
            state => state.classes.loading
        );

        const programs = useSelector<RootState, IProgram[]>(state =>
            getMyPrograms(state)
        );

        const sessions =
            _.get(classByAcronym, 'sessions') || ([] as IClassSession[]);

        const sessionsRows = sessions.map(session => {
            let status: string = 'Scheduled';
            const now = moment();
            const sessionTime = moment(session.scheduledStartTime).tz(
                session.tz
            );
            const sessionDateTime = moment(session.date0Z)
                .hour(sessionTime.hour())
                .minute(sessionTime.minute())
                .tz(session.tz);

            if (now.isAfter(sessionDateTime)) {
                status = 'Completed';
            }

            session.status = status;
            session.formattedDateTime = `${moment(session.date0Z).format(
                'YYYY/MM/DD'
            )} ${moment(session.scheduledStartTime)
                .tz(session.tz)
                .format('hh:mm A')}`;
            session.instructorNickname = _.get(
                session,
                'instructorData.nickname'
            );
            session.dayOfWeek = sessionDateTime.format('dddd');

            const program = programs.find(
                program => program.acronym === session.program
            );
            session.programShortName = program
                ? program.shortName
                : session.program;

            return session;
        });

        const callGetClassesByCourseAcronym = useCallback(
            (courseAcronym: string) =>
                dispatch(getClassesByCourseAcronymAsync.request(courseAcronym)),
            [dispatch]
        );

        const callGetMyPrograms = useCallback(
            () => dispatch(getMyProgramsAsync.request({})),
            [dispatch]
        );

        const callDeleteSessionByAcronym = useCallback(
            (sessionAcronym: string) => {
                const modal = showModal(ConfirmModal, {
                    title: 'Delete session?',
                    submitText: 'Confirm',
                    onSubmit: () => {
                        dispatch(
                            deleteSessionAsync.request({ sessionAcronym })
                        ),
                            modal.hide();
                    },
                    onCancel: () => modal.hide()
                } as IConfirmModalProps);
            },
            [dispatch, showModal]
        );

        useEffect(() => {
            if (!classByAcronym) {
                callGetClassesByCourseAcronym(courseAcronym as string);
            }
        }, [callGetClassesByCourseAcronym, courseAcronym]);

        useEffect(() => {
            if (!programs) {
                callGetMyPrograms();
            }
        }, [callGetMyPrograms]);

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
                    viewColumns: false
                }
            },
            {
                label: 'Name',
                name: 'name',
                options: {
                    filter: false,
                    searchable: true,
                    viewColumns: false
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
                label: 'Sequence',
                name: 'seq',
                options: {
                    filter: false,
                    searchable: false,
                    viewColumns: false
                }
            },
            {
                label: 'Start Date',
                name: 'formattedDateTime',
                options: {
                    filter: false,
                    searchable: true,
                    viewColumns: false
                }
            },
            {
                label: 'Day of Week',
                name: 'dayOfWeek',
                options: {
                    filter: false,
                    searchable: false,
                    viewColumns: false
                }
            },
            {
                label: 'Instructor',
                name: 'instructorNickname',
                options: {
                    filter: true,
                    searchable: true,
                    viewColumns: false
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
                label: ' ',
                name: 'actions',
                options: {
                    filter: false,
                    sort: false,
                    empty: true,
                    viewColumns: false,
                    customBodyRender: (value, tableMeta) => {
                        const handleDeleteClick = () => {
                            callDeleteSessionByAcronym(tableMeta.rowData[1]);
                        };
                        return (
                            <RequirePermissions perms={['delete:class']}>
                                <IconButton
                                    aria-label="Delete class session"
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

        const options: MUIDataTableOptions = {
            selectableRows: 'none',
            expandableRows: true,
            expandableRowsHeader: false,
            renderExpandableRow: (rows, meta) => {
                const colSpan = rows.length + 1;
                const sessionId = rows[0]; // session id column
                return (
                    <ExpandableRow
                        classId={classByAcronym._id}
                        sessionId={sessionId}
                        colSpan={colSpan}
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
                        title={'Sessions'}
                        data={sessionsRows}
                        columns={columns}
                        options={options}
                    />
                )}
            </>
        );
    }
);

export default SessionListingTable;
