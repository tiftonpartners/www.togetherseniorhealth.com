import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogTitle,
    FormControl,
    FormGroup,
    FormHelperText,
    InputLabel,
    makeStyles,
    MenuItem,
    Select
} from '@material-ui/core';
import { IProps as IModalProps } from 'util/modals/State';
import {
    WithdrawnReason,
    IneligibilityReason,
    userWithdrawnReason,
    userIneligibilityReason
} from 'types/user';

export interface IUserOutcomeConfirmModalProps extends IModalProps {
    title: string;
    isParticipant?: boolean;
    submitText?: string;
    onSubmit: (selectedOutcome: IneligibilityReason | WithdrawnReason) => void;
    onCancel: () => void;
}

const useStyles = makeStyles(theme => ({
    dialogActions: {
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(3)
    }
}));

const UserOutcomeConfirmModal: React.FC<IUserOutcomeConfirmModalProps> = props => {
    const { onSubmit, onCancel, isParticipant, ...otherProps } = props;

    const classes = useStyles();

    const [selectedOutcome, setSelectedOutcome] = useState<
        IneligibilityReason | WithdrawnReason | ''
    >('');
    const [submitted, setSubmitted] = useState<boolean>(false);

    const handleChangeOutcome = (
        event: React.ChangeEvent<{
            name?: string;
            value: IneligibilityReason | WithdrawnReason;
        }>
    ) => {
        setSelectedOutcome(event.target.value);
    };

    const handleSubmit = () => {
        setSubmitted(true);

        if (!selectedOutcome) {
            return;
        }
        onSubmit(selectedOutcome);
    };

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
            <DialogTitle id="form-dialog-title">{otherProps.title}</DialogTitle>

            <Box px={3}>
                <FormGroup>
                    <FormControl
                        margin="normal"
                        error={!selectedOutcome && submitted}
                    >
                        <InputLabel id="user-outcome-select-label">
                            Reason
                        </InputLabel>
                        <Select
                            labelId="user-outcome-select-label"
                            id="user-outcome-select"
                            value={selectedOutcome}
                            onChange={handleChangeOutcome}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {!isParticipant &&
                                Array.from(userIneligibilityReason.keys()).map(
                                    key => (
                                        <MenuItem key={key} value={key}>
                                            {userIneligibilityReason.get(key)}
                                        </MenuItem>
                                    )
                                )}
                            {isParticipant &&
                                Array.from(userWithdrawnReason.keys()).map(
                                    key => (
                                        <MenuItem key={key} value={key}>
                                            {userWithdrawnReason.get(key)}
                                        </MenuItem>
                                    )
                                )}
                        </Select>
                        <FormHelperText>
                            {!selectedOutcome &&
                                submitted &&
                                'Must select a reason'}
                        </FormHelperText>
                    </FormControl>
                </FormGroup>
            </Box>

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
                    onClick={handleSubmit}
                >
                    {otherProps.submitText || 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserOutcomeConfirmModal;
