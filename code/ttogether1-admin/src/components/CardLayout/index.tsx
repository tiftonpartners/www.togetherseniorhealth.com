import React from 'react';

export interface ICardLayoutProps {
	styleName: string;
}
const CardLayout: React.FC<ICardLayoutProps> = ({ children, styleName }) => {
	return <div className={`jr-card ${styleName}`}>{children}</div>;
};

export default CardLayout;
