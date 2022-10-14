import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { UserData as Auth0UserData } from 'auth0';
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
    IUpdateAuth0UserPayload,
    updateAuth0UserAsync
} from 'store/auth0Users/actions';
import { UserValidator } from 'store/auth0Users/validation';
import { IProps as IModalProps } from 'util/modals/State';
import { IAuth0User } from 'types/auth0';
import Auth0UserTicketDisplay from './auth0-user-ticket-display';

export interface IAuth0UserListingEditModalProps extends IModalProps {
    userToEdit: IAuth0User;
    onSubmit: () => void;
    onCancel: () => void;
}

const useStyles = makeStyles(theme => ({
    formGroup: {
        marginBottom: theme.spacing(3)
    },
    dialogActions: {
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(3)
    }
}));

const Auth0UserListingEditModal: React.FC<IAuth0UserListingEditModalProps> = props => {
    const dispatch = useDispatch();
    const classes = useStyles();
    const { register, handleSubmit, errors } = useForm({
        resolver: yupResolver(UserValidator)
    });
    const { onSubmit, onCancel, userToEdit, ...otherProps } = props;

    const callUpdateAuth0User = useCallback(
        (payload: IUpdateAuth0UserPayload) =>
            dispatch(updateAuth0UserAsync.request(payload)),
        [dispatch]
    );

    const handleFormSubmit = (user: Partial<Auth0UserData>) => {
        callUpdateAuth0User({
            userId: userToEdit.user_id,
            user
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
            {userToEdit && (
                <form noValidate onSubmit={handleSubmit(handleFormSubmit)}>
                    <DialogTitle id="form-dialog-title">Edit User</DialogTitle>
                    <DialogContent>
                        <FormGroup className={classes.formGroup}>
                            <TextField
                                autoFocus
                                variant="outlined"
                                id="userNicknameEdit"
                                name="nickname"
                                label="Nickname"
                                type="text"
                                fullWidth
                                inputRef={register}
                                defaultValue={userToEdit.nickname}
                                error={errors.nickname !== undefined}
                                helperText={errors.nickname?.message}
                            />
                        </FormGroup>
                        <FormGroup className={classes.formGroup}>
                            <TextField
                                variant="outlined"
                                id="userUsernameEdit"
                                name="username"
                                label="Username"
                                type="text"
                                fullWidth
                                inputRef={register}
                                defaultValue={userToEdit.username}
                                error={errors.username !== undefined}
                                helperText={errors.username?.message}
                            />
                        </FormGroup>
                        <FormGroup className={classes.formGroup}>
                            <TextField
                                variant="outlined"
                                id="userPictureEdit"
                                name="picture"
                                label="Picture"
                                type="text"
                                fullWidth
                                inputRef={register}
                                defaultValue={userToEdit.picture}
                                error={errors.picture !== undefined}
                                helperText={errors.picture?.message}
                            />
                        </FormGroup>
                        <Auth0UserTicketDisplay userId={userToEdit.user_id} />
                    </DialogContent>
                    <DialogActions className={classes.dialogActions}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Save User
                        </Button>
                    </DialogActions>
                </form>
            )}
        </Dialog>
    );
};

export default Auth0UserListingEditModal;
