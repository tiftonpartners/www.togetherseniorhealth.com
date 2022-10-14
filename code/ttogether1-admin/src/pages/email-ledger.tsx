import React from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import Link from 'next/link';
import RequirePermissions from 'util/RequirePermissions';
import LedgerEntryListingTable from 'tsh-components/Notifications/ledger-entry-listing-table';

const EmailLedgerPage: NextPage = React.memo(() => {
    return (
        <RequirePermissions perms={['query:email']}>
            <div className="app-wrapper">
                <Box mb={3}>
                    <Breadcrumbs aria-label="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <Typography color="textPrimary">
                            Email Ledger Entries
                        </Typography>
                    </Breadcrumbs>
                </Box>
                <LedgerEntryListingTable />
            </div>
        </RequirePermissions>
    );
});

export default withAuthenticationRequired(EmailLedgerPage);
