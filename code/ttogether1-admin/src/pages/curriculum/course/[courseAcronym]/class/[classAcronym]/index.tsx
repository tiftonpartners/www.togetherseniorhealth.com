import React from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Box, Breadcrumbs, Grid, Typography } from '@material-ui/core';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SessionListingTable from 'tsh-components/Session/session-listing-table';
import RequirePermissions from 'util/RequirePermissions';

const SessionsPage: NextPage = () => {
    const router = useRouter();

    const { classAcronym, courseAcronym } = router.query;

    return (
        <RequirePermissions
            perms={['query:course', 'query:class', 'query:session']}
        >
            <div className="app-wrapper">
                <Box mb={3}>
                    <Breadcrumbs aria-label="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <Link href="/curriculum">Curriculum</Link>
                        <Link
                            href={`/curriculum/course/${courseAcronym}`}
                        >{`Course - ${courseAcronym}`}</Link>
                        <Typography color="textPrimary">
                            Class - {classAcronym}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <SessionListingTable
                    courseAcronym={courseAcronym as string}
                    classAcronym={classAcronym as string}
                />
            </div>
        </RequirePermissions>
    );
};

export default withAuthenticationRequired(SessionsPage);
