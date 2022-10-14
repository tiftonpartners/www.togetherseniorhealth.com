import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, List, ListItem, makeStyles } from '@material-ui/core';
import _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { makeGetRecordingsBySessionAcronym } from 'store/recordings/selectors';
import { IRecordingFile } from 'types/recording';
import { RootState } from 'typesafe-actions';
import {
    getClassRecordingsByAcronymAsync,
    getClassRecordingsBySIDAsync
} from 'store/recordings/actions';
import { Parser as M3U8Parser } from 'm3u8-parser';
import videojs from 'video.js';

export interface IRecordingDisplayProps {
    sid: string;
}

const useStyles = makeStyles(theme => ({}));

const RecordingDisplay: React.FC<IRecordingDisplayProps> = props => {
    const { sid } = props;
    const classes = useStyles();
    const dispatch = useDispatch();
    const [player, setPlayer] = useState(undefined);

    const recording = useSelector<RootState, IRecordingFile>(
        state => state.recordings.collection[sid]
    );

    const ref = useRef();

    useEffect(() => {
        if (!recording) {
            dispatch(
                getClassRecordingsBySIDAsync.request({
                    sid
                })
            );
        }
    }, [sid]);

    useEffect(() => {
        if (recording) {
            if (typeof window !== 'undefined') {
                const parser = new M3U8Parser();
                parser.push(recording.fileData);
                parser.end();
                console.log(JSON.stringify(parser.manifest));
                const playerOptions = {
                    controls: true,
                    sources: [
                        {
                            src: `data:application/vnd.videojs.vhs+json,${JSON.stringify(
                                parser.manifest
                            )}`,
                            type: 'application/vnd.videojs.vhs+json'
                        }
                    ]
                };
                if (player) {
                    player.dispose();
                }
                const videoPlayer = videojs(
                    ref.current,
                    playerOptions,
                    function onPlayerReady() {
                        console.log('onPlayerReady', this);
                    }
                );
                setPlayer(videoPlayer);
            }
        }
    }, [recording?.title]);

    if (!recording) return null;

    return (
        <>
            <Box width={1} data-vjs-player>
                <video
                    width="100%"
                    ref={ref}
                    className="video-js vjs-fluid"
                ></video>
            </Box>
        </>
    );
};

export default RecordingDisplay;
