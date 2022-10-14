import React, { useCallback, useEffect } from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import {
    Box,
    Breadcrumbs,
    Button,
    Card,
    CardActions,
    CardContent,
    Grid,
    IconButton,
    makeStyles,
    Typography
} from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import { ICourse } from 'types/course';
import { getAllCoursesAsync } from 'store/courses/actions';
import Link from 'next/link';
import { useModal } from 'util/modals';
import AddIcon from '@material-ui/icons/Add';
import CourseUpsertModal, {
    ICourseUpsertModalProps
} from 'tsh-components/Courses/course-upsert-modal';
import RequirePermissions from 'util/RequirePermissions';
import ProgramNameDisplay from 'tsh-components/Programs/program-name-display';
import router from 'next/router';
import ProgramSelect from 'tsh-components/Programs/program-select';

const useStyles = makeStyles(theme => ({
    root: {
        minWidth: 275
    },
    courseCard: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    courseCardContent: {
        flex: 1
    },
    courseAcronym: {
        fontSize: 14
    },
    courseName: {},
    courseProgram: {
        fontStyle: 'italic',
        marginBottom: 20
    },
    courseCardActions: {
        padding: theme.spacing(2)
    },
    courseDate: {
        marginBottom: 12
    },
    courseCardAddContent: {
        alignItems: 'center',
        display: 'flex',
        flex: 1,
        justifyContent: 'center'
    },
    courseAdd: {
        minHeight: 200,
        padding: 0,
        '& svg': {
            fontSize: 200
        }
    }
}));

const CoursesPage: NextPage = () => {
    const dispatch = useDispatch();
    const { showModal } = useModal();

    const classes = useStyles();
    const courses = useSelector<RootState, ICourse[]>(
        state => state.courses.collection
    );
    const selectedProgram = useSelector<RootState, string>(
        state => state.global.selectedProgram
    );

    const callGetAllCourses = useCallback(
        () =>
            dispatch(
                getAllCoursesAsync.request({
                    program: selectedProgram
                })
            ),
        [dispatch, selectedProgram]
    );

    const handleAddClick = () => {
        const modal = showModal(CourseUpsertModal, {
            courseToUpsert: {
                state: 'open'
            },
            onSubmit: () => modal.hide(),
            onCancel: () => modal.hide()
        } as ICourseUpsertModalProps);
    };

    useEffect(() => {
        if (selectedProgram) {
            callGetAllCourses();
        }
    }, [callGetAllCourses, selectedProgram]);

    return (
        <RequirePermissions perms={['query:course']}>
            <div className="app-wrapper">
                <Grid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Grid xs={4} item>
                        <Box mb={3}>
                            <Breadcrumbs aria-label="breadcrumb">
                                <Link href="/dashboard">Dashboard</Link>
                                <Typography color="textPrimary">
                                    Curriculum
                                </Typography>
                            </Breadcrumbs>
                        </Box>
                    </Grid>
                    <Grid xs={4} item container justifyContent="flex-end">
                        <Box mb={3}>
                            <ProgramSelect />
                        </Box>
                    </Grid>
                </Grid>

                <Grid container>
                    <h1>Courses</h1>
                </Grid>

                <Grid container spacing={2}>
                    {courses.map(course => (
                        <Grid item xs={6} sm={3} key={course._id}>
                            <Card className={classes.courseCard}>
                                <CardContent
                                    className={classes.courseCardContent}
                                >
                                    <Typography
                                        className={classes.courseAcronym}
                                        color="textSecondary"
                                        gutterBottom
                                    >
                                        {course.acronym}
                                    </Typography>
                                    <Typography
                                        className={classes.courseName}
                                        variant="h5"
                                        component="h3"
                                    >
                                        {course.name}
                                    </Typography>
                                    <Typography
                                        className={classes.courseProgram}
                                        color="textSecondary"
                                        gutterBottom
                                    >
                                        <ProgramNameDisplay
                                            acronym={course.program}
                                        />
                                    </Typography>
                                    <Typography
                                        className={classes.courseDate}
                                        color="textSecondary"
                                    >
                                        {course.displayCreatedOn}
                                    </Typography>
                                    <Typography variant="body2" component="p">
                                        {course.description}
                                    </Typography>
                                </CardContent>
                                <CardActions
                                    className={classes.courseCardActions}
                                >
                                    <Link
                                        href={`/curriculum/course/${course.acronym}`}
                                    >
                                        <Button variant="outlined">
                                            See Classes
                                        </Button>
                                    </Link>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                    <RequirePermissions perms={['create:course']}>
                        <Grid item xs={6} sm={3} key="AddCourse">
                            <Card className={classes.courseCard}>
                                <CardContent
                                    className={classes.courseCardAddContent}
                                >
                                    <IconButton
                                        aria-label="Add course"
                                        onClick={handleAddClick}
                                        className={classes.courseAdd}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        </Grid>
                    </RequirePermissions>
                </Grid>
            </div>
        </RequirePermissions>
    );
};

export default withAuthenticationRequired(CoursesPage);
