import React, { useCallback, useEffect } from 'react';
import { NextPage } from 'next';
import { useAuth0 } from '@auth0/auth0-react';
import { Grid } from '@material-ui/core';
import { useRouter } from 'next/router';
import _ from 'lodash';

const Dashboard: NextPage = () => {
    const auth = useAuth0();
    const router = useRouter();
    const hasCode = _.has(router.query, 'code');

    useEffect(() => {
        if (!auth.isAuthenticated && !auth.isLoading && !hasCode) {
            auth.loginWithRedirect();
        }
    }, [auth.isAuthenticated, auth.isLoading, hasCode]);

    return (
        <div className="app-wrapper">
            <Grid container>
                <h1>Dashboard</h1>
            </Grid>
        </div>
    );
};

export default Dashboard;
