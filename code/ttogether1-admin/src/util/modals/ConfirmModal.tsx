import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContentText,
    DialogTitle,
    makeStyles
} from '@material-ui/core';
import { IProps as IModalProps } from 'util/modals/State';

export interface IConfirmModalProps extends IModalProps {
    title: string;
    contentText?: string;
    submitText?: string;
    onSubmit: () => void;
    onCancel: () => void;
}

const useStyles = makeStyles(theme => ({
    dialogActions: {
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(3)
    },
    dialogContentText: {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3)
    }
}));

const ConfirmModal: React.FC<IConfirmModalProps> = props => {
    const {
        onSubmit,
        onCancel,
        submitText,
        contentText,
        title,
        ...otherProps
    } = props;

    const classes = useStyles();

    return (
        <Dialog
            open={false}
            disableBackdropClick
            disableEscapeKeyDown
            aria-labelledby="form-dialog-title"
            maxWidth="xs"
            fullWidth={true}
            {...otherProps}
        >
            <DialogTitle id="form-dialog-title">{title}</DialogTitle>
            {contentText && (
                <DialogContentText className={classes.dialogContentText}>
                    {contentText}
                </DialogContentText>
            )}

            <DialogActions className={classes.dialogActions}>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button variant="contained" color="primary" onClick={onSubmit}>
                    {submitText || 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmModal;
