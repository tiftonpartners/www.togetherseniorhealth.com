import { createReducer } from 'typesafe-actions';
import * as ThemeColors from 'constants/ThemeColors';
import { DrawerTypes, HorizonalMenuPositions, NavigationStyles } from 'constants/Enums';

import {
	changeDirection,
	changeNavigationStyle,
	setDarkTheme,
	setDrawerType,
	setHorizontalMenuPosition,
	setThemeColor,
	switchLanguage,
	toggleCollapsedNav,
	updateWindowWidth
} from './actions';

const rltLocale = ['ar'];
const INIT_STATE = {
	drawerType: DrawerTypes.FIXED_DRAWER,
	themeColor: ThemeColors.DARK_INDIGO,
	darkTheme: false,
	width: 1200,
	navCollapsed: false,
	isDirectionRTL: false,
	navigationStyle: NavigationStyles.VERTICAL_NAVIGATION,
	horizontalNavPosition: HorizonalMenuPositions.INSIDE_THE_HEADER,
	locale: {
		languageId: 'english',
		locale: 'en',
		name: 'English',
		icon: 'us'
	}
};

export const reducer = createReducer(INIT_STATE)
	.handleAction(toggleCollapsedNav, (state, action) => {
		return {
			...state,
			navCollapsed: !state.navCollapsed
		};
	})
	.handleAction(setDrawerType, (state, action) => {
		return {
			...state,
			drawerType: action.payload
		};
	})
	.handleAction(updateWindowWidth, (state, action) => {
		return {
			...state,
			width: action.payload
		};
	})
	.handleAction(setThemeColor, (state, action) => {
		return {
			...state,
			darkTheme: false,
			themeColor: action.payload
		};
	})
	.handleAction(setDarkTheme, (state, action) => {
		return {
			...state,
			darkTheme: !state.darkTheme
		};
	})
	.handleAction(changeDirection, (state, action) => {
		return {
			...state,
			isDirectionRTL: !state.isDirectionRTL
		};
	})
	.handleAction(changeNavigationStyle, (state, action) => {
		return {
			...state,
			navigationStyle: action.payload
		};
	})
	.handleAction(setHorizontalMenuPosition, (state, action) => {
		return {
			...state,
			horizontalNavPosition: action.payload
		};
	})
	.handleAction(switchLanguage, (state, action) => {
		return {
			...state,
			locale: action.payload,
			isDirectionRTL: rltLocale.includes(action.payload.locale)
		};
	});

export default reducer;
export type SettingsState = ReturnType<typeof reducer>;
