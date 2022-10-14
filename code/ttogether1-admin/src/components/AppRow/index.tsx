import React from 'react';

export interface IAppRowProps {
	styleName: string;
}
const AppRow: React.FC<IAppRowProps> = ({ styleName, children }) => {
	return (
		<div className="row">
			<div className={`${styleName}`}>{children}</div>
		</div>
	);
};

export default AppRow;
