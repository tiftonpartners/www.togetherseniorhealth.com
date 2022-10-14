import React from 'react';
import Menu from './Menu';

export interface ITopNavProps {
	styleName: string;
}
const TopNav = (props: ITopNavProps) => {
	return (
		<div className={`app-top-nav d-none d-md-block ${props.styleName}`}>
			<div className="d-flex app-toolbar align-items-center">
				<Menu />
			</div>
		</div>
	);
};

export default TopNav;

TopNav.defaultProps = {
	styleName: ''
};
