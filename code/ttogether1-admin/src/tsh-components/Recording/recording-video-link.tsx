import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, makeStyles, Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import copyToClipboard from 'copy-to-clipboard';
import { snackbarShow } from 'store/ui/snackbar/actions';

export interface IRecordingVideoLinkProps {
    sid: string;
}

const useStyles = makeStyles(theme => ({
    iconButton: {
        padding: '2px 2px'
    }
}));

const RecordingVideoLink: React.FC<IRecordingVideoLinkProps> = props => {
    const { sid } = props;
    const dispatch = useDispatch();
    const classes = useStyles();

    const url = sid ? `/recordings/${sid}` : undefined;

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
                        <IconButton target="_blank" href={`/recordings/${sid}`}>
                            <OpenInNewIcon />
                        </IconButton>
                    </Box>
                </>
            )}
        </>
    );
};

export default RecordingVideoLink;
