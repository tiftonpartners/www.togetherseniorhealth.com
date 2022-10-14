import React from 'react';
import UserCell from './UserCell/index';

export interface IChatUserListProps {
	chatUsers: any[];
	onSelectUser: (chat: any) => void;
}
const ChatUserList: React.FC<IChatUserListProps> = ({ chatUsers, onSelectUser }) => {
	return (
		<div>
			{chatUsers.map((chat, index) => (
				<UserCell key={index} chat={chat} onSelectUser={onSelectUser} />
			))}
		</div>
	);
};

export default ChatUserList;
