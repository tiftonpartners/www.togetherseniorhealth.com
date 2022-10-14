// @ts-nocheck
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import IntlMessages from 'util/IntlMessages';

const UserInfoPopup = () => {
	const { logout } = useAuth0();

	return (
		<div>
			<div className="user-profile">
				<img
					className="user-avatar border-0 size-40 rounded-circle"
					src="https://via.placeholder.com/150x150"
					alt="User"
				/>
				<div className="user-detail ml-2">
					<h4 className="user-name mb-0">Chris Harris</h4>
					<small>Administrator</small>
				</div>
			</div>
			<span className="jr-link dropdown-item text-muted">
				<i className="zmdi zmdi-face zmdi-hc-fw mr-1" />
				<IntlMessages id="popup.profile" />
			</span>
			<span className="jr-link dropdown-item text-muted">
				<i className="zmdi zmdi-settings zmdi-hc-fw mr-1" />
				<IntlMessages id="popup.setting" />
			</span>
			<span className="jr-link dropdown-item text-muted" onClick={logout}>
				<i className="zmdi zmdi-sign-in zmdi-hc-fw mr-1" />
				<IntlMessages id="popup.logout" />
			</span>
		</div>
	);
};

export default UserInfoPopup;
