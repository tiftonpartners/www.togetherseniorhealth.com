import React, { useCallback, useEffect, useState } from 'react';
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
import { ICourse } from 'types/course';
import { useDispatch, useSelector } from 'react-redux';
import { IClass } from 'types/class';
import { getAllCoursesAsync } from 'store/courses/actions';
import { RootState } from 'typesafe-actions';
import {
    assignUserToClassByIdAsync,
    crossProgramConfirmToggle,
    getClassesByCourseAcronymAsync,
    IAssignUserToClassByIdPayload
} from 'store/classes/actions';
import { makeGetClassesByCourse } from 'store/classes/selectors';
import { useRouter } from 'next/router';
import ConfirmModal, { IConfirmModalProps } from 'util/modals/ConfirmModal';
import { useModal } from 'util/modals';

export interface IUserAssignToClassModalProps extends IModalProps {
    title: string;
    userId: string;
    submitText?: string;
    onSubmit: () => void;
    onCancel: () => void;
}

const useStyles = makeStyles(theme => ({
    dialogActions: {
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(3)
    }
}));

const UserAssignToClassModal: React.FC<IUserAssignToClassModalProps> = props => {
    const {
        onSubmit,
        onCancel,
        submitText,
        title,
        userId,
        ...otherProps
    } = props;

    const selectedCourse = useSelector<RootState, string>(
        state => state.global.selectedCourse
    );

    const selectedClass = useSelector<RootState, string>(
        state => state.global.selectedClass
    );

    const classes = useStyles();
    const dispatch = useDispatch();
    const { showModal } = useModal();

    const [selectedCourseAcronym, setSelectedCourseAcronym] = useState<string>(
        selectedCourse ? String(selectedCourse) : ''
    );
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [submitted, setSubmitted] = useState<boolean>(false);

    const courses = useSelector<RootState, ICourse[]>(
        state => state.courses.collection
    );

    const isCrossProgram = useSelector<RootState, boolean>(
        state => state.classes.crossProgram
    );

    const getClassesByCourse =
        selectedCourseAcronym !== ''
            ? makeGetClassesByCourse(selectedCourseAcronym)
            : (state: any) => [] as IClass[];
    const classesByCourse = useSelector<RootState, IClass[]>(state =>
        getClassesByCourse(state)
    );

    const handleChangeCourse = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        setSelectedCourseAcronym(event.target.value);
    };

    const handleChangeClass = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        setSelectedClassId(event.target.value);
    };

    const handleSubmit = () => {
        setSubmitted(true);

        if (!selectedCourseAcronym || !selectedClassId) {
            return;
        }

        callAssignUserToClassById({
            userId,
            classId: selectedClassId,
            successCallback: onSubmit
        });
    };

    const callAssignUserToClassById = useCallback(
        (payload: IAssignUserToClassByIdPayload) =>
            dispatch(assignUserToClassByIdAsync.request(payload)),
        [dispatch]
    );

    const callGetAllCourses = useCallback(
        () => dispatch(getAllCoursesAsync.request({})),
        [dispatch]
    );

    const callGetAllClassesByCourseAcronym = useCallback(
        (courseAcronym: string) =>
            dispatch(getClassesByCourseAcronymAsync.request(courseAcronym)),
        [dispatch]
    );

    useEffect(() => {
        if (selectedCourseAcronym !== '') {
            callGetAllClassesByCourseAcronym(selectedCourseAcronym);
        }
    }, [selectedCourseAcronym]);

    useEffect(() => {
        if (isCrossProgram) {
            const modal = showModal(ConfirmModal, {
                title: 'Program mismatch',
                contentText:
                    'Participant and Class have different program types. Are you sure you want to assign?',
                submitText: 'Assign',
                onSubmit: () => {
                    // call again with cross program confirmation
                    callAssignUserToClassById({
                        userId,
                        classId: selectedClassId,
                        successCallback: onSubmit,
                        crossProgramConfirmed: true
                    });
                    dispatch(crossProgramConfirmToggle());
                    modal.hide();
                },
                onCancel: () => {
                    dispatch(crossProgramConfirmToggle());
                    modal.hide();
                }
            } as IConfirmModalProps);
        }
    }, [isCrossProgram]);

    useEffect(() => {
        // if a class acronym is selected in redux
        if (
            selectedClass &&
            selectedClassId === '' &&
            classesByCourse &&
            classesByCourse.length > 0
        ) {
            const klass = classesByCourse.find(
                klass => klass.acronym === selectedClass
            );
            if (klass) {
                setSelectedClassId(klass._id);
            }
        }
    }, [selectedClass, selectedClassId, classesByCourse]);

    useEffect(() => {
        callGetAllCourses();
    }, [callGetAllCourses]);
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

            <Box px={3} py={1}>
                <FormGroup>
                    <FormControl
                        margin="normal"
                        error={!selectedCourseAcronym && submitted}
                    >
                        <InputLabel id="course-select-label">Course</InputLabel>
                        <Select
                            labelId="course-select-label"
                            id="course-select"
                            value={selectedCourseAcronym}
                            onChange={handleChangeCourse}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {courses.map(course => (
                                <MenuItem
                                    key={course._id}
                                    value={course.acronym}
                                >
                                    {course.name}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {!selectedCourseAcronym &&
                                submitted &&
                                'Must select a course'}
                        </FormHelperText>
                    </FormControl>
                </FormGroup>
            </Box>

            <Box px={3}>
                <FormGroup>
                    <FormControl
                        margin="normal"
                        error={!selectedClassId && submitted}
                    >
                        <InputLabel id="class-select-label">Class</InputLabel>
                        <Select
                            labelId="class-select-label"
                            id="class-select"
                            disabled={!selectedCourseAcronym}
                            value={selectedClassId}
                            onChange={handleChangeClass}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {classesByCourse.map(klass => (
                                <MenuItem key={klass._id} value={klass._id}>
                                    {klass.name}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {!selectedClassId &&
                                submitted &&
                                'Must select a class'}
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
                    {submitText || 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserAssignToClassModal;
