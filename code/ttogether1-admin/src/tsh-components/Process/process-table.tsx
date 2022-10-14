import React, { useCallback, useEffect, useState } from 'react';
// import {
//     Box,
//     Chip,
//     Divider,
//     Grid,
//     List,
//     ListItem,
//     makeStyles,
//     TableCell,
//     TableRow,
//     Typography
// } from '@material-ui/core';
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from 'typesafe-actions';
// import { IProspect, IProspectCollectionDTO } from 'types/prospect';
// import { getProspectsByProcessTypeAsync } from 'store/prospects/actions';
// import MUIDataTable, {
//     MUIDataTableColumnDef,
//     MUIDataTableOptions
// } from 'mui-datatables';
// import { ProcessStepType } from 'types/process';
// import moment from 'moment';
// import _ from 'lodash';
// import ProcessExpandedRow from './process-expanded-row';
// import ToggleChip from '../General/toggle-chip';

// export interface IProcessTableProps {
//     processName: string;
//     processType: ProcessStepType;
//     fromDate?: string;
//     toDate?: string;
//     tz?: string;
// }
// const useStyles = makeStyles(theme => ({
//     presetDayWrappr: {
//         alignItems: 'center',
//         display: 'flex',
//         flex: 1
//     },
//     presetDayChip: {
//         display: 'inline-flex',
//         marginRight: theme.spacing(1)
//     }
// }));

// const ProcessTable: React.FC<IProcessTableProps> = props => {
//     const { processName, processType, fromDate, toDate, tz } = props;

//     const classes = useStyles();
//     const dispatch = useDispatch();
//     const prospectCollection = useSelector<RootState, IProspectCollectionDTO>(
//         state => state.prospects.collection
//     );
//     const byProcessStep = useSelector<RootState, string[]>(
//         state =>
//             _.get(state.prospects.byProcessStep, [processName, processType]) ||
//             []
//     );
//     const refetch = useSelector<RootState, number>(
//         state => state.prospects.refetch
//     );
//     const [presetDays, setPresetDays] = useState(0);

//     const fromDateFinal =
//         processType === 'conduct-session' && !fromDate
//             ? moment()
//                   .utc()
//                   .startOf('day')
//                   .toISOString()
//             : fromDate;

//     const toDateFinal =
//         processType === 'conduct-session' && !toDate
//             ? Number.isInteger(presetDays)
//                 ? moment()
//                       .utc()
//                       .endOf('day')
//                       .add(presetDays, 'days')
//                       .toISOString()
//                 : undefined
//             : toDate;

//     const callGetProspectsByProcessType = useCallback(
//         (processName: string, processType: ProcessStepType) =>
//             dispatch(
//                 getProspectsByProcessTypeAsync.request({
//                     processType,
//                     processName,
//                     fromDate: fromDateFinal,
//                     toDate: toDateFinal,
//                     tz
//                 })
//             ),
//         [dispatch, toDateFinal, fromDateFinal]
//     );

//     useEffect(() => {
//         callGetProspectsByProcessType(processName, processType);
//     }, [callGetProspectsByProcessType, processName, processType, refetch]);

//     const handlePresetDaysSelect = (days: number) => {
//         setPresetDays(days);
//     };

//     const prospectRows = byProcessStep.map(prospectId => {
//         const {
//             _id,
//             memberId,
//             firstName,
//             lastName,
//             processes
//         } = prospectCollection[prospectId] as IProspect;
//         const process = processes.filter(
//             process => process.name === processName
//         )[0];

//         return {
//             _id,
//             memberId,
//             firstName,
//             lastName,
//             taskName: process.currentStep.displayName,
//             taskDate: process.currentStep.startDate
//         };
//     });

//     const columns: MUIDataTableColumnDef[] = [
//         {
//             label: 'Id',
//             name: '_id',
//             options: {
//                 display: false,
//                 filter: false,
//                 searchable: false,
//                 viewColumns: false
//             }
//         },
//         {
//             label: 'Task Date',
//             name: 'taskDate',
//             options: {
//                 display: processType === 'conduct-session',
//                 filter: false,
//                 customBodyRender: value => {
//                     return value ? (
//                         moment(value)
//                             .utc()
//                             .format('L hh:mm a')
//                     ) : (
//                         <></>
//                     );
//                 }
//             }
//         },
//         {
//             label: 'Task Name',
//             name: 'taskName',
//             options: {
//                 filter: true,
//                 searchable: false
//             }
//         },
//         {
//             label: 'Member Id',
//             name: 'memberId',
//             options: {
//                 filter: false,
//                 searchable: true,
//                 viewColumns: false
//             }
//         },
//         {
//             label: 'First Name',
//             name: 'firstName',
//             options: {
//                 filter: false,
//                 searchable: true
//             }
//         },
//         {
//             label: 'Last Name',
//             name: 'lastName',
//             options: {
//                 filter: false,
//                 searchable: true
//             }
//         }
//     ];

