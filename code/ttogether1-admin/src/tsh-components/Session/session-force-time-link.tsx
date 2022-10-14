import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, makeStyles, Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import moment from 'moment-timezone';
import copyToClipboard from 'copy-to-clipboard';
import { snackbarShow } from 'store/ui/snackbar/actions';

export interface ISessionForceTimeLinkProps {
    dateTime: string;
}

const useStyles = makeStyles(theme => ({
    iconButton: {
        padding: '2px 2px'
    }
}));

const SessionForceTimeLink: React.FC<ISessionForceTimeLinkProps> = props => {
    const { dateTime } = props;
    const dispatch = useDispatch();
    const classes = useStyles();

    const forceTime = dateTime ? moment(dateTime) : undefined;

    // if not daylight savings then add an hour
    if (forceTime && !forceTime.isDST() && forceTime.locale() === 'en') {
        forceTime.add(1, 'h');
    }

    const handleCopyLink = () => {
        copyToClipboard(forceTime.toISOString());
        dispatch(
            snackbarShow({
                type: 'success',
                message: 'Force Time for Session Testing Copied!'
            })
        );
    };

    return (
        <>
            {forceTime && (
                <>
                    <strong>Force time:</strong>
                    <Box pl={1}>
                        <IconButton
                            className={classes.iconButton}
                            aria-label="Copy quality rtc link"
                            onClick={handleCopyLink}
                        >
                            <FileCopyIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </>
            )}
        </>
    );
};

export default SessionForceTimeLink;
