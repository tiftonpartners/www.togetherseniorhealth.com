import React, { useCallback, useEffect } from 'react';
import {
    FormControl,
    FormGroup,
    FormHelperText,
    Grid,
    InputLabel,
    makeStyles,
    MenuItem,
    Select,
    TextField
} from '@material-ui/core';
import { ICourse } from 'types/course';
import { getMyPrograms } from 'store/programs/selectors';
import { Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import { IProgram } from 'types/program';
import {
    getAllProgramsAsync,
    getMyProgramsAsync
} from 'store/programs/actions';

export interface ICourseFormProps {
    courseToUpsert: ICourse;
    register: any;
    errors: any;
    control: any;
}

const useStyles = makeStyles(theme => ({
    formGroup: {
        marginBottom: theme.spacing(3)
    }
}));

const CourseForm: React.FC<ICourseFormProps> = props => {
    const { courseToUpsert, register, control, errors } = props;
    const dispatch = useDispatch();
    const classes = useStyles();
    const programs = useSelector<RootState, IProgram[]>(state =>
        getMyPrograms(state)
    );

    const callGetMyPrograms = useCallback(
        () => dispatch(getMyProgramsAsync.request({})),
        [dispatch]
    );

    useEffect(() => {
        if (!programs) {
            callGetMyPrograms();
        }
    }, [callGetMyPrograms]);

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="courseNameEdit"
                            name="name"
                            label="Name"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={courseToUpsert.name}
                            error={errors.name !== undefined}
                            helperText={errors.name?.message}
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="courseDescriptionEdit"
                            name="description"
                            label="Description"
                            type="text"
                            multiline
                            rows={4}
                            fullWidth
                            inputRef={register}
                            defaultValue={courseToUpsert.description}
                            error={errors.description !== undefined}
                            helperText={errors.description?.message}
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="courseAcronymEdit"
                            name="acronym"
                            label="Acronym"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={courseToUpsert.acronym}
                            error={errors.acronym !== undefined}
                            helperText={errors.acronym?.message}
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <FormControl
                            variant="outlined"
                            fullWidth
                            error={Boolean(errors.program)}
                        >
                            <InputLabel variant="outlined">Program</InputLabel>
                            <Controller
                                as={
                                    <Select>
                                        {programs.map((option, i) => (
                                            <MenuItem
                                                key={i}
                                                value={option.acronym}
                                            >
                                                {option.shortName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                }
                                name="program"
                                control={control}
                                label="Program"
                                defaultValue={
                                    courseToUpsert.program ||
                                    programs[0].acronym
                                }
                            />
                            <FormHelperText>
                                {errors.productType &&
                                    errors.productType.message}
                            </FormHelperText>
                        </FormControl>
                    </FormGroup>
                </Grid>

                <Grid item xs={12}>
                    <FormGroup className={classes.formGroup}>
                        <FormControl variant="outlined">
                            <InputLabel
                                id="courseStateEditLabel"
                                variant="outlined"
                            >
                                State
                            </InputLabel>
                            <Select
                                labelId="courseStateEditLabel"
                                id="courseStateEdit"
                                defaultValue={courseToUpsert.state}
                                error={errors.state !== undefined}
                                ref={register}
                                variant="outlined"
                            >
                                <MenuItem value="waitl">Waitlisted</MenuItem>
                                <MenuItem value="open" selected>
                                    Open
                                </MenuItem>
                                <MenuItem value="done">Done</MenuItem>
                            </Select>
                            <FormHelperText>
                                {errors.state?.message}
                            </FormHelperText>
                        </FormControl>
                    </FormGroup>
                </Grid>
            </Grid>
        </>
    );
};

export default CourseForm;
