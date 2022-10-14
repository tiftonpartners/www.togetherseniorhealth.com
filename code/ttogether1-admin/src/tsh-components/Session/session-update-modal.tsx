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
    IUpdateSessionPayload,
    updateClassAsync,
    updateSessionAsync
} from 'store/classes/actions';
import { ClassValidator, SessionValidator } from 'store/classes/validation';
import { IProps as IModalProps } from 'util/modals/State';
import moment from 'moment';
import { IClassSession } from 'types/session';
import SessionForm from './session-form';

export interface ISessionUpdateModalProps extends IModalProps {
    sessionToUpdate: IClassSession;
    courseAcronym: string;
    classAcronym: string;
    classId: string;
    onSubmit: () => void;
    onCancel: () => void;
}

const useStyles = makeStyles(theme => ({
    dialogActions: {
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(3)
    }
}));

const SessionUpdateModal: React.FC<ISessionUpdateModalProps> = props => {
    const {
        onSubmit,
        onCancel,
        sessionToUpdate,
        courseAcronym,
        classAcronym,
        classId,
        ...otherProps
    } = props;

    const dispatch = useDispatch();
    const classes = useStyles();

    const defaultValues = {
        ...sessionToUpdate
    };

    const { register, setValue, errors, handleSubmit } = useForm({
        resolver: yupResolver(SessionValidator),
        defaultValues
    });

    const callUpdateSession = useCallback(
        (payload: IUpdateSessionPayload) =>
            dispatch(updateSessionAsync.request(payload)),
        [dispatch]
    );

    const handleFormSubmit = (session: Partial<IClassSession>) => {
        callUpdateSession({
            session,
            classId
        });

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
            <form noValidate onSubmit={handleSubmit(handleFormSubmit)}>
                <DialogTitle id="form-dialog-title">Edit Session</DialogTitle>
                <DialogContent>
                    <SessionForm
                        defaultValues={defaultValues}
                        register={register}
                        setValue={setValue}
                        errors={errors}
                    />
                </DialogContent>
                <DialogActions className={classes.dialogActions}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" color="primary" type="submit">
                        Save Session
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default SessionUpdateModal;
