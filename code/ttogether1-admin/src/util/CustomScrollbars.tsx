import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

export interface ICustomScrollbarsProps {
	className?: string;
}

const CustomScrollbars: React.FC<ICustomScrollbarsProps> = (props) => (
	<Scrollbars
		{...props}
		autoHide
		renderTrackHorizontal={(props) => <div {...props} style={{ display: 'none' }} className="track-horizontal" />}
	/>
);

export default CustomScrollbars;
