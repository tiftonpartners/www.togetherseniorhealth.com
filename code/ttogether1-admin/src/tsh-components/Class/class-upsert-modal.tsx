import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormGroup,
    makeStyles,
    TextField
} from '@material-ui/core';
import { useDispatch } from 'react-redux';
import {
    createClassAsync,
    ICreateClassPayload,
    IUpdateClassPayload,
    updateClassAsync
} from 'store/classes/actions';
import { ClassValidator } from 'store/classes/validation';
import { IProps as IModalProps } from 'util/modals/State';
import { IClass } from 'types/class';
import ClassForm from './class-form';
import { DeepPartial } from 'redux';
import moment from 'moment';

export interface IClassUpsertModalProps extends IModalProps {
    classToUpsert?: IClass;
    courseAcronym: string;
    onSubmit: () => void;
    onCancel: () => void;
}

const useStyles = makeStyles(theme => ({
    dialogActions: {
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(3)
    }
}));

const ClassUpsertModal: React.FC<IClassUpsertModalProps> = props => {
    const {
        onSubmit,
        onCancel,
        classToUpsert,
        courseAcronym,
        ...otherProps
    } = props;

    const dispatch = useDispatch();
    const classes = useStyles();

    const defaultValues: IClass = {
        numSessions: 24,
        durationMins: 60,
        capacity: 8,
        lobbyTimeMins: 15,
        startDate0Z: moment()
            .utc()
            .toISOString(),
        schedule: {
            weekdays: [],
            startTime: {
                hour: 12,
                mins: 0,
                tz: 'UTC'
            }
        },
        helpMessage: 'The instructor has been notified and will help you soon.',
        checkPageHelpMessage:
            'Please call the community manager at (xxx)-xxx-xxxx for help',
        ...classToUpsert
    };

    const callUpdateClass = useCallback(
        (payload: IUpdateClassPayload) =>
            dispatch(updateClassAsync.request(payload)),
        [dispatch]
    );

    const callCreateClass = useCallback(
        (payload: ICreateClassPayload) =>
            dispatch(createClassAsync.request(payload)),
        [dispatch]
    );

    const handleFormSubmit = (klass: Partial<IClass>) => {
        // If class is already given an id we can assume this is an update
        if (classToUpsert?._id) {
            callUpdateClass({
                class: {
                    ...klass,
                    acronym: classToUpsert.acronym
                },
                courseAcronym
            });
        } else {
            callCreateClass({
                class: klass,
                courseAcronym
            });
        }

        if (onSubmit) {
            onSubmit();
        }
    };

    return (
        <Dialog
            open={false}
            aria-labelledby="form-dialog-title"
            maxWidth="sm"
            fullWidth={true}
            {...otherProps}
        >
            <DialogTitle id="form-dialog-title">
                {classToUpsert?._id ? 'Edit' : 'Create'} Class
            </DialogTitle>
            <DialogContent>
                <ClassForm
                    classToUpsert={defaultValues}
                    onSubmit={handleFormSubmit}
                    onCancel={onCancel}
                />
            </DialogContent>
        </Dialog>
    );
};

export default ClassUpsertModal;
