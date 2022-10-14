import { createAction } from 'typesafe-actions';
import { DrawerTypes, NavigationStyles, HorizonalMenuPositions } from 'constants/Enums';

import {
	CHANGE_DIRECTION,
	CHANGE_NAVIGATION_STYLE,
	DARK_THEME,
	DRAWER_TYPE,
	HORIZONTAL_MENU_POSITION,
	SWITCH_LANGUAGE,
	THEME_COLOR,
	TOGGLE_COLLAPSED_NAV,
	WINDOW_WIDTH
} from 'constants/ActionTypes';

export interface ILocale {
	languageId: string;
	locale: string;
	name: string;
	icon: string;
}
export const toggleCollapsedNav = createAction(TOGGLE_COLLAPSED_NAV)();
export const setDrawerType = createAction(DRAWER_TYPE)<DrawerTypes>();
export const updateWindowWidth = createAction(WINDOW_WIDTH)<number>();
export const setThemeColor = createAction(THEME_COLOR)<string>();
export const setDarkTheme = createAction(DARK_THEME)();
export const changeDirection = createAction(CHANGE_DIRECTION)();
export const changeNavigationStyle = createAction(CHANGE_NAVIGATION_STYLE)<NavigationStyles>();
export const setHorizontalMenuPosition = createAction(HORIZONTAL_MENU_POSITION)<HorizonalMenuPositions>();
export const switchLanguage = createAction(SWITCH_LANGUAGE)<ILocale>();
