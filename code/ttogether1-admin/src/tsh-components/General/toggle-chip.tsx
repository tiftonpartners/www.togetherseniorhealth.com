import React from 'react';
import { Chip } from '@material-ui/core';

export interface IBaseProductGroupChip {
	active: boolean;
	displayValue: string;
	id: string | number;
	onChipClicked: (value: string | number) => void;
}

const ToggleChip = React.memo((props: IBaseProductGroupChip) => {
	const { id, active, displayValue, onChipClicked } = props;

	const handleClick = () => {
		onChipClicked(id);
	};

	return (
		<Chip
			size="small"
			label={displayValue}
			clickable
			color={active ? 'primary' : 'default'}
			onClick={handleClick}
		/>
	);
});

export default ToggleChip;
