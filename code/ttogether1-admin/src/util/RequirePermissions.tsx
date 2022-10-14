import {
    Box,
    CircularProgress,
    makeStyles,
    Typography
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import React from 'react';
import useRequirePermissions from './hooks/useRequirePermissions';

export interface IRequirePermissionsProps {
    displayMessage?: boolean;
    displayLoader?: boolean;
    perms?: string[];
    permsOr?: string[];
}

const useStyles = makeStyles(theme => ({
    alert: {
        justifyContent: 'center'
    },
    alertIcon: {
        paddingTop: 13
    }
}));

const RequirePermissions: React.FC<React.PropsWithChildren<
    IRequirePermissionsProps
>> = props => {
    const { perms, permsOr, children, displayMessage, displayLoader } = props;
    const classes = useStyles();
    const { loading, permitted } = useRequirePermissions(perms, permsOr);

    if (loading && displayLoader) {
        return (
            <Box
                display="flex"
                height="100vh"
                width={1}
                justifyContent="center"
                alignItems="center"
            >
                <CircularProgress />
            </Box>
        );
    } else if (!loading) {
        return permitted ? (
            <>{children}</>
        ) : (
            <>
                {displayMessage && (
                    <Box height={400}>
                        <Alert
                            classes={{
                                root: classes.alert,
                                icon: classes.alertIcon
                            }}
                            severity="error"
                        >
                            <Typography variant="h4">UNAUTHORIZED</Typography>
                            <p>
                                Current user does not have correct permissions
                                to view
                            </p>
                        </Alert>
                    </Box>
                )}
            </>
        );
    } else {
        return null;
    }
};

export default RequirePermissions;
