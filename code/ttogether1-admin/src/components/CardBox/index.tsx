import React from 'react';

export interface ICardBoxProps {
	heading: string;
	styleName: string;
	cardStyle: string;
	childrenStyle: string;
	headerOutside: boolean;
	headingStyle: string;
}
const CardBox: React.FC<ICardBoxProps> = ({
	heading,
	children,
	styleName,
	cardStyle,
	childrenStyle,
	headerOutside,
	headingStyle
}) => {
	return (
		<div className={`${styleName}`}>
			{headerOutside && (
				<div className="jr-entry-header">
					<h3 className="entry-heading">{heading}</h3>
					{children && <div className="entry-description">{children[0]}</div>}
				</div>
			)}

			<div className={`jr-card ${cardStyle}`}>
				{!headerOutside &&
					heading && (
						<div className={`jr-card-header ${headingStyle}`}>
							<h3 className="card-heading">{heading}</h3>
							{children && <div className="sub-heading">{children}</div>}
						</div>
					)}
				<div className={`jr-card-body ${childrenStyle}`}>{children && children}</div>
			</div>
		</div>
	);
};

export default CardBox;

CardBox.defaultProps = {
	cardStyle: '',
	headingStyle: '',
	childrenStyle: '',
	styleName: 'col-lg-6 col-sm-12'
};
