import React from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import Link from 'next/link';
//import ProcessTable from 'tsh-components/Process/process-table';
import { ProcessStepType } from 'types/process';
import _ from 'lodash';
import { normalize } from 'helpers';

const ProcessPage: NextPage = () => {
    const router = useRouter();

    const { processName, processType, fromDate, toDate, tz } = router.query;

    return (
        <div className="app-wrapper">
            <Box mb={3}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link href="/dashboard">Dashboard</Link>
                    <Typography color="textPrimary">
                        {`${processName} Process`}
                    </Typography>
                    <Typography color="textPrimary">
                        {normalize(processType as string)}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* <ProcessTable
                processName={processName as string}
                processType={processType as ProcessStepType}
                fromDate={fromDate as string}
                toDate={toDate as string}
                tz={tz as string}
            /> */}
        </div>
    );
};

export default withAuthenticationRequired(ProcessPage);
