import React, { useState } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IntlMessages from 'util/IntlMessages';
import { useAuth0 } from '@auth0/auth0-react';

const UserInfo = () => {
	const { logout, user } = useAuth0();

	const [anchorE1, setAnchorE1] = useState(null);
	const [open, setOpen] = useState(false);

	const handleClick = (event) => {
		setOpen(true);
		setAnchorE1(event.currentTarget);
	};

	const handleRequestClose = () => {
		setOpen(false);
	};

	return (
		<>
			{user && (
				<div className="user-profile d-flex flex-row align-items-center">
					<Avatar alt={user.nickname} src={user.picture} className="user-avatar " />
					<div className="user-detail">
						<h4 className="user-name d-flex" onClick={handleClick}>
							<span className="text-truncate">{user.nickname}</span>{' '}
							<i className="zmdi zmdi-caret-down zmdi-hc-fw align-middle" />
						</h4>
					</div>
					<Menu
						className="user-info"
						id="simple-menu"
						anchorEl={anchorE1}
						open={open}
						onClose={handleRequestClose}
						PaperProps={{
							style: {
								minWidth: 120,
								paddingTop: 0,
								paddingBottom: 0
							}
						}}
					>
						<MenuItem onClick={handleRequestClose}>
							<i className="zmdi zmdi-account zmdi-hc-fw mr-2" />
							<IntlMessages id="popup.profile" />
						</MenuItem>
						<MenuItem onClick={handleRequestClose}>
							<i className="zmdi zmdi-settings zmdi-hc-fw mr-2" />
							<IntlMessages id="popup.setting" />
						</MenuItem>
						<MenuItem
							onClick={() => {
								handleRequestClose();
								logout();
							}}
						>
							<i className="zmdi zmdi-sign-in zmdi-hc-fw mr-2" />

							<IntlMessages id="popup.logout" />
						</MenuItem>
					</Menu>
				</div>
			)}
		</>
	);
};

export default UserInfo;
