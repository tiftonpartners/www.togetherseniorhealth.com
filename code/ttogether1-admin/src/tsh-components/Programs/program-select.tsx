import React, { useCallback, useEffect } from 'react';
import { getMyPrograms } from 'store/programs/selectors';
import { Selector, useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import _ from 'lodash';
import { IProgram } from 'types/program';
import { getMyProgramsAsync } from 'store/programs/actions';
import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    makeStyles
} from '@material-ui/core';
import { updateProgramSelection } from 'store/ui/global/actions';
import router from 'next/router';

export interface IProgramSelectProps {}

const useStyles = makeStyles(theme => ({
    select: {
        width: 200
    }
}));

const ProgramSelect: React.FC<IProgramSelectProps> = React.memo(props => {
    const dispatch = useDispatch();
    const classes = useStyles();
    const { selectedProgram } = router.query;

    const programs = useSelector<RootState, IProgram[]>(state =>
        getMyPrograms(state)
    );

    const selectedProgramAcronym = useSelector<RootState, string>(
        state => state.global.selectedProgram
    );

    const hasAll = useSelector<RootState, boolean>(
        state => state.programs.me.all
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

    useEffect(() => {
        if (programs && programs.length > 0 && selectedProgramAcronym === '') {
            if (hasAll && !selectedProgram) {
                dispatch(updateProgramSelection('ALL'));
            } else {
                dispatch(
                    updateProgramSelection(
                        (selectedProgram as string) || programs[0].acronym
                    )
                );
            }
        }
    }, [programs, hasAll]);

    const handleChangeProgramFilter = (
        event: React.ChangeEvent<{
            name?: string;
            value: string;
        }>
    ) => {
        dispatch(updateProgramSelection(event.target.value));
    };
    return (
        <>
            {programs && programs.length > 0 && (
                <FormControl>
                    <InputLabel>Program</InputLabel>
                    <Select
                        className={classes.select}
                        value={selectedProgramAcronym}
                        onChange={handleChangeProgramFilter}
                    >
                        {programs.map(item => (
                            <MenuItem key={item.acronym} value={item.acronym}>
                                {item.shortName}
                            </MenuItem>
                        ))}
                        {hasAll && (
                            <MenuItem key="all" value="ALL">
                                All
                            </MenuItem>
                        )}
                    </Select>
                </FormControl>
            )}
        </>
    );
});

export default ProgramSelect;
