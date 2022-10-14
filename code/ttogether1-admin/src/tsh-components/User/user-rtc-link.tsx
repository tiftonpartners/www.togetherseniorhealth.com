import React, { useCallback, useEffect } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import { Box, makeStyles } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { getUserNumberAsync, IGetUserNumberPayload } from 'store/users/actions';
import { makeGetUserNumber } from 'store/users/selectors';
import { snackbarShow } from 'store/ui/snackbar/actions';

export interface IUserRTCLinkProps {
    userId: string;
    email: string;
}

const useStyles = makeStyles(theme => ({
    iconButton: {
        padding: '2px 2px'
    }
}));

const UserRTCLink: React.FC<IUserRTCLinkProps> = props => {
    const { email, userId } = props;
    const dispatch = useDispatch();
    const classes = useStyles();

    const getUserNumber = makeGetUserNumber(userId);
    const userNumber = useSelector<RootState, string>(state =>
        getUserNumber(state)
    );
    const url = userNumber
        ? `${process.env.NEXT_PUBLIC_QUALITY_RTC_URL}?email=${email}&reason=${userNumber}`
        : undefined;
    const callGetUserNumber = useCallback(
        (payload: IGetUserNumberPayload) =>
            dispatch(getUserNumberAsync.request(payload)),
        [dispatch]
    );

    const handleCopyLink = () => {
        copyToClipboard(url);
        dispatch(
            snackbarShow({
                type: 'success',
                message: 'Quality RTC URL copied!'
            })
        );
    };

    useEffect(() => {
        if (!userNumber) {
            callGetUserNumber({
                id: userId
            });
        }
    }, [userId]);

    return (
        <>
            {url && (
                <>
                    <strong>Copy Quality RTC Link: </strong>
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

export default UserRTCLink;
