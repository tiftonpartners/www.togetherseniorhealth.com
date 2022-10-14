import React from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Box, Breadcrumbs, Grid, Typography } from '@material-ui/core';
import { useRouter } from 'next/router';
import ClassListingTable from 'tsh-components/Class/class-listing-table';
import Link from 'next/link';
import RequirePermissions from 'util/RequirePermissions';

const ClassesPage: NextPage = () => {
    const router = useRouter();

    const { courseAcronym } = router.query;

    return (
        <RequirePermissions perms={['query:course', 'query:class']}>
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
                                <Link href="/curriculum">Curriculum</Link>
                                <Typography color="textPrimary">
                                    Course - {courseAcronym}
                                </Typography>
                            </Breadcrumbs>
                        </Box>
                    </Grid>
                </Grid>

                <ClassListingTable courseAcronym={courseAcronym as string} />
            </div>
        </RequirePermissions>
    );
};

export default withAuthenticationRequired(ClassesPage);
