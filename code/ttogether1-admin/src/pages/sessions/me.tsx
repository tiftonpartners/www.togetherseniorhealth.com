import React from 'react';
import { NextPage } from 'next';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { Box, Breadcrumbs, Grid, Typography } from '@material-ui/core';
import Link from 'next/link';
import _ from 'lodash';
import AdHocSessionTable from 'tsh-components/Session/adhoc-session-table';
import RequirePermissions from 'util/RequirePermissions';
import ProgramSelect from 'tsh-components/Programs/program-select';

const SessionsAllPage: NextPage = () => {
    const router = useRouter();
    const { user } = useAuth0();
    const userId = _.get(user, 'sub');

    const { fromDate, toDate } = router.query;

    return (
        <RequirePermissions perms={['queryMe:session']}>
            <div className="app-wrapper">
                <Grid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Grid xs={4} item>
                        <Box mb={3}>
                            <Breadcrumbs aria-label="breadcrumb">
                                <Link href="/dashboard">Dashboard</Link>
                                <Typography color="textPrimary">
                                    My Sessions
                                </Typography>
                            </Breadcrumbs>
                        </Box>
                    </Grid>
                    <Grid xs={4} item container justifyContent="flex-end">
                        <Box mb={3}>
                            <ProgramSelect />
                        </Box>
                    </Grid>
                </Grid>

                <AdHocSessionTable
                    userId={userId}
                    fromDate={fromDate as string}
                    toDate={toDate as string}
                />
            </div>
        </RequirePermissions>
    );
};

export default withAuthenticationRequired(SessionsAllPage);
