import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Drawer from '@material-ui/core/Drawer';
import UserInfo from 'components/UserInfo';
import { toggleCollapsedNav, updateWindowWidth } from '../../store/settings/actions';
import SideBarContent from './SideBarContent';
import { RootState } from 'typesafe-actions';
import { SettingsState } from 'store/settings/reducers';
import { DrawerTypes, NavigationStyles } from 'constants/Enums';

const SideBar = () => {
	const dispatch = useDispatch();
	const { drawerType, width, navigationStyle, navCollapsed } = useSelector<RootState, SettingsState>(
		({ settings }) => settings
	);

	useEffect(() => {
		window.addEventListener('resize', () => {
			dispatch(updateWindowWidth(window.innerWidth));
		});
	}, [dispatch]);

	const onToggleCollapsedNav = (e) => {
		dispatch(toggleCollapsedNav());
	};

	let drawerStyle = drawerType.includes(DrawerTypes.FIXED_DRAWER)
		? 'd-xl-flex'
		: drawerType.includes(DrawerTypes.COLLAPSED_DRAWER)
		? ''
		: 'd-flex';
	let type = 'permanent';
	if (
		drawerType.includes(DrawerTypes.COLLAPSED_DRAWER) ||
		(drawerType.includes(DrawerTypes.FIXED_DRAWER) && width < 1200)
	) {
		type = 'temporary';
	}

	if (navigationStyle === NavigationStyles.HORIZONTAL_NAVIGATION) {
		drawerStyle = '';
		type = 'temporary';
	}

	return (
		<div className={`app-sidebar d-none ${drawerStyle}`}>
			<Drawer
				className="app-sidebar-content"
				variant={type as any}
				open={type.includes('temporary') ? navCollapsed : true}
				onClose={onToggleCollapsedNav}
				classes={{
					paper: 'side-nav'
				}}
			>
				<UserInfo />
				<SideBarContent />
			</Drawer>
		</div>
	);
};

export default SideBar;
