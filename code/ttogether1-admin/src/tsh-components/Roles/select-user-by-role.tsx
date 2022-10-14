import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import {
    Box,
    FormControl,
    FormGroup,
    FormHelperText,
    InputLabel,
    makeStyles,
    MenuItem,
    Select
} from '@material-ui/core';
import { IAuth0User } from 'types/auth0';
import _ from 'lodash';
import { getAuth0UsersByRoleAsync } from 'store/auth0Users/actions';

const useStyles = makeStyles(theme => ({
    formGroup: {
        marginBottom: theme.spacing(3),
        width: '100%'
    }
}));

export interface ISelectUserFromRoleProps {
    formLabel: string;
    role: string;
    onSelectUser: (userId: string) => void;
    selectedUserId: string;
    defaultUserId: string;
    required?: boolean;
    submitted?: boolean;
}

const SelectUserFromRole: React.FC<ISelectUserFromRoleProps> = React.memo(
    (props: ISelectUserFromRoleProps) => {
        const {
            role,
            formLabel,
            onSelectUser,
            selectedUserId,
            defaultUserId,
            required,
            submitted
        } = props;

        const classes = useStyles();
        const dispatch = useDispatch();

        const usersByRole = useSelector<RootState, string[]>(
            state => state.auth0Users.byRole[role]
        );

        const users = useSelector<RootState, IAuth0User[]>(state => {
            return usersByRole
                ? usersByRole.map(userId =>
                      _.get(state.auth0Users.collection, userId)
                  )
                : [];
        });

        const callGetUsersByRole = useCallback(() => {
            return dispatch(
                getAuth0UsersByRoleAsync.request({
                    role
                })
            );
        }, [dispatch]);

        useEffect(() => {
            if (!users || users.length == 0) {
                callGetUsersByRole();
            }
        }, [callGetUsersByRole, users.length]);

        const handleChangeUser = (
            event: React.ChangeEvent<{
                name?: string;
                value: string;
            }>
        ) => {
            const selectedUser = users.find(
                user => user.user_id === event.target.value
            );
            onSelectUser(selectedUser.user_id);
        };

        return (
            <FormGroup className={classes.formGroup}>
                <FormControl
                    variant="outlined"
                    margin="none"
                    error={!selectedUserId && submitted}
                >
                    <InputLabel>{formLabel}</InputLabel>
                    <Select
                        labelId="instructor-select-label"
                        id="instructor-select"
                        value={
                            users && users.length > 0
                                ? selectedUserId
                                    ? selectedUserId
                                    : defaultUserId || ''
                                : ''
                        }
                        onChange={handleChangeUser}
                        fullWidth
                        variant="outlined"
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {users.map(item => (
                            <MenuItem key={item.user_id} value={item.user_id}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>
                        {required &&
                            !selectedUserId &&
                            submitted &&
                            `Must select a ${formLabel}`}
                    </FormHelperText>
                </FormControl>
            </FormGroup>
        );
    }
);

export default SelectUserFromRole;
