import React from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import Auth0UserListingTable from 'tsh-components/Auth0/auth0-user-listing-table';
import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import Link from 'next/link';
import RequirePermissions from 'util/RequirePermissions';

const Auth0UsersPage: NextPage = React.memo(() => {
    return (
        <RequirePermissions perms={['query:user']}>
            <div className="app-wrapper">
                <Box mb={3}>
                    <Breadcrumbs aria-label="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <Typography color="textPrimary">Auth0 Users</Typography>
                    </Breadcrumbs>
                </Box>
                <Auth0UserListingTable />
            </div>
        </RequirePermissions>
    );
});

export default withAuthenticationRequired(Auth0UsersPage);
