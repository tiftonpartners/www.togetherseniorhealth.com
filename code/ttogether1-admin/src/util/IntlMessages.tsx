import React from 'react';
import { FormattedMessage } from 'react-intl';

export interface IIntlMessagesProps {
	id: string;
	children?: never;
}

const IntlMessages: React.FC<IIntlMessagesProps> = (props) => {
	return <FormattedMessage {...props} />;
};
export default IntlMessages;
