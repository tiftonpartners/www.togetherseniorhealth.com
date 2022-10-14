import React, { useEffect, useState } from 'react';
import { FormGroup, Grid, makeStyles } from '@material-ui/core';
import { IAdHocSession } from 'types/session';
import { KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';
import moment, { Moment } from 'moment';
import { DeepPartial } from 'redux';

export interface ISessionFormProps {
    defaultValues: DeepPartial<IAdHocSession>;
    register: any;
    setValue: any;
    errors: any;
}

const useStyles = makeStyles(theme => ({
    formGroup: {
        marginBottom: theme.spacing(3)
    }
}));

const SessionForm: React.FC<ISessionFormProps> = props => {
    const classes = useStyles();
    const { defaultValues, register, setValue, errors } = props;

    const [date, setDate] = useState<Moment>(
        moment(defaultValues.date0Z).utc()
    );
    const [startTime, setStartTime] = useState<Moment>(
        moment(defaultValues.scheduledStartTime as string).utc()
    );

    useEffect(() => {
        register({ name: 'date0Z' });
        register({ name: 'scheduledStartTime' });
    }, [setValue]);

    const handleChangeDate = (date: Moment) => {
        setValue('date0Z', date.utc().toISOString());
        setDate(date.utc());
    };

    const handleChangeStartTime = (time: Moment) => {
        setValue('scheduledStartTime', time.utc().toISOString());
        setStartTime(time.utc());
    };

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <FormGroup className={classes.formGroup}>
                        <KeyboardDatePicker
                            margin="normal"
                            id="sessionDateEdit"
                            label="Date"
                            name="date0Z"
                            format="MM / DD / yyyy"
                            autoOk
                            value={date}
                            onChange={handleChangeDate}
                            KeyboardButtonProps={{
                                'aria-label': 'change  date'
                            }}
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={6}>
                    <FormGroup className={classes.formGroup}>
                        <KeyboardTimePicker
                            margin="normal"
                            id="classScheduleStartTimeEdit"
                            label="Start Time"
                            name="schedule.startTime"
                            value={startTime}
                            onChange={handleChangeStartTime}
                            KeyboardButtonProps={{
                                'aria-label': 'change start time'
                            }}
                        />
                    </FormGroup>
                </Grid>
            </Grid>
        </>
    );
};

export default SessionForm;
