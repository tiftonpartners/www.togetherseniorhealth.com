import React, { useCallback, useEffect } from 'react';
import {
    Box,
    Button,
    Grid,
    IconButton,
    List,
    ListItem,
    makeStyles,
    Tooltip
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import CloseIcon from '@material-ui/icons/Close';
import moment from 'moment-timezone';
import { useModal } from 'util/modals';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import _ from 'lodash';
import { makeGetClass } from 'store/classes/selectors';
import { IClass } from 'types/class';
import {
    getClassByIdAsync,
    removeUserFromClassByIdAsync
} from 'store/classes/actions';
import ClassUpsertModal, { IClassUpsertModalProps } from './class-upsert-modal';
import ConfirmModal, { IConfirmModalProps } from 'util/modals/ConfirmModal';
import router from 'next/router';
import ProgramNameDisplay from 'tsh-components/Programs/program-name-display';
import RequirePermissions from 'util/RequirePermissions';
import { updateClassSelection } from 'store/ui/global/actions';

export interface IClassDisplayProps {
    classId: string;
    courseAcronym: string;
}

const useStyles = makeStyles(theme => ({
    sectionHeader: {
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'inline-flex',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: theme.spacing(2),
        paddingBottom: theme.spacing(1),
        textTransform: 'uppercase',
        width: '100%'
    },

    editButton: {
        padding: 0,
        marginLeft: 6
    },
    editButtonIcon: {
        fill: theme.palette.success.main,
        fontSize: 16
    },
    deleteButton: {
        padding: 4
    },
    deleteButtonIcon: {
        fill: theme.palette.error.main
    },
    listLabel: {
        width: 100
    }
}));

const ClassDisplay: React.FC<IClassDisplayProps> = React.memo(props => {
    const { classId, courseAcronym } = props;

    const classes = useStyles();
    const dispatch = useDispatch();
    const { showModal } = useModal();

    const getClass = makeGetClass(classId);
    const classToDisplay = useSelector<RootState, IClass>(state =>
        getClass(state)
    );

    const startTime: string = _.get(classToDisplay, 'schedule')
        ? moment(
              classToDisplay.schedule.startTime.hour +
                  ':' +
                  classToDisplay.schedule.startTime.mins,
              'HH:mm'
          ).format('h:mm A')
        : '';

    const callGetClassById = useCallback(
        () => dispatch(getClassByIdAsync.request(classId)),
        [dispatch, classId]
    );

    const callRemoveUserFromClassById = useCallback(
        (userId: string) =>
            dispatch(
                removeUserFromClassByIdAsync.request({
                    userId,
                    classId: classToDisplay._id
                })
            ),
        [dispatch, classToDisplay._id]
    );

    const editClass = React.useCallback(() => {
        const modal = showModal(ClassUpsertModal, {
            courseAcronym,
            classToUpsert: classToDisplay,
            onSubmit: () => modal.hide(),
            onCancel: () => modal.hide()
        } as IClassUpsertModalProps);
    }, [showModal]);

    useEffect(() => {
        if (!classToDisplay) {
            callGetClassById();
        }
    }, [callGetClassById]);

    const handleEditClick = () => {
        editClass();
    };

    const handleDeleteClick = (userId: string) => {
        const modal = showModal(ConfirmModal, {
            title: 'Remove User From Class?',
            submitText: 'Unassign',
            onSubmit: () => {
                callRemoveUserFromClassById(userId);
                modal.hide();
            },
            onCancel: () => modal.hide()
        } as IConfirmModalProps);
    };

    const handleAddParticipant = () => {
        dispatch(
            updateClassSelection({
                courseAcronym,
                classAcronym: classToDisplay.acronym
            })
        );
        router.push(`/participants-screened`);
    };

    return (
        <>
            {classToDisplay && (
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <label className={classes.sectionHeader}>
                            <span>Class Details</span>
                            <RequirePermissions perms={['update:class']}>
                                <Tooltip title={'Edit Class'}>
                                    <IconButton
                                        className={classes.editButton}
                                        onClick={handleEditClick}
                                    >
                                        <EditIcon
                                            className={classes.editButtonIcon}
                                        />
                                    </IconButton>
                                </Tooltip>
                            </RequirePermissions>
                        </label>

                        <List disablePadding dense>
                            <ListItem disableGutters>
                                <strong className={classes.listLabel}>
                                    Name:
                                </strong>
                                <Box pl={1} flex={1}>
                                    {classToDisplay.name}
                                </Box>
                            </ListItem>
                            <ListItem disableGutters>
                                <strong className={classes.listLabel}>
                                    Description:
                                </strong>
                                <Box pl={1} flex={1}>
                                    {classToDisplay.description}
                                </Box>
                            </ListItem>
                            <ListItem disableGutters>
                                <strong className={classes.listLabel}>
                                    Instructor:
                                </strong>
                                <Box pl={1} flex={1}>
                                    {classToDisplay.instructorData?.nickname}
                                </Box>
                            </ListItem>
                            <ListItem disableGutters>
                                <strong className={classes.listLabel}>
                                    Program:
                                </strong>
                                <Box pl={1} flex={1}>
                                    <ProgramNameDisplay
                                        acronym={classToDisplay.program}
                                    />
                                </Box>
                            </ListItem>
                            <ListItem disableGutters>
                                <strong className={classes.listLabel}>
                                    Help Message:
                                </strong>
                                <Box pl={1} flex={1}>
                                    {classToDisplay.helpMessage}
                                </Box>
                            </ListItem>
                            <ListItem disableGutters>
                                <strong className={classes.listLabel}>
                                    Check Page Help Message:
                                </strong>
                                <Box pl={1} flex={1}>
                                    {classToDisplay.checkPageHelpMessage}
                                </Box>
                            </ListItem>
                            <ListItem disableGutters>
                                <strong className={classes.listLabel}>
                                    Emails Enabled:
                                </strong>
                                <Box pl={1} flex={1}>
                                    {classToDisplay.disableEmails
                                        ? 'No'
                                        : 'Yes'}
                                </Box>
                            </ListItem>
                        </List>
                    </Grid>
                    {classToDisplay.sessions.length > 0 && (
                        <Grid item xs={4}>
                            <label className={classes.sectionHeader}>
                                <span>Sessions</span>
                            </label>

                            <List disablePadding dense>
                                <ListItem disableGutters>
                                    <strong className={classes.listLabel}>
                                        Schedule:
                                    </strong>
                                    <Box pl={1}>
                                        <Grid container>
                                            <Grid
                                                item
                                                xs={12}
                                            >{`Every ${classToDisplay.schedule.weekdays.join(
                                                ', '
                                            )}`}</Grid>
                                            <Grid
                                                item
                                                xs={12}
                                            >{`Starting at ${startTime}`}</Grid>
                                        </Grid>
                                    </Box>
                                </ListItem>
                            </List>
                        </Grid>
                    )}

                    <Grid item xs={4}>
                        <label className={classes.sectionHeader}>
                            <span>Participants</span>
                        </label>

                        <List disablePadding dense>
                            {classToDisplay.participantsData &&
                                classToDisplay.participantsData.map(
                                    participant => (
                                        <ListItem
                                            disableGutters
                                            key={participant.user_id}
                                        >
                                            <Grid
                                                container
                                                alignItems="center"
                                                justifyContent="space-between"
                                            >
                                                {participant.nickname}
                                                <RequirePermissions
                                                    perms={['update:class']}
                                                >
                                                    <Tooltip
                                                        title={
                                                            'Remove from class'
                                                        }
                                                    >
                                                        <IconButton
                                                            className={
                                                                classes.deleteButton
                                                            }
                                                            onClick={() =>
                                                                handleDeleteClick(
                                                                    participant.user_id
                                                                )
                                                            }
                                                        >
                                                            <CloseIcon
                                                                className={
                                                                    classes.deleteButtonIcon
                                                                }
                                                            />
                                                        </IconButton>
                                                    </Tooltip>
                                                </RequirePermissions>
                                            </Grid>
                                        </ListItem>
                                    )
                                )}
                            {classToDisplay.capacity && (
                                <RequirePermissions perms={['update:class']}>
                                    <ListItem
                                        disableGutters
                                        key="add-participant"
                                    >
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            disabled={
                                                classToDisplay.participants
                                                    .length ===
                                                classToDisplay.capacity
                                            }
                                            onClick={handleAddParticipant}
                                        >
                                            Add Participant
                                        </Button>
                                    </ListItem>
                                </RequirePermissions>
                            )}
                        </List>
                    </Grid>
                </Grid>
            )}
        </>
    );
});

export default ClassDisplay;
