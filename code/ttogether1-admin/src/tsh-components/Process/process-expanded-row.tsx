import React, { useCallback, useState } from 'react';
// import {
//     Box,
//     Button,
//     Divider,
//     Grid,
//     makeStyles,
//     TextField
// } from '@material-ui/core';
// import { Moment } from 'moment-timezone';
// import { IProcess, ProcessStepType } from 'types/process';
// import SessionSchedule from '../Session/session-schedule';
// import { useDispatch } from 'react-redux';
// import {
//     completeProcessStepAsync,
//     rescheduleProcessStepAsync
// } from 'store/prospects/actions';
// import theme from 'containers/themes/theme';

// export interface IProcessExpandedRowProps {
//     userId: string;
//     process: IProcess;
// }

// const useStyles = makeStyles(theme => ({
//     mainActionWrapper: {
//         paddingTop: theme.spacing(3),
//         paddingBottom: theme.spacing(3),
//         paddingLeft: theme.spacing(6),
//         paddingRight: theme.spacing(6)
//     },
//     submitButton: {
//         backgroundColor: theme.palette.success.main
//     }
// }));

// const ProcessExpandedRow: React.FC<IProcessExpandedRowProps> = props => {
//     const { userId, process } = props;

//     const classes = useStyles();
//     const dispatch = useDispatch();

//     const [notes, setNotes] = useState<string>();

//     const callCompleteProcessStep = useCallback(
//         (data?: any, startDate?: string, tz?: string) =>
//             dispatch(
//                 completeProcessStepAsync.request({
//                     id: userId,
//                     processName: process.name,
//                     data,
//                     scheduleParams: {
//                         startDate,
//                         tz
//                     }
//                 })
//             ),
//         [dispatch, userId, process.name]
//     );

//     const callRescheduleProcessStep = useCallback(
//         (startDate: string, tz: string) =>
//             dispatch(
//                 rescheduleProcessStepAsync.request({
//                     id: userId,
//                     processName: process.name,
//                     scheduleParams: {
//                         startDate,
//                         tz
//                     }
//                 })
//             ),
//         [dispatch, userId, process.name]
//     );

//     const handleChangeNotes = (notes: string) => {
//         setNotes(notes);
//     };

//     const handleCompleted = React.useCallback(() => {
//         callCompleteProcessStep(notes);
//     }, [callCompleteProcessStep]);

//     const onSessionSchedule = React.useCallback(
//         (startDate: Moment, startTime: Moment, tz: string) => {
//             startDate.hours(startTime.hours()).minutes(startTime.minutes());
//             callCompleteProcessStep(notes, startDate.toISOString(), tz);
//         },
//         [callCompleteProcessStep]
//     );

//     const onSessionReschedule = React.useCallback(
//         (startDate: Moment, startTime: Moment, tz: string) => {
//             startDate.hours(startTime.hours()).minutes(startTime.minutes());
//             callRescheduleProcessStep(startDate.toISOString(), tz);
//         },
//         [callRescheduleProcessStep]
//     );
//     return (
//         <>
//             <Grid container alignItems="center">
//                 {process.currentStep.type === 'schedule-session' && (
//                     <Grid container alignItems="center">
//                         <Grid item xs={12}>
//                             <Box px={6}>
//                                 <SessionSchedule
//                                 userId={userId}
//                                     buttonText="Schedule"
//                                     onSubmit={onSessionSchedule}
//                                     buttonBackground={
//                                         theme.palette.success.main
//                                     }
//                                 />
//                             </Box>
//                         </Grid>
//                     </Grid>
//                 )}
//                 {process.currentStep.type !== 'schedule-session' && (
//                     <>
//                         <Grid
//                             className={classes.mainActionWrapper}
//                             container
//                             alignItems="flex-end"
//                         >
//                             <Grid item xs={10}>
//                                 <Box pr={2}>
//                                     <TextField
//                                         label="Notes"
//                                         onChange={event =>
//                                             handleChangeNotes(
//                                                 event.target.value
//                                             )
//                                         }
//                                         value={notes}
//                                         multiline
//                                         fullWidth
//                                         rows="4"
//                                         variant="outlined"
//                                         margin="none"
//                                     />
//                                 </Box>
//                             </Grid>
//                             <Grid container item xs={2} justifyContent="flex-end">
//                                 <Button
//                                     variant="contained"
//                                     color="primary"
//                                     className={classes.submitButton}
//                                     onClick={handleCompleted}
//                                     type="submit"
//                                 >
//                                     Completed
//                                 </Button>
//                             </Grid>
//                         </Grid>
//                         <Grid item xs={12}>
//                             <Box mt={3} mb={3}>
//                                 <Divider />
//                             </Box>
//                         </Grid>

//                         <Grid container alignItems="center">
//                             <Grid item xs={12}>
//                                 <Box px={6}>
//                                     <SessionSchedule
//                                         buttonText="Reschedule"
//                                         onSubmit={onSessionReschedule}
//                                         defaultStartDate={
//                                             process.currentStep.startDate
//                                         }
//                                     />
//                                 </Box>
//                             </Grid>
//                         </Grid>
//                     </>
//                 )}
//             </Grid>
//         </>
//     );
// };

// export default ProcessExpandedRow;
