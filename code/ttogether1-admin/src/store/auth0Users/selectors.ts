import { Role } from 'auth0';
import _ from 'lodash';
import { createSelector, Selector } from 'reselect';
import { IAuth0RoleCollectionDTO } from 'types/auth0';
import { RootState } from 'typesafe-actions';

export const getRolesCollection: Selector<
    RootState,
    IAuth0RoleCollectionDTO
> = state => state.auth0Users.rolesCollection;

export const getRoleIdsByUser: Selector<
    RootState,
    { [key: string]: string[] }
> = state => state.auth0Users.rolesByUserId;

export const getAllRoles = createSelector<
    RootState,
    IAuth0RoleCollectionDTO,
    Role[] | undefined
>([getRolesCollection], rolesCollection => {
    let roles: Role[] = [];

    for (const key in rolesCollection) {
        roles.push(rolesCollection[key]);
    }
    return roles.length === 0 ? undefined : _.sortBy(roles, ['name']);
});

export const makeGetRolesForUser = (userId: string) => {
    return createSelector<
        RootState,
        { [key: string]: string[] },
        IAuth0RoleCollectionDTO,
        Role[] | undefined
    >([getRoleIdsByUser, getRolesCollection], (rolesByUserId, collection) => {
        const roleIds = _.get(rolesByUserId, userId) || [];
        return roleIds.length === 0
            ? undefined
            : roleIds.map(id => _.get(collection, id));
    });
};
