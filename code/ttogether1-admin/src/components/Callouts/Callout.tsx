import React from 'react';
import Button from '@material-ui/core/Button';
import IntlMessages from 'util/IntlMessages';

export interface ICallout {
	image: string;
	title: string;
	description: string;
}
export interface ICalloutProps {
	styleName: string;
	callout: ICallout;
}
const Callout: React.FC<ICalloutProps> = ({ styleName, callout }) => {
	const { image, title, description } = callout;
	return (
		<div className={`product-row ${styleName}`}>
			<div className="product-col product-thumb ">
				<div className="grid-thumb-equal">
					<span className="jr-link grid-thumb-cover">
						<img alt="Special Edition Party Spas" src={image} />
					</span>
				</div>
			</div>
			<div className="product-col product-content">
				<div className="product-content-inner">
					<h2 className="fw-regular">{title}</h2>
					<p>{description}</p>
					<Button color="primary">{<IntlMessages id="callouts.viewRange" />}</Button>
				</div>
			</div>
		</div>
	);
};

export default Callout;
