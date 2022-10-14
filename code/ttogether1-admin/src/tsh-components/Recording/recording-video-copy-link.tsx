import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, makeStyles, Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import moment from 'moment-timezone';
import copyToClipboard from 'copy-to-clipboard';
import { snackbarShow } from 'store/ui/snackbar/actions';

export interface IRecordingVideoCopyLinkProps {
    sid: string;
}

const useStyles = makeStyles(theme => ({
    iconButton: {
        padding: '2px 2px'
    }
}));

const RecordingVideoCopyLink: React.FC<IRecordingVideoCopyLinkProps> = props => {
    const { sid } = props;
    const dispatch = useDispatch();
    const classes = useStyles();

    const url = sid ? window.location.host + `/recordings/${sid}` : undefined;

    const handleCopyLink = () => {
        copyToClipboard(url);
        dispatch(
            snackbarShow({
                type: 'success',
                message: 'Video link copied!'
            })
        );
    };

    return (
        <>
            {url && (
                <>
                    <Box pl={1}>
                        <IconButton
                            className={classes.iconButton}
                            aria-label="Copy video link"
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

export default RecordingVideoCopyLink;
