import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import { ISnackbarState } from 'store/ui/snackbar/reducers';
import { Alert } from '@material-ui/lab';
import { snackbarClear } from 'store/ui/snackbar/actions';
import { Snackbar } from '@material-ui/core';

const SnackbarWrapper = () => {
    const dispatch = useDispatch();
    const callSnackbarClear = useCallback(() => dispatch(snackbarClear()), [
        dispatch
    ]);

    const { type, message, visible } = useSelector<RootState, ISnackbarState>(
        state => state.snackbar
    );

    const handleClose = () => {
        dispatch(callSnackbarClear());
    };

    console.log(visible);

    return (
        <Snackbar
            open={visible && message && message !== ''}
            autoHideDuration={6000}
            onClose={handleClose}
        >
            <Alert onClose={handleClose} variant="filled" severity={type}>
                {message}
            </Alert>
        </Snackbar>
    );
};

export default SnackbarWrapper;
