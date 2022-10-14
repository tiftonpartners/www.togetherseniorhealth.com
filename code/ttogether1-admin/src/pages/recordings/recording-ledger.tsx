import React from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import Link from 'next/link';
import RequirePermissions from 'util/RequirePermissions';
import LedgerEntryListingTable from 'tsh-components/Notifications/ledger-entry-listing-table';
import RecordingEntryListingTable from 'tsh-components/Recording/recording-entry-listing-table';

const RecordingLedgerPage: NextPage = React.memo(() => {
    return (
        <RequirePermissions perms={['query:recording']}>
            <div className="app-wrapper">
                <Box mb={3}>
                    <Breadcrumbs aria-label="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <Typography color="textPrimary">
                            Recording Ledger Entries
                        </Typography>
                    </Breadcrumbs>
                </Box>
                <RecordingEntryListingTable />
            </div>
        </RequirePermissions>
    );
});

export default withAuthenticationRequired(RecordingLedgerPage);