//     const options: MUIDataTableOptions = {
//         selectableRows: 'none',
//         expandableRows: true,
//         expandableRowsHeader: false,
//         renderExpandableRow: (rows, meta) => {
//             const colSpan = rows.length + 1;
//             const row = rows[0]; // user id column
//             const prospect = _.get(prospectCollection, row) as IProspect;
//             const process = prospect.processes.find(
//                 process => process.name === processName
//             );
//             return (
//                 <TableRow>
//                     <TableCell colSpan={colSpan}>
//                         <Box px={4}>
//                             {prospect && (
//                                 <Grid container>
//                                     <Grid item xs={4}>
//                                         <List disablePadding dense>
//                                             <ListItem>
//                                                 <strong>First Name:</strong>
//                                                 <Box pl={1}>
//                                                     {prospect.firstName}
//                                                 </Box>
//                                             </ListItem>
//                                             <ListItem>
//                                                 <strong>Last Name:</strong>
//                                                 <Box pl={1}>
//                                                     {prospect.lastName}
//                                                 </Box>
//                                             </ListItem>
//                                             <ListItem>
//                                                 <strong>Phone:</strong>
//                                                 <Box pl={1}>
//                                                     {prospect.phone}
//                                                 </Box>
//                                             </ListItem>
//                                             <ListItem>
//                                                 <strong>Email: </strong>
//                                                 <Box pl={1}>
//                                                     {prospect.email}
//                                                 </Box>
//                                             </ListItem>
//                                         </List>
//                                     </Grid>
//                                     <Grid item xs={4}>
//                                         <List disablePadding dense>
//                                             <ListItem>
//                                                 <strong>
//                                                     Caregiver First Name:
//                                                 </strong>
//                                                 <Box pl={1}>
//                                                     {
//                                                         prospect.caregiverFirstName
//                                                     }
//                                                 </Box>
//                                             </ListItem>
//                                             <ListItem>
//                                                 <strong>
//                                                     Caregiver Last Name:
//                                                 </strong>
//                                                 <Box pl={1}>
//                                                     {prospect.caregiverLastName}
//                                                 </Box>
//                                             </ListItem>
//                                             <ListItem>
//                                                 <strong>
//                                                     Caregiver Phone:
//                                                 </strong>
//                                                 <Box pl={1}>
//                                                     {prospect.caregiverPhone}
//                                                 </Box>
//                                             </ListItem>
//                                             <ListItem>
//                                                 <strong>
//                                                     Cargeiver Email:
//                                                 </strong>
//                                                 <Box pl={1}>
//                                                     {prospect.caregiverEmail}
//                                                 </Box>
//                                             </ListItem>
//                                         </List>
//                                     </Grid>
//                                 </Grid>
//                             )}
//                         </Box>
//                         <Box mt={4} mb={3}>
//                             <Divider />
//                         </Box>
//                         <ProcessExpandedRow
//                             userId={prospect._id}
//                             process={process}
//                         />
//                     </TableCell>
//                 </TableRow>
//             );
//         },
//         sortOrder: {
//             name: 'taskDate',
//             direction: 'asc'
//         }
//     };

//     const datePresetFilters = [
//         {
//             label: 'Today',
//             days: 0
//         },
//         {
//             label: 'Next 30 Days',
//             days: 30
//         },
//         {
//             label: 'All',
//             days: undefined
//         }
//     ];

//     return (
//         <MUIDataTable
//             title={
//                 <>
//                     {processType === 'conduct-session' && (
//                         <Grid container spacing={3}>
//                             <Grid item>
//                                 <Typography variant="h6">{`${processName} Process`}</Typography>
//                             </Grid>
//                             <Grid item className={classes.presetDayWrappr}>
//                                 {datePresetFilters.map(preset => (
//                                     <Box
//                                         key={`preset-${preset.days}`}
//                                         className={classes.presetDayChip}
//                                     >
//                                         <ToggleChip
//                                             id={preset.days}
//                                             displayValue={preset.label}
//                                             active={presetDays === preset.days}
//                                             onChipClicked={
//                                                 handlePresetDaysSelect
//                                             }
//                                         />
//                                     </Box>
//                                 ))}
//                             </Grid>
//                         </Grid>
//                     )}
//                     {processType !== 'conduct-session' && (
//                         <Typography variant="h6">{`${processName} Process`}</Typography>
//                     )}
//                 </>
//             }
//             data={prospectRows}
//             columns={columns}
//             options={options}
//         />
//     );
// };

// export default ProcessTable;
