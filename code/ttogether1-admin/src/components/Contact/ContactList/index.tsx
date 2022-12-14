import React from 'react';
import ContactCell from './ContactCell/index';

export interface IChatUserListProps {
	contactList: any[];
	onSelectUser: (chat: any) => void;
}

const ContactList = ({ contactList, addFavourite, onContactSelect, onSaveContact, onDeleteContact }) => {
	return (
		<div className="contact-main-content">
			{contactList.map((contact, index) => (
				<ContactCell
					key={index}
					contact={contact}
					onDeleteContact={onDeleteContact}
					onSaveContact={onSaveContact}
					addFavourite={addFavourite}
					onContactSelect={onContactSelect}
				/>
			))}
		</div>
	);
};

export default ContactList;
