import React from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import UserListingTable from 'tsh-components/User/user-listing-table';
import { useRouter } from 'next/router';
import { Box, Breadcrumbs, Grid, Typography } from '@material-ui/core';
import Link from 'next/link';
import { UserState, UserType } from 'types/user';
import RequirePermissions from 'util/RequirePermissions';
import ProgramSelect from 'tsh-components/Programs/program-select';

const ActiveParticipantsPage: NextPage = () => {
    return (
        <RequirePermissions perms={['query:participant']}>
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
                                    Active Participants
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
                <UserListingTable
                    userType={UserType.Participant}
                    userState={UserState.Assigned}
                />
            </div>
        </RequirePermissions>
    );
};

export default withAuthenticationRequired(ActiveParticipantsPage);
