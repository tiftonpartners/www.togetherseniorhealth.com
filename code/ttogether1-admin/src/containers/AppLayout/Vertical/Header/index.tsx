import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import SearchBox from 'components/SearchBox';
import MailNotification from 'components/MailNotification';
import AppNotification from 'components/AppNotification';
import CardHeader from 'components/dashboard/Common/CardHeader/index';
import { switchLanguage, toggleCollapsedNav } from 'store/settings/actions';
import IntlMessages from 'util/IntlMessages';
import LanguageSwitcher from 'components/LanguageSwitcher/index';
import { RootState } from 'typesafe-actions';
import { SettingsState } from 'store/settings/reducers';
import { DrawerTypes } from 'constants/Enums';

const Index = props => {
    const dispatch = useDispatch();
    const { drawerType, locale, navCollapsed } = useSelector<
        RootState,
        SettingsState
    >(({ settings }) => settings);
    const [langSwitcher, setLangSwitcher] = useState(false);
    const [mailNotification, setMailNotification] = useState(false);
    const [appNotification, setAppNotification] = useState(false);
    const [searchBox, setSearchBox] = useState(false);
    const [apps, setApps] = useState(false);
    const [searchText, setSearchText] = useState('');

    const onAppNotificationSelect = () => {
        setAppNotification(!appNotification);
    };

    const onMailNotificationSelect = () => {
        setMailNotification(!mailNotification);
    };
    const onLangSwitcherSelect = event => {
        setLangSwitcher(!langSwitcher);
    };

    const onSearchBoxSelect = () => {
        setSearchBox(!searchBox);
    };
    const onAppsSelect = () => {
        setApps(!apps);
    };

    const handleRequestClose = () => {
        setSearchBox(false);
        setLangSwitcher(false);
        setMailNotification(false);
        setSearchBox(false);
        setApps(false);
    };

    const onToggleCollapsedNav = e => {
        dispatch(toggleCollapsedNav());
    };

    const Apps = () => {
        return (
            <ul className="jr-list jr-list-half">
                <li className="jr-list-item">
                    <Link href="/app/calendar/basic">
                        <a className="jr-list-link">
                            <i className="zmdi zmdi-calendar zmdi-hc-fw" />
                            <span className="jr-list-text">
                                <IntlMessages id="sidebar.calendar.basic" />
                            </span>
                        </a>
                    </Link>
                </li>

                <li className="jr-list-item">
                    <Link href="/app/to-do">
                        <a className="jr-list-link">
                            <i className="zmdi zmdi-check-square zmdi-hc-fw" />
                            <span className="jr-list-text">
                                <IntlMessages id="sidebar.appModule.toDo" />
                            </span>
                        </a>
                    </Link>
                </li>

                <li className="jr-list-item">
                    <Link href="/app/mail">
                        <a className="jr-list-link">
                            <i className="zmdi zmdi-email zmdi-hc-fw" />
                            <span className="jr-list-text">
                                <IntlMessages id="sidebar.appModule.mail" />
                            </span>
                        </a>
                    </Link>
                </li>

                <li className="jr-list-item">
                    <Link href="/app/chat">
                        <a className="jr-list-link">
                            <i className="zmdi zmdi-comment zmdi-hc-fw" />
                            <span className="jr-list-text">
                                <IntlMessages id="sidebar.appModule.chat" />
                            </span>
                        </a>
                    </Link>
                </li>

                <li className="jr-list-item">
                    <Link href="/app/contact">
                        <a className="jr-list-link">
                            <i className="zmdi zmdi-account-box zmdi-hc-fw" />
                            <span className="jr-list-text">
                                <IntlMessages id="sidebar.appModule.contact" />
                            </span>
                        </a>
                    </Link>
                </li>

                <li className="jr-list-item">
                    <Link href="/">
                        <a className="jr-list-link">
                            <i className="zmdi zmdi-plus-circle-o zmdi-hc-fw" />
                            <span className="jr-list-text">Add New</span>
                        </a>
                    </Link>
                </li>
            </ul>
        );
    };

    const updateSearchText = evt => {
        setSearchText(evt.target.value);
    };

    const onSwitchLanguage = lang => {
        dispatch(switchLanguage(lang));
    };

    const drawerStyle = drawerType.includes(DrawerTypes.FIXED_DRAWER)
        ? 'd-block d-xl-none'
        : drawerType.includes(DrawerTypes.COLLAPSED_DRAWER)
        ? 'd-block'
        : 'd-none';

    return (
        <AppBar className="app-main-header">
            <Toolbar className="app-toolbar" disableGutters={false}>
                <IconButton
                    className={`jr-menu-icon mr-3 ${drawerStyle}`}
                    aria-label="Menu"
                    onClick={onToggleCollapsedNav}
                >
                    <span className="menu-icon" />
                </IconButton>

                <Link href="/">
                    <a className="app-logo mr-2 d-none d-sm-block">
                        <img
                            src="/images/logo.svg"
                            alt="Together Senior Health"
                            title="Together Senior Health"
                        />
                    </a>
                </Link>

                {/* <SearchBox
					styleName="d-none d-lg-block"
					placeholder=""
					onChange={updateSearchText}
					value={searchText}
				/> */}

                {/* <ul className="header-notifications list-inline ml-auto">
					<li className="list-inline-item">
						<Dropdown className="quick-menu app-notification" isOpen={apps} toggle={onAppsSelect}>
							<DropdownToggle className="d-inline-block" tag="span" data-toggle="dropdown">
								<span className="app-notification-menu">
									<i className="zmdi zmdi-apps zmdi-hc-fw zmdi-hc-lg" />
									<span>Apps</span>
								</span>
							</DropdownToggle>

							<DropdownMenu>{Apps()}</DropdownMenu>
						</Dropdown>
					</li>
					<li className="d-inline-block d-lg-none list-inline-item">
						<Dropdown className="quick-menu nav-searchbox" isOpen={searchBox} toggle={onSearchBoxSelect}>
							<DropdownToggle className="d-inline-block" tag="span" data-toggle="dropdown">
								<IconButton className="icon-btn">
									<i className="zmdi zmdi-search zmdi-hc-fw" />
								</IconButton>
							</DropdownToggle>

							<DropdownMenu right className="p-0">
								<SearchBox
									styleName="search-dropdown"
									placeholder=""
									onChange={updateSearchText}
									value={searchText}
								/>
							</DropdownMenu>
						</Dropdown>
					</li>
					<li className="list-inline-item">
						<Dropdown className="quick-menu" isOpen={langSwitcher} toggle={onLangSwitcherSelect}>
							<DropdownToggle className="d-inline-block" tag="span" data-toggle="dropdown">
								<IconButton className="icon-btn">
									<i className={`flag flag-24 flag-${locale.icon}`} />
								</IconButton>
							</DropdownToggle>

							<DropdownMenu right className="w-50">
								<LanguageSwitcher
									switchLanguage={onSwitchLanguage}
									handleRequestClose={handleRequestClose}
								/>
							</DropdownMenu>
						</Dropdown>
					</li>
					<li className="list-inline-item app-tour">
						<Dropdown className="quick-menu" isOpen={appNotification} toggle={onAppNotificationSelect}>
							<DropdownToggle className="d-inline-block" tag="span" data-toggle="dropdown">
								<IconButton className="icon-btn">
									<i className="zmdi zmdi-notifications-none icon-alert animated infinite wobble" />
								</IconButton>
							</DropdownToggle>

							<DropdownMenu right>
								<CardHeader
									styleName="align-items-center"
									heading={<IntlMessages id="appNotification.title" />}
								/>
								<AppNotification />
							</DropdownMenu>
						</Dropdown>
					</li>
					<li className="list-inline-item mail-tour">
						<Dropdown className="quick-menu" isOpen={mailNotification} toggle={onMailNotificationSelect}>
							<DropdownToggle className="d-inline-block" tag="span" data-toggle="dropdown">
								<IconButton className="icon-btn">
									<i className="zmdi zmdi-comment-alt-text zmdi-hc-fw" />
								</IconButton>
							</DropdownToggle>

							<DropdownMenu right>
								<CardHeader
									styleName="align-items-center"
									heading={<IntlMessages id="mailNotification.title" />}
								/>
								<MailNotification />
							</DropdownMenu>
						</Dropdown>
					</li>
				</ul> */}

                <div className="ellipse-shape" />
            </Toolbar>
        </AppBar>
    );
};

export default Index;
