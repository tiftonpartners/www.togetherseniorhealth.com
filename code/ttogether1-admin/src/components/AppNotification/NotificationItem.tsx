import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';

export interface INotificationItemProps {
	notification: any; // TODO: make notification model
}
const NotificationItem: React.FC<INotificationItemProps> = ({ notification }) => {
	const { icon, image, title, time } = notification;
	return (
		<li className="media">
			<Avatar alt={image} src={image} className=" mr-2" />
			<div className="media-body align-self-center">
				<p className="sub-heading mb-0">{title}</p>
				<Button size="small" className="jr-btn jr-btn-xs mb-0">
					<i className={`zmdi ${icon} zmdi-hc-fw`} />
				</Button>{' '}
				<span className="meta-date">
					<small>{time}</small>
				</span>
			</div>
		</li>
	);
};

export default NotificationItem;
