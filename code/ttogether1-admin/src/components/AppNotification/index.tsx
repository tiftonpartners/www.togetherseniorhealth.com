import React from 'react';

import NotificationItem from './NotificationItem';
import { notifications } from './data';
import CustomScrollbars from 'util/CustomScrollbars';

const AppNotification: React.FC = () => {
	return (
		<CustomScrollbars className="messages-list scrollbar">
			<ul className="list-unstyled">
				{notifications.map((notification, index) => (
					<NotificationItem key={index} notification={notification} />
				))}
			</ul>
		</CustomScrollbars>
	);
};

export default AppNotification;
