import React, { useCallback, useEffect } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import {
    Box,
    FormGroup,
    InputAdornment,
    makeStyles,
    TextField
} from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { snackbarShow } from 'store/ui/snackbar/actions';

export interface IUserTicketDisplayProps {
    ticket: string;
}

const useStyles = makeStyles(theme => ({
    iconButton: {
        padding: '2px 2px'
    }
}));

const UserTicketDisplay: React.FC<IUserTicketDisplayProps> = props => {
    const { ticket } = props;
    const dispatch = useDispatch();
    const classes = useStyles();

    const handleCopyTicket = () => {
        copyToClipboard(
            `${process.env.NEXT_PUBLIC_EMAIL_DASHBOARD_URL}?ticket=${ticket}`
        );
        dispatch(
            snackbarShow({
                type: 'success',
                message: 'URL copied!'
            })
        );
    };

    return (
        <>
            {ticket && (
                <>
                    <strong>Copy Landing Page Link: </strong>
                    <Box pl={1}>
                        <IconButton
                            className={classes.iconButton}
                            aria-label="Copy user ticket"
                            onClick={handleCopyTicket}
                        >
                            <FileCopyIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </>
            )}
        </>
    );
};

export default UserTicketDisplay;
