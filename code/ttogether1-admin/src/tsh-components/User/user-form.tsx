import React, { useCallback, useEffect } from 'react';
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Grid,
    InputLabel,
    makeStyles,
    MenuItem,
    Select,
    TextField
} from '@material-ui/core';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { UserValidator } from 'store/users/validation';
import { getMyPrograms } from 'store/programs/selectors';
import {
    createUserAsync,
    ICreateUserPayload,
    IUpdateUserPayload,
    toggleEditUser,
    updateUserAsync
} from 'store/users/actions';
import { useDispatch, useSelector } from 'react-redux';
import { enumToArray } from 'store/helpers';
import _ from 'lodash';
import { IAVUser, User, userContactMethods, UserType } from 'types/user';
import { RootState } from 'typesafe-actions';
import { IProgram } from 'types/program';
import { getMyProgramsAsync } from 'store/programs/actions';

export interface IAVUserFormProps {
    userToUpsert: IAVUser;
    userType: UserType;
    onSubmit?: () => void;
    onCancel?: () => void;
}

const useStyles = makeStyles(theme => ({
    formGroup: {
        marginBottom: theme.spacing(3)
    },
    sectionHeader: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: theme.spacing(4),
        marginTop: theme.spacing(2),
        paddingBottom: theme.spacing(1),
        textTransform: 'uppercase',
        width: '100%'
    },
    formActions: {
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(4)
    }
}));

