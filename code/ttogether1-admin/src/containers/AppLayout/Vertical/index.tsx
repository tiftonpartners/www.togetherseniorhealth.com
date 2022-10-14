import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Header from './Header/index';
import SideBar from 'containers/SideBar/index';
import Footer from 'components/Footer';
import Tour from 'components/Tour/index';
import { isIOS, isMobile } from 'react-device-detect';
import { DrawerTypes } from 'constants/Enums';
import { RootState } from 'typesafe-actions';

const Vertical = (props) => {
	const drawerType = useSelector<RootState, DrawerTypes>(({ settings }) => settings.drawerType);
	const drawerStyle = drawerType.includes(DrawerTypes.FIXED_DRAWER)
		? 'fixed-drawer'
		: drawerType.includes(DrawerTypes.COLLAPSED_DRAWER)
		? 'collapsible-drawer'
		: 'mini-drawer';

	useEffect(() => {
		//set default height and overflow for iOS mobile Safari 10+ support.
		if (isIOS && isMobile) {
			document.body.classList.add('ios-mobile-view-height');
		} else if (document.body.classList.contains('ios-mobile-view-height')) {
			document.body.classList.remove('ios-mobile-view-height');
		}
	}, [isIOS, isMobile]);

	return (
		<div className={`app-container ${drawerStyle}`}>
			{/* <Tour /> */}

			<SideBar />
			<div className="app-main-container">
				<div className="app-header">
					<Header />
				</div>

				<main className="app-main-content-wrapper">
					<div className="app-main-content">{props.children}</div>
					<Footer />
				</main>
			</div>
		</div>
	);
};

export default Vertical;
