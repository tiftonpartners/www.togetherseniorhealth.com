import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import * as superSearch from '@codewell/super-search';
import MUIDataTable, {
    MUIDataTableColumnDef,
    MUIDataTableOptions
} from 'mui-datatables';
import _ from 'lodash';
import { getAllLedgerEntriesAsync } from 'store/notifications/actions';
import {
    makeGetLedgerEntriesByDate,
    makeGetLedgerEntryByBatchId
} from 'store/notifications/selectors';
import {
    EmailStatus,
    IEmailLedger,
    IEmailLedgerGroup
} from 'types/notification';
import moment from 'moment';
import {
    Box,
    makeStyles,
    List,
    ListItem,
    TableRow,
    TableCell,
    Grid,
    CircularProgress,
    Paper
} from '@material-ui/core';

interface IExpandableRowProps {
    batchId: string;
    colSpan: number;
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
        width: '100%'
    },
    listLabel: {
        width: 100
    }
}));

const ExpandableRow: React.FC<IExpandableRowProps> = React.memo(
    (props: IExpandableRowProps) => {
        const classes = useStyles();
        const { batchId, colSpan } = props;

        const getLedgerEntry = makeGetLedgerEntryByBatchId(batchId);
        const ledger = useSelector<RootState, IEmailLedgerGroup>(state =>
            getLedgerEntry(state)
        );

        return (
            <>
                <TableRow>
                    <TableCell colSpan={colSpan}>
                        <Box px={6} py={3}>
                            <Grid container spacing={1}>
                                <Grid item xs={3}>
                                    <label className={classes.sectionHeader}>
                                        <span>To</span>
                                    </label>
                                </Grid>
                                <Grid item xs={2}>
                                    <label className={classes.sectionHeader}>
                                        <span>Status</span>
                                    </label>
                                </Grid>
                                <Grid item xs={2}>
                                    <label className={classes.sectionHeader}>
                                        <span>Rejected Reason</span>
                                    </label>
                                </Grid>
                                <Grid item xs={2}>
                                    <label className={classes.sectionHeader}>
                                        <span>Rejected Message</span>
                                    </label>
                                </Grid>
                                <Grid item xs={3}>
                                    <label className={classes.sectionHeader}>
                                        <span>Properties</span>
                                    </label>
                                </Grid>
                            </Grid>
                            {ledger.entries.map(entry => (
                                <Grid
                                    container
                                    key={`${entry._id}`}
                                    spacing={1}
                                >
                                    <Grid item xs={3}>
                                        <List disablePadding dense>
                                            <ListItem disableGutters>
                                                {entry.to}
                                            </ListItem>
                                        </List>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <List disablePadding dense>
                                            <ListItem disableGutters>
                                                {entry.status ===
                                                    EmailStatus.Sent && 'Sent'}
                                                {entry.status ===
                                                    EmailStatus.Rejected &&
                                                    'Rejected'}
                                                {entry.status ===
                                                    EmailStatus.Pending &&
                                                    'Pending'}
                                            </ListItem>
                                        </List>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <List disablePadding dense>
                                            <ListItem disableGutters>
                                                {entry.rejectedReason || 'N/A'}
                                            </ListItem>
                                        </List>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <List disablePadding dense>
                                            <ListItem disableGutters>
                                                {entry.rejectedMsg || 'N/A'}
                                            </ListItem>
                                        </List>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <List disablePadding dense>
                                            {Object.keys(entry.properties).map(
                                                prop => (
                                                    <ListItem
                                                        disableGutters
                                                        key={prop}
                                                    >
                                                        <p>
                                                            {prop}:{' '}
                                                            {entry.properties[
                                                                prop
                                                            ].toString()}
                                                        </p>
                                                    </ListItem>
                                                )
                                            )}
                                        </List>
                                    </Grid>
                                </Grid>
                            ))}
                        </Box>
                    </TableCell>
                </TableRow>
            </>
        );
    }
);

export interface ILedgerEntryListingTableProps {}
const LedgerEntryListingTable: React.FC<ILedgerEntryListingTableProps> = React.memo(
    props => {
        const dispatch = useDispatch();

        const getEntriesByDate = makeGetLedgerEntriesByDate();
        const entries = useSelector<RootState, IEmailLedgerGroup[]>(state =>
            getEntriesByDate(state)
        );

        const isLoading = useSelector<RootState, boolean>(
            state => state.notifications.loading
        );

        const entryRows = entries.map(entry => {
            return { ...entry, to: entry.to.join(', ') };
        });

        const callGetAllLedgerEnries = useCallback(
            () => dispatch(getAllLedgerEntriesAsync.request({})),
            [dispatch]
        );

        useEffect(() => {
            callGetAllLedgerEnries();
        }, [callGetAllLedgerEnries]);

        const columns: MUIDataTableColumnDef[] = [
            {
                label: 'Batch Id',
                name: 'batchId',
                options: {
                    filter: false,
                    searchable: true,
                    viewColumns: false
                }
            },
            {
                label: 'To',
                name: 'to',
                options: {
                    display: false,
                    filter: false,
                    searchable: true,
                    viewColumns: false
                }
            },
            {
                label: 'Created On',
                name: 'createdOn',
                options: {
                    filter: false,
                    searchable: false,
                    viewColumns: false,
                    customBodyRender: value => {
                        let createdOn: string = moment(value).format('LLLL');
                        return <>{createdOn}</>;
                    }
                }
            },
            {
                label: 'Email Type',
                name: 'emailType',
                options: {
                    filter: true,
                    viewColumns: false
                }
            },
            {
                label: 'Emails Rejected',
                name: 'emailsRejected',
                options: {
                    filter: false,
                    viewColumns: false
                }
            },
            {
                label: 'Emails Sent',
                name: 'emailsSent',
                options: {
                    filter: false,
                    viewColumns: false
                }
            }
        ];

        const options: MUIDataTableOptions = {
            selectableRows: 'none',

            expandableRows: true,
            expandableRowsHeader: false,
            customSearch: (searchText, row) => {
                return (
                    superSearch(searchText.toLowerCase(), { ...row })
                        .numberOfMatches > 0
                );
            },
            renderExpandableRow: (rows, meta) => {
                const colSpan = rows.length + 1;
                const batchId = rows[0]; // class id column
                return <ExpandableRow batchId={batchId} colSpan={colSpan} />;
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
                        title={'Ledger Entries'}
                        data={entryRows}
                        columns={columns}
                        options={options}
                    />
                )}
            </>
        );
    }
);

export default LedgerEntryListingTable;