const UserForm: React.FC<IAVUserFormProps> = props => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { userToUpsert, userType, onSubmit, onCancel } = props;
    const { register, handleSubmit, errors, control } = useForm({
        resolver: yupResolver(UserValidator)
    });

    const user = userToUpsert || new User();
    const programs = useSelector<RootState, IProgram[]>(state =>
        getMyPrograms(state)
    );

    const callUpdateUser = useCallback(
        (payload: IUpdateUserPayload) =>
            dispatch(updateUserAsync.request(payload)),
        [dispatch]
    );

    const callCreateUser = useCallback(
        (payload: ICreateUserPayload) =>
            dispatch(createUserAsync.request(payload)),
        [dispatch]
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

    const handleFormSubmit = (user: IAVUser) => {
        // If user is already given an id we can assume this is an update
        if (_.get(userToUpsert, '_id')) {
            callUpdateUser({
                user: {
                    ...userToUpsert,
                    ...user
                },
                userType
            });
        } else {
            callCreateUser({
                user,
                userType
            });
        }

        if (onSubmit) {
            onSubmit();
        }
    };

    const handleFormCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    return (
        <form noValidate onSubmit={handleSubmit(handleFormSubmit)}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <label className={classes.sectionHeader}>User</label>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userSIDEdit"
                            name="sid"
                            label="Screener Id"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.sid}
                            error={errors.sid !== undefined}
                            helperText={errors.sid?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userPIDNEdit"
                            name="pidn"
                            label="Participant Id"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.pidn}
                            error={errors.pidn !== undefined}
                            helperText={errors.pidn?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userFirstNameEdit"
                            name="firstName"
                            label="First Name"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.firstName}
                            error={errors.firstName !== undefined}
                            helperText={errors.firstName?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userLastNameEdit"
                            name="lastName"
                            label="Last Name"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.lastName}
                            error={errors.lastName !== undefined}
                            helperText={errors.lastName?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userScreenNameEdit"
                            name="screenName"
                            label="Screen Name"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.screenName}
                            error={errors.screenName !== undefined}
                            helperText={errors.screenName?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userEmailEdit"
                            name="email"
                            label="Email"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.email}
                            error={errors.email !== undefined}
                            helperText={errors.email?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userPrimaryPhoneEdit"
                            name="primaryPhone"
                            label="Primary Contact Phone Number"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.primaryPhone}
                            error={errors.primaryPhone !== undefined}
                            helperText={errors.primaryPhone?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userMobilePhoneEdit"
                            name="mobilePhone"
                            label="Mobile Phone Number"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.mobilePhone}
                            error={errors.mobilePhone !== undefined}
                            helperText={errors.mobilePhone?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <FormControl
                            variant="outlined"
                            fullWidth
                            error={Boolean(errors.contactMethod)}
                        >
                            <InputLabel variant="outlined">
                                Preferred Contact Method
                            </InputLabel>
                            <Controller
                                as={
                                    <Select>
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {Array.from(
                                            userContactMethods.keys()
                                        ).map(key => (
                                            <MenuItem key={key} value={key}>
                                                {userContactMethods.get(key)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                }
                                name="contactMethod"
                                control={control}
                                label="Preferred Contact Method"
                                defaultValue={user.contactMethod}
                            />
                            <FormHelperText>
                                {errors.contactMethod &&
                                    errors.contactMethod.message}
                            </FormHelperText>
                        </FormControl>
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userStreetAddressEdit"
                            name="streetAddress"
                            label="Street Address"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.streetAddress}
                            error={errors.streetAddress !== undefined}
                            helperText={errors.streetAddress?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCityEdit"
                            name="city"
                            label="City"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.city}
                            error={errors.city !== undefined}
                            helperText={errors.city?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userZipCodeEdit"
                            name="zipCode"
                            label="Zip Code"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.zipCode}
                            error={errors.zipCode !== undefined}
                            helperText={errors.zipCode?.message}
                        />
                    </FormGroup>

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
                                defaultValue={user.program}
                            />
                            <FormHelperText>
                                {errors.productType &&
                                    errors.productType.message}
                            </FormHelperText>
                        </FormControl>
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    inputRef={register}
                                    defaultChecked={user.disableClassEmails}
                                    name="disableClassEmails"
                                />
                            }
                            label="Disable Class Emails?"
                        />
                    </FormGroup>
                </Grid>
                <Grid item xs={6}>
                    <label className={classes.sectionHeader}>Caregiver</label>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverFirstNameEdit"
                            name="caregiverFirstName"
                            label="Caregiver First Name"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverFirstName}
                            error={errors.caregiverFirstName !== undefined}
                            helperText={errors.caregiverFirstName?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverLastNameEdit"
                            name="caregiverLastName"
                            label="Caregiver Last Name"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverLastName}
                            error={errors.caregiverLastName !== undefined}
                            helperText={errors.caregiverLastName?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverEmailEdit"
                            name="caregiverEmail"
                            label="Caregiver Email"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverEmail}
                            error={errors.caregiverEmail !== undefined}
                            helperText={errors.caregiverEmail?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverPhoneEdit"
                            name="caregiverPhone"
                            label="Caregiver Primary Contact Phone Number"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverPhone}
                            error={errors.caregiverPhone !== undefined}
                            helperText={errors.caregiverPhone?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverMobilePhoneEdit"
                            name="caregiverMobilePhone"
                            label="Caregiver Mobile Phone Number"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverMobilePhone}
                            error={errors.caregiverMobilePhone !== undefined}
                            helperText={errors.caregiverMobilePhone?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <FormControl
                            variant="outlined"
                            fullWidth
                            error={Boolean(errors.caregiverContactMethod)}
                        >
                            <InputLabel variant="outlined">
                                Preferred Caregiver Contact Method
                            </InputLabel>
                            <Controller
                                as={
                                    <Select>
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {Array.from(
                                            userContactMethods.keys()
                                        ).map(key => (
                                            <MenuItem key={key} value={key}>
                                                {userContactMethods.get(key)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                }
                                name="caregiverContactMethod"
                                control={control}
                                label="Preferred Caregiver Contact Method"
                                defaultValue={user.caregiverContactMethod}
                            />
                            <FormHelperText>
                                {errors.caregiverContactMethod &&
                                    errors.caregiverContactMethod.message}
                            </FormHelperText>
                        </FormControl>
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverStreetAddressEdit"
                            name="caregiverStreetAddress"
                            label="Caregiver Street Address"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverStreetAddress}
                            error={errors.caregiverStreetAddress !== undefined}
                            helperText={errors.caregiverStreetAddress?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverCityEdit"
                            name="caregiverCity"
                            label="Caregiver City"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverCity}
                            error={errors.caregiverCity !== undefined}
                            helperText={errors.caregiverCity?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverZipCodeEdit"
                            name="caregiverZipCode"
                            label="Caregiver Zip Code"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverZipCode}
                            error={errors.caregiverZipCode !== undefined}
                            helperText={errors.caregiverZipCode?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCaregiverRelationshipEdit"
                            name="caregiverRel"
                            label="Caregiver Relationship"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.caregiverRel}
                            error={errors.caregiverRel !== undefined}
                            helperText={errors.caregiverRel?.message}
                        />
                    </FormGroup>
                    <FormGroup className={classes.formGroup}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    inputRef={register}
                                    defaultChecked={
                                        user.disableCaregiverClassEmails
                                    }
                                    name="disableCaregiverClassEmails"
                                />
                            }
                            label="Disable Class Emails?"
                        />
                    </FormGroup>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <label className={classes.sectionHeader}>Emergency</label>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userLocalEmergencyPhoneEdit"
                            name="localEmergencyPhone"
                            label="Local Emergency Phone Number"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.localEmergencyPhone}
                            error={errors.localEmergencyPhone !== undefined}
                            helperText={errors.localEmergencyPhone?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userPrimaryEmergencyPhoneEdit"
                            name="primaryEmergencyPhone"
                            label="Primary Emergency Phone Number"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.primaryEmergencyPhone}
                            error={errors.primaryEmergencyPhone !== undefined}
                            helperText={errors.primaryEmergencyPhone?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userSecondaryEmergencyPhoneEdit"
                            name="secondaryEmergencyPhone"
                            label="Secondary Emergency Phone Number"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.secondaryEmergencyPhone}
                            error={errors.secondaryEmergencyPhone !== undefined}
                            helperText={errors.secondaryEmergencyPhone?.message}
                        />
                    </FormGroup>
                </Grid>

                <Grid item xs={6}>
                    <label className={classes.sectionHeader}>Misc.</label>
                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userReferredByEdit"
                            name="referredBy"
                            label="Referred By"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.referredBy}
                            error={errors.referredBy !== undefined}
                            helperText={errors.referredBy?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userCommunicationEdit"
                            name="communication"
                            label="Communication / Status"
                            type="text"
                            fullWidth
                            inputRef={register}
                            defaultValue={user.communication}
                            error={errors.communication !== undefined}
                            helperText={errors.communication?.message}
                        />
                    </FormGroup>

                    <FormGroup className={classes.formGroup}>
                        <TextField
                            variant="outlined"
                            id="userNotesEdit"
                            name="notes"
                            label="Notes"
                            type="text"
                            fullWidth
                            inputRef={register}
                            rows={4}
                            multiline
                            defaultValue={user.notes}
                            error={errors.notes !== undefined}
                            helperText={errors.notes?.message}
                        />
                    </FormGroup>
                </Grid>
            </Grid>

            <Grid
                container
                spacing={2}
                justifyContent="flex-end"
                className={classes.formActions}
            >
                <Grid item>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleFormCancel}
                    >
                        Cancel
                    </Button>
                </Grid>

                <Grid item>
                    <Button variant="contained" color="primary" type="submit">
                        Save User
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
};

export default UserForm;
