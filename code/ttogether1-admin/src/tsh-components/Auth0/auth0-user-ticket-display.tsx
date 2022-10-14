import React, { useCallback, useEffect } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import { getTicketForAuth0UserAsync } from 'store/auth0Users/actions';
import { FormGroup, InputAdornment, TextField } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';

export interface IAuth0UserTicketDisplayProps {
	userId: string;
}

const Auth0UserTicketDisplay: React.FC<IAuth0UserTicketDisplayProps> = (props) => {
	const { userId } = props;
	const dispatch = useDispatch();

	const ticket = useSelector<RootState, string>((state) => state.auth0Users.collection[userId]['ticket']);

	const callGetTicketForAuth0User = useCallback((id: string) => dispatch(getTicketForAuth0UserAsync.request(id)), [
		dispatch
	]);

	const handleCopyTicket = () => {
		copyToClipboard(ticket);
	};

	useEffect(() => {
		if (!ticket || ticket === '') {
			callGetTicketForAuth0User(userId);
		}
	}, [callGetTicketForAuth0User]);

	return (
		<>
			{ticket && (
				<FormGroup>
					<TextField
						disabled
						id="user-ticket"
						label="User Ticket"
						value={ticket}
						variant="filled"
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton aria-label="Copy user ticket" onClick={handleCopyTicket}>
										<FileCopyIcon />
									</IconButton>
								</InputAdornment>
							)
						}}
					/>
				</FormGroup>
			)}
		</>
	);
};

export default Auth0UserTicketDisplay;
