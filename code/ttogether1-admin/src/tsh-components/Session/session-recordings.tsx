import React, { useEffect, useRef, useState } from 'react';
import { Grid, List, ListItem, Box, makeStyles } from '@material-ui/core';
import _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { makeGetRecordingsBySessionAcronym } from 'store/recordings/selectors';
import { IRecordingFile } from 'types/recording';
import { RootState } from 'typesafe-actions';
import { getClassRecordingsByAcronymAsync } from 'store/recordings/actions';
import moment from 'moment';
import RecordingVideoCopyLink from 'tsh-components/Recording/recording-video-copy-link';
import RecordingVideoLink from 'tsh-components/Recording/recording-video-link';

export interface ISessionRecordingsProps {
    sessionAcronym: string;
}

const useStyles = makeStyles(theme => ({
    buttonWrapper: {
        '& .MuiIconButton-root': {
            padding: 0
        }
    }
}));

const SessionRecordings: React.FC<ISessionRecordingsProps> = props => {
    const { sessionAcronym } = props;
    const classes = useStyles();
    const dispatch = useDispatch();

    const getRecordings = makeGetRecordingsBySessionAcronym(sessionAcronym);
    const recordings = useSelector<RootState, IRecordingFile[]>(state =>
        getRecordings(state)
    );

    useEffect(() => {
        if (!recordings) {
            dispatch(
                getClassRecordingsByAcronymAsync.request({
                    acronym: sessionAcronym
                })
            );
        }
    }, [sessionAcronym]);

    if (!recordings) return null;

    return (
        <List>
            {recordings &&
                recordings.map((recording, i) => (
                    <ListItem key={i} disableGutters>
                        <Grid container justifyContent="space-between">
                            <Grid item>
                                {moment(recording.metadata.createdOn).format(
                                    'LL'
                                )}{' '}
                                {recording.metadata.duration && (
                                    <>
                                        -{' '}
                                        {Math.round(
                                            recording.metadata.duration / 1000
                                        )}{' '}
                                        seconds
                                    </>
                                )}
                            </Grid>
                            <Grid item>
                                <Box
                                    className={classes.buttonWrapper}
                                    width={1}
                                    display="flex"
                                    flexWrap="nowrap"
                                >
                                    <RecordingVideoCopyLink
                                        sid={recording.sid}
                                    />
                                    <RecordingVideoLink sid={recording.sid} />
                                </Box>
                            </Grid>
                        </Grid>
                    </ListItem>
                ))}
        </List>
    );
};

export default SessionRecordings;
