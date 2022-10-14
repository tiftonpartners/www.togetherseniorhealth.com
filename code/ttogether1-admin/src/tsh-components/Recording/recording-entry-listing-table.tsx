import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import MUIDataTable, {
    MUIDataTableColumnDef,
    MUIDataTableOptions
} from 'mui-datatables';
import _ from 'lodash';
import moment from 'moment-timezone';
import RecordingVideoCopyLink from 'tsh-components/Recording/recording-video-copy-link';
import RecordingVideoLink from 'tsh-components/Recording/recording-video-link';
import { Box, CircularProgress, makeStyles, Paper } from '@material-ui/core';
import { getAllRecordingsAsync } from 'store/recordings/actions';
import { IRecording, RecordingState } from 'types/recording';

const useStyles = makeStyles(theme => ({
    sectionHeader: {
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'inline-flex',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: theme.spacing(2),
        paddingBottom: theme.spacing(1),
        width: '100%'
    },
    listLabel: {
        width: 100
    },
    buttonWrapper: {
        '& .MuiIconButton-root': {
            padding: 0
        }
    }
}));

export interface IRecordingEntryListingTableProps {}
const RecordingEntryListingTable: React.FC<IRecordingEntryListingTableProps> = React.memo(
    props => {
        const dispatch = useDispatch();
        const classes = useStyles();

        const entries = useSelector<RootState, IRecording[]>(
            state => state.recordings.entries
        );

        const isLoading = useSelector<RootState, boolean>(
            state => state.recordings.loading
        );

        const callGetAllRecordingEnries = useCallback(
            () => dispatch(getAllRecordingsAsync.request({})),
            [dispatch]
        );

        useEffect(() => {
            callGetAllRecordingEnries();
        }, [callGetAllRecordingEnries]);

        const entryRows =
            entries &&
            entries.map(entry => {
                return {
                    ...entry,
                    date: moment(entry.createdOn)
                        .tz(entry.tz || 'America/Los_Angeles')
                        .format('LL')
                };
            });

        const columns: MUIDataTableColumnDef[] = [
            {
                label: 'Session Acronym',
                name: 'acronym',
                options: {
                    filter: false,
                    searchable: true,
                    viewColumns: false
                }
            },
            {
                label: 'Recording ID',
                name: 'sid',
                options: {
                    filter: false,
                    searchable: true,
                    viewColumns: false
                }
            },
            {
                label: 'Date',
                name: 'date',
                options: {
                    filter: false,
                    searchable: true,
                    viewColumns: false,
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
                label: 'Start Time',
                name: 'startTime',
                options: {
                    filter: false,
                    searchable: false,
                    viewColumns: false,
                    customBodyRender: (value, tableMeta) => {
                        let startTime: string = moment(value)
                            .tz(tableMeta.rowData[5] || 'America/Los_Angeles')
                            .format('hh:mm A');
                        return <>{startTime}</>;
                    }
                }
            },
            {
                label: 'End Time',
                name: 'endTime',
                options: {
                    filter: false,
                    searchable: false,
                    viewColumns: false,
                    customBodyRender: (value, tableMeta) => {
                        let endTime: string = moment(value)
                            .tz(tableMeta.rowData[5] || 'America/Los_Angeles')
                            .format('hh:mm A');
                        return <>{endTime}</>;
                    }
                }
            },
            {
                label: 'TZ',
                name: 'tz',
                options: {
                    filter: true,
                    searchable: false,
                    viewColumns: false,
                    customBodyRender: value => {
                        let tz: string = moment()
                            .tz(value || 'America/Los_Angeles')
                            .format('z');
                        return <>{tz}</>;
                    }
                }
            },
            {
                label: 'Duration',
                name: 'duration',
                options: {
                    filter: false,
                    searchable: false,
                    viewColumns: false,
                    customBodyRender: (value, tableMeta) => {
                        return (
                            <>
                                {value && (
                                    <>{Math.round(value / 1000)} seconds</>
                                )}
                            </>
                        );
                    }
                }
            },
            {
                label: 'Status',
                name: 'state',
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
                        return (
                            <>
                                {tableMeta.rowData[7] ===
                                    RecordingState.Uploaded && (
                                    <Box
                                        className={classes.buttonWrapper}
                                        width={1}
                                        display="flex"
                                        flexWrap="nowrap"
                                    >
                                        <RecordingVideoCopyLink
                                            sid={tableMeta.rowData[1]}
                                        />
                                        <RecordingVideoLink
                                            sid={tableMeta.rowData[1]}
                                        />
                                    </Box>
                                )}
                            </>
                        );
                    }
                }
            }
        ];

        const options: MUIDataTableOptions = {
            selectableRows: 'none',
            sortOrder: {
                name: 'date',
                direction: 'desc'
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
                        title={'Recording Entries'}
                        data={entryRows}
                        columns={columns}
                        options={options}
                    />
                )}
            </>
        );
    }
);

export default RecordingEntryListingTable;
