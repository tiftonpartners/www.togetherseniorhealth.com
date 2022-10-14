import React from 'react';
import UserCell from './UserCell';

export interface IContactListProps {
	contactList: any[]; // TODO: create contact list model
	selectedSectionId: string;
	onSelectUser: (chat: any) => void;
}

const ContactList: React.FC<IContactListProps> = ({ onSelectUser, selectedSectionId, contactList }) => {
	return (
		<div className="chat-user">
			{contactList.map((user, index) => (
				<UserCell key={index} user={user} selectedSectionId={selectedSectionId} onSelectUser={onSelectUser} />
			))}
		</div>
	);
};

export default ContactList;
