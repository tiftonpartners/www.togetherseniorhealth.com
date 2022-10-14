import React, { useCallback, useEffect } from 'react';
import {
    getProgramsCollection,
    makeGetProgram
} from 'store/programs/selectors';
import { Selector, useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import _ from 'lodash';
import { IProgram } from 'types/program';
import { getAllProgramsAsync } from 'store/programs/actions';

export interface IProgramNameDisplayProps {
    acronym: string;
}

const ProgramNameDisplay: React.FC<IProgramNameDisplayProps> = React.memo(
    props => {
        const { acronym } = props;
        const dispatch = useDispatch();

        const getProgram = makeGetProgram(acronym);
        const program = useSelector<RootState, IProgram>(state =>
            getProgram(state)
        );

        const programLongName = program ? program.longName : '';

        const callGetAllPrograms = useCallback(
            () => dispatch(getAllProgramsAsync.request({})),
            [dispatch]
        );

        useEffect(() => {
            if (programLongName === '') {
                callGetAllPrograms();
            }
        }, [callGetAllPrograms, programLongName]);
        return <>{programLongName}</>;
    }
);

export default ProgramNameDisplay;
