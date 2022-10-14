import React, { useState } from 'react';
import { useTheme } from '@material-ui/styles';
import SwipeableViews from 'react-swipeable-views';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

export interface ICardTabsProps {
	dir?: string;
}
const TabContainer: React.FC<ICardTabsProps> = ({ children, dir }) => {
	return (
		<div dir={dir} style={{ padding: 8 * 3 }}>
			{children}
		</div>
	);
};

const CardTabs: React.FC<ICardTabsProps> = (props) => {
	const [value, setValue] = useState(0);
	const theme = useTheme();

	const handleChange = (event, value) => {
		setValue(value);
	};

	const handleChangeIndex = (index) => {
		setValue(index);
	};

	return (
		<div>
			<Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary">
				<Tab className="tab" label="HOME" />
				<Tab className="tab" label="PROFILE" />
				<Tab className="tab" label="MESSAGES" />
			</Tabs>
			<SwipeableViews
				axis={theme.hasOwnProperty('direction') && theme['direction'] === 'rtl' ? 'x-reverse' : 'x'}
				index={value}
				onChangeIndex={handleChangeIndex}
			>
				<TabContainer dir={theme['direction']}>
					Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore
					et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
					aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
					cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
					culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus
					error sit voluptatem accusantium doloremque laudantium, totam rem.
				</TabContainer>
				<TabContainer dir={theme['direction']}>
					It is a long established fact that a reader will be distracted by the readable content of a page
					when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal
					distribution of letters, as opposed to using 'Content here, content here', making it look like
					readable English
				</TabContainer>
				<TabContainer dir={theme['direction']}>
					There are many variations of passages of Lorem Ipsum available, but the majority have suffered
					alteration in some form, by injected humour, or randomised words which don't look even slightly
					believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't
					anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet
					tend to repeat predefined chunks as necessary, making this the first true generator on the Internet.{' '}
				</TabContainer>
			</SwipeableViews>
		</div>
	);
};

export default CardTabs;
