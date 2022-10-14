import React from 'react';
import { IProps as IModalProps } from 'util/modals/State';
import SessionSchedule, {
    ISessionScheduleProps
} from '../Session/session-schedule';
import theme from 'containers/themes/theme';
import { Box, Dialog, DialogContent, DialogTitle } from '@material-ui/core';

export interface IUserRescheduleSessionModalProps extends IModalProps {
    userId: string;
    sessionScheduleProps: Omit<ISessionScheduleProps, 'onSubmit'>;
    onSubmit: () => void;
    onCancel: () => void;
}

const UserRescheduleSessionModal: React.FC<IUserRescheduleSessionModalProps> = props => {
    const {
        userId,
        onSubmit,
        onCancel,
        sessionScheduleProps,
        ...otherProps
    } = props;

    return (
        <Dialog
            open={false}
            aria-labelledby="form-dialog-title"
            maxWidth="lg"
            fullWidth={true}
            {...otherProps}
        >
            <DialogTitle id="form-dialog-title">Reschedule Session</DialogTitle>
            <DialogContent>
                <Box pb={3}>
                    <SessionSchedule
                        buttonText="Reschedule"
                        buttonBackground={theme.palette.success.main}
                        onCancel={onCancel}
                        onSubmit={onSubmit}
                        resetOnSubmit={false}
                        {...sessionScheduleProps}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default UserRescheduleSessionModal;
