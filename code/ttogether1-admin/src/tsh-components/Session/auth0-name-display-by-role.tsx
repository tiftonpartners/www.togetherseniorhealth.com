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
import { getAuth0UsersByRoleAsync } from 'store/auth0Users/actions';

export interface IAuth0NameDisplayByRoleProps {
    authId: string;
    role: string;
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

const Auth0NameDisplayByRole: React.FC<IAuth0NameDisplayByRoleProps> = React.memo(
    (props: IAuth0NameDisplayByRoleProps) => {
        const { authId, role } = props;
        const dispatch = useDispatch();

        const callGetUsersByRole = useCallback(() => {
            return dispatch(
                getAuth0UsersByRoleAsync.request({
                    role
                })
            );
        }, [dispatch]);

        const getAuth0User = makeGetAuth0User(authId);
        const auth0User = useSelector<RootState, IAuth0User>(state =>
            getAuth0User(state)
        );

        useEffect(() => {
            if (!auth0User) {
                callGetUsersByRole();
            }
        }, [callGetUsersByRole]);

        return <>{auth0User && auth0User.name}</>;
    }
);

export default Auth0NameDisplayByRole;
