import _ from 'lodash';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserByIdAsync } from 'store/users/actions';
import { makeGetUserInfo } from 'store/users/selectors';
import { IUserInfo } from 'types/auth0';
import { RootState } from 'typesafe-actions';

const checkPermissions = (
    permsGranted: string[],
    permsNeeded: string[],
    permsOrNeeded: string[]
) => {
    // must have ALL of these
    for (let i = 0; i < permsNeeded.length; i++) {
        if (!permsGranted.includes(permsNeeded[i])) {
            return false;
        }
    }

    let permittedOr = false;

    if (permsOrNeeded.length > 0) {
        // must have at least one
        for (let i = 0; i < permsOrNeeded.length; i++) {
            if (permsGranted.includes(permsOrNeeded[i])) {
                permittedOr = true;
            }
        }

        return permittedOr;
    } else {
        return true;
    }
};

const useRequirePermissions = (
    perms: string[] = [],
    permsOr: string[] = []
) => {
    if (process.env.NEXT_PUBLIC_PERMISSIONS_AUTH_ENABLED !== 'true') {
        return {
            permitted: true,
            loading: false
        };
    }

    const dispatch = useDispatch();

    const getUserInfo = makeGetUserInfo('me');
    const currentUser = useSelector<RootState, IUserInfo>(state =>
        getUserInfo(state)
    );

    const callGetUser = useCallback(() => {
        dispatch(
            getUserByIdAsync.request({
                id: 'me'
            })
        );
    }, [dispatch]);

    useEffect(() => {
        if (!currentUser) {
            callGetUser();
        }
    }, [callGetUser, currentUser]);

    return {
        loading: currentUser === undefined,
        permitted:
            currentUser && _.get(currentUser, 'token.permissions')
                ? checkPermissions(
                      currentUser.token.permissions,
                      perms,
                      permsOr
                  )
                : false
    };
};

export default useRequirePermissions;
