import React from 'react';
import UserCell from './UserCell';

export interface IUserCellProps {
	chatUsers: any[]; // TODO: create chat users model
	selectedSectionId: string;
	onSelectUser: (chat: any) => void;
}

const ChatUserList: React.FC<IUserCellProps> = ({ chatUsers, selectedSectionId, onSelectUser }) => {
	return (
		<div className="chat-user">
			{chatUsers.map((chat, index) => (
				<UserCell key={index} chat={chat} selectedSectionId={selectedSectionId} onSelectUser={onSelectUser} />
			))}
		</div>
	);
};

export default ChatUserList;
