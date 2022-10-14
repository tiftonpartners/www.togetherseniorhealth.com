import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    FormControl,
    FormGroup,
    FormHelperText,
    FormLabel,
    Grid,
    InputLabel,
    makeStyles,
    MenuItem,
    Select,
    TextField,
    Checkbox,
    FormControlLabel
} from '@material-ui/core';
import { IClass } from 'types/class';
import { DeepPartial } from 'redux';
import SelectUserFromRole from 'tsh-components/Roles/select-user-by-role';
import { yupResolver } from '@hookform/resolvers/yup';
import { ClassValidator } from 'store/classes/validation';
import _ from 'lodash';
import ConfirmModal, { IConfirmModalProps } from 'util/modals/ConfirmModal';
import { useModal } from 'util/modals';
import { useForm } from 'react-hook-form';

export interface IClassFormProps {
    classToUpsert: IClass;
    onSubmit?: (klass: DeepPartial<IClass>) => void;
    onCancel?: () => void;
}

const useStyles = makeStyles(theme => ({
    formGroup: {
        marginBottom: theme.spacing(3)
    },
    weekdayChip: {
        marginBottom: theme.spacing(1),
        marginRight: theme.spacing(1)
    },
    cancelButton: {
        marginRight: theme.spacing(1)
    }
}));

const ClassForm: React.FC<IClassFormProps> = props => {
    const classes = useStyles();
    const { showModal } = useModal();

    const { classToUpsert, onSubmit, onCancel } = props;
    const isScheduled =
        _.get(classToUpsert, 'sessions') && classToUpsert.sessions.length > 0;
    const { register, handleSubmit, setValue, errors } = useForm({
        resolver: yupResolver(ClassValidator(classToUpsert._id === undefined))
    });

    const [instructorId, setInstructorId] = useState<string>(
        classToUpsert.instructorId || undefined
    );

    const handleChangeInstructor = (instructorId: string) => {
        setInstructorId(instructorId);
        setValue('instructorId', instructorId);
    };

    const handleFormSubmit = (klass: DeepPartial<IClass>) => {
        if (!instructorId || instructorId == '') {
            const modal = showModal(ConfirmModal, {
                title: 'Continue with no instructor assigned to class?',
                submitText: 'Confirm',
                onSubmit: () => {
                    if (onSubmit) {
                        onSubmit(klass);
                    }
                    modal.hide();
                },
                onCancel: () => modal.hide()
            } as IConfirmModalProps);
        } else {
            if (onSubmit) {
                onSubmit(klass);
            }
        }
    };

    useEffect(() => {
        register({ name: 'instructorId' });
    }, [setValue]);

    return (
        <form noValidate onSubmit={handleSubmit(handleFormSubmit)}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="classNameEdit"
                            name="name"
                            label="Name"
                            type="text"
                            fullWidth
                            defaultValue={classToUpsert.name}
                            inputRef={register}
                            error={errors.name !== undefined}
                            helperText={errors.name?.message}
                        />
                    </FormGroup>
                </Grid>

                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="classDescriptionEdit"
                            name="description"
                            label="Description"
                            type="text"
                            fullWidth
                            multiline
                            rows={3}
                            defaultValue={classToUpsert.description}
                            inputRef={register}
                            error={errors.description !== undefined}
                            helperText={errors.description?.message}
                        />
                    </FormGroup>
                </Grid>

                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="classAcronymEdit"
                            name="acronym"
                            label="Acronym"
                            type="text"
                            fullWidth
                            inputRef={register}
                            disabled={classToUpsert._id !== undefined}
                            defaultValue={classToUpsert.acronym}
                            error={errors.acronym !== undefined}
                            helperText={errors.acronym?.message}
                        />
                    </FormGroup>
                </Grid>

                <Grid item xs={12}>
                    <SelectUserFromRole
                        formLabel="Instructor"
                        role="instructor"
                        onSelectUser={handleChangeInstructor}
                        defaultUserId={classToUpsert.instructorId}
                        selectedUserId={instructorId}
                        required={true}
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="classHelpMessageEdit"
                            name="helpMessage"
                            label="Help Message"
                            type="text"
                            fullWidth
                            InputProps={{
                                readOnly: isScheduled
                            }}
                            multiline
                            rows={3}
                            defaultValue={classToUpsert.helpMessage}
                            inputRef={register}
                            error={errors.helpMessage !== undefined}
                            helperText={errors.helpMessage?.message}
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="classCheckPageHelpMessageEdit"
                            name="checkPageHelpMessage"
                            label="Check Page Help Message"
                            type="text"
                            fullWidth
                            multiline
                            rows={3}
                            defaultValue={classToUpsert.checkPageHelpMessage}
                            inputRef={register}
                            error={errors.checkPageHelpMessage !== undefined}
                            helperText={errors.checkPageHelpMessage?.message}
                        />
                    </FormGroup>
                </Grid>

                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    inputRef={register}
                                    defaultChecked={classToUpsert.disableEmails}
                                    name="disableEmails"
                                />
                            }
                            label="Disable Class Emails?"
                        />
                    </FormGroup>
                </Grid>
                <Grid container spacing={2} justifyContent="flex-end">
                    {/* <Grid item>
						<Button
							variant="contained"
							color="secondary"
							onClick={handleFormCancel}
						>
							Cancel
						</Button>
					</Grid> */}

                    <Grid item>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={onCancel}
                            className={classes.cancelButton}
                        >
                            {'Cancel'}
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            {classToUpsert._id ? 'Save Class' : 'Create Class'}
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </form>
    );
};

export default ClassForm;
