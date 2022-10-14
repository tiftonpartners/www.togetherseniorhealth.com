import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
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
    createCourseAsync,
    ICreateCoursePayload,
    IUpdateCoursePayload,
    updateCourseAsync
} from 'store/courses/actions';
import { CourseValidator } from 'store/courses/validation';
import { IProps as IModalProps } from 'util/modals/State';
import { ICourse } from 'types/course';
import CourseForm from './course-form';

export interface ICourseUpsertModalProps extends IModalProps {
    courseToUpsert: ICourse;
    onSubmit: () => void;
    onCancel: () => void;
}

const useStyles = makeStyles(theme => ({
    dialogActions: {
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(3)
    }
}));

const CourseUpsertModal: React.FC<ICourseUpsertModalProps> = props => {
    const dispatch = useDispatch();
    const classes = useStyles();
    const { register, handleSubmit, control, errors } = useForm({
        resolver: yupResolver(CourseValidator)
    });
    const { onSubmit, onCancel, courseToUpsert, ...otherProps } = props;

    const callUpdateCourse = useCallback(
        (payload: IUpdateCoursePayload) =>
            dispatch(updateCourseAsync.request(payload)),
        [dispatch]
    );

    const callCreateCourse = useCallback(
        (payload: ICreateCoursePayload) =>
            dispatch(createCourseAsync.request(payload)),
        [dispatch]
    );

    const handleFormSubmit = (course: ICourse) => {
        // If course is already given an id we can assume this is an update
        if (courseToUpsert._id) {
            callUpdateCourse({
                acronym: courseToUpsert.acronym,
                course
            });
        } else {
            callCreateCourse({
                course
            });
        }

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
            {courseToUpsert && (
                <form noValidate onSubmit={handleSubmit(handleFormSubmit)}>
                    <DialogTitle id="form-dialog-title">
                        {courseToUpsert._id ? 'Edit' : 'Create'} Course
                    </DialogTitle>
                    <DialogContent>
                        <CourseForm
                            courseToUpsert={courseToUpsert}
                            register={register}
                            control={control}
                            errors={errors}
                        />
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
                            Save Course
                        </Button>
                    </DialogActions>
                </form>
            )}
        </Dialog>
    );
};

export default CourseUpsertModal;
