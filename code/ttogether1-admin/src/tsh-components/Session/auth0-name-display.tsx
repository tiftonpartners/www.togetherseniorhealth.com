import React, { useCallback, useEffect } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { Selector, useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import {
    Box,
    FormGroup,
    InputAdornment,
    makeStyles,
    TextField
} from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { IAuth0User, IAuth0UserCollectionDTO } from 'types/auth0';
import { createSelector } from 'reselect';
import _ from 'lodash';

export interface IAuth0NameDisplayProps {
    authId: string;
}
const getAuth0UsersCollection: Selector<
    RootState,
    IAuth0UserCollectionDTO
> = state => state.auth0Users.collection;

const makeGetAuth0User = (authId: string) => {
    return createSelector<RootState, IAuth0UserCollectionDTO, IAuth0User>(
        [getAuth0UsersCollection],
        collection => {
            return _.get(collection, authId);
        }
    );
};

const Auth0NameDisplay: React.FC<IAuth0NameDisplayProps> = props => {
    const { authId } = props;
    const dispatch = useDispatch();

    const getAuth0User = makeGetAuth0User(authId);
    const auth0User = useSelector<RootState, IAuth0User>(state =>
        getAuth0User(state)
    );

    return <>{auth0User && auth0User.name}</>;
};

export default Auth0NameDisplay;
