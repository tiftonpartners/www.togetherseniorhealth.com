import React, { useEffect } from 'react';
import { Container } from '@material-ui/core';
import { createTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import URLSearchParams from 'url-search-params';
import MomentUtils from '@date-io/moment';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { wrapper } from '../store';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { useDispatch, useSelector } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { SnackbarProvider } from 'material-ui-snackbar-provider';

import 'styles/vendor/flag/sprite-flags-24x24.css';
import 'styles/vendor/material-design-iconic-font/css/material-design-iconic-font.min.css';
import 'styles/vendor/weather-icons/css/weather-icons.min.css';
import 'styles/vendor/react-select/react-select.css';
import '../../node_modules/react-notifications/lib/notifications.css';
import '../../node_modules/react-notifications/lib/notifications.css';
import '../../node_modules/slick-carousel/slick/slick.css';
import '../../node_modules/slick-carousel/slick/slick-theme.css';
import 'styles/vendor/animate.css';
import 'styles/vendor/bootstrap-rtl.css';
import 'styles/vendor/loader.css';
import '../../node_modules/react-big-calendar/lib/css/react-big-calendar.css';
import 'styles/bootstrap.scss';
import 'styles/app.scss';
import 'styles/app-rtl.scss';

import indigoTheme from '../containers/themes/indigoTheme';
import cyanTheme from '../containers/themes/cyanTheme';
import orangeTheme from '../containers/themes/orangeTheme';
import amberTheme from '../containers/themes/amberTheme';
import pinkTheme from '../containers/themes/pinkTheme';
import blueTheme from '../containers/themes/blueTheme';
import purpleTheme from '../containers/themes/purpleTheme';
import greenTheme from '../containers/themes/greenTheme';
import theme from '../containers/themes/theme';
import AppLocale from '../lngProvider';

import {
    AMBER,
    BLUE,
    CYAN,
    DARK_AMBER,
    DARK_BLUE,
    DARK_CYAN,
    DARK_DEEP_ORANGE,
    DARK_DEEP_PURPLE,
    DARK_GREEN,
    DARK_INDIGO,
    DARK_PINK,
    DEEP_ORANGE,
    DEEP_PURPLE,
    GREEN,
    INDIGO,
    PINK
} from 'constants/ThemeColors';
import RTL from 'util/RTL';
import AppLayout from '../containers/AppLayout';
import { setDarkTheme, setThemeColor } from '../store/settings/actions';
import { RootState } from 'typesafe-actions';
import { SettingsState } from 'store/settings/reducers';
import Auth0WithRouter from 'util/Auth0WithRouter';
import ModalProvider from 'util/modals';
import SnackbarWrapper from 'tsh-components/UI/SnackbarWrapper';

const App = (props: AppProps) => {
    const dispatch = useDispatch();
    const router = useRouter();

    const { themeColor, darkTheme, locale, isDirectionRTL } = useSelector<
        RootState,
        SettingsState
    >(state => state.settings);
    const isDarkTheme = darkTheme;

    useEffect(() => {
        (window as any).__MUI_USE_NEXT_TYPOGRAPHY_VARIANTS__ = true;

        const params = new URLSearchParams(router.query);
        if (params.has('theme-name')) {
            dispatch(setThemeColor(params.get('theme-name')));
        }
        if (params.has('dark-theme')) {
            dispatch(setDarkTheme());
        }

        if (isDarkTheme) {
            document.body.classList.add('dark-theme');
            //applyTheme = createTheme(darkTheme);
            applyTheme = getColorTheme(themeColor, applyTheme);
        } else {
            applyTheme = getColorTheme(themeColor, applyTheme);
        }

        if (isDirectionRTL) {
            applyTheme.direction = 'rtl';
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
            applyTheme.direction = 'ltr';
        }
    }, [dispatch, router.pathname, router.query, isDarkTheme, isDirectionRTL]);

    const getColorTheme = (themeColor, applyTheme) => {
        switch (themeColor) {
            case INDIGO: {
                applyTheme = createTheme(indigoTheme);
                break;
            }
            case CYAN: {
                applyTheme = createTheme(cyanTheme);
                break;
            }
            case AMBER: {
                applyTheme = createTheme(amberTheme);
                break;
            }
            case DEEP_ORANGE: {
                applyTheme = createTheme(orangeTheme);
                break;
            }
            case PINK: {
                applyTheme = createTheme(pinkTheme);
                break;
            }
            case BLUE: {
                applyTheme = createTheme(blueTheme);
                break;
            }
            case DEEP_PURPLE: {
                applyTheme = createTheme(purpleTheme);
                break;
            }
            case GREEN: {
                applyTheme = createTheme(greenTheme);
                break;
            }
            case DARK_INDIGO: {
                applyTheme = createTheme({
                    ...indigoTheme,
                    direction: 'rtl'
                });
                break;
            }
            case DARK_CYAN: {
                applyTheme = createTheme(cyanTheme);
                break;
            }
            case DARK_AMBER: {
                applyTheme = createTheme(amberTheme);
                break;
            }
            case DARK_DEEP_ORANGE: {
                applyTheme = createTheme(orangeTheme);
                break;
            }
            case DARK_PINK: {
                applyTheme = createTheme(pinkTheme);
                break;
            }
            case DARK_BLUE: {
                applyTheme = createTheme(blueTheme);
                break;
            }
            case DARK_DEEP_PURPLE: {
                applyTheme = createTheme(purpleTheme);
                break;
            }
            case DARK_GREEN: {
                applyTheme = createTheme(greenTheme);
                break;
            }
            default:
                createTheme(indigoTheme);
        }
        return applyTheme;
    };

    let applyTheme = createTheme(theme);

    const currentAppLocale = AppLocale[locale.locale];
    return (
        <Auth0WithRouter>
            <SnackbarProvider SnackbarProps={{ autoHideDuration: 4000 }}>
                <ThemeProvider theme={applyTheme}>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <IntlProvider
                            locale={currentAppLocale.locale}
                            messages={currentAppLocale.messages}
                        >
                            <ModalProvider>
                                <RTL>
                                    <div className="app-main">
                                        <CssBaseline />
                                        <Container
                                            maxWidth={false}
                                            disableGutters={true}
                                        >
                                            <AppLayout {...props} />
                                            <SnackbarWrapper />
                                        </Container>
                                    </div>
                                </RTL>
                            </ModalProvider>
                        </IntlProvider>
                    </MuiPickersUtilsProvider>
                </ThemeProvider>
            </SnackbarProvider>
        </Auth0WithRouter>
    );
};

export default wrapper.withRedux(App);
