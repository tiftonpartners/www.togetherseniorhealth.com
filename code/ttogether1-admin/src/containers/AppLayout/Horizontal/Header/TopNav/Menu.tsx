import React, { Component } from 'react';
import Link from 'next/link';
import IntlMessages from 'util/IntlMessages';

class Menu extends Component {
	componentDidMount() {
		const pathname = `#${window.location.href}`; // get current path
		const mainMenu = document.querySelectorAll('nav-item');
		for (let i = 0; i < mainMenu.length; i++) {
			mainMenu[i].addEventListener('click', function() {
				for (let j = 0; j < mainMenu.length; j++) {
					if (mainMenu[j].classList.contains('active')) {
						mainMenu[j].classList.remove('active');
					}
				}
				this.classList.toggle('active');
			});
		}
		const subMenuLi = document.getElementsByClassName('nav-arrow');
		for (let i = 0; i < subMenuLi.length; i++) {
			subMenuLi[i].addEventListener('click', function() {
				for (let j = 0; j < subMenuLi.length; j++) {
					if (subMenuLi[j].classList.contains('active')) {
						subMenuLi[j].classList.remove('active');
					}
				}
				this.classList.toggle('active');
			});
		}
		const activeLi = document.querySelector('a[href="' + pathname + '"]'); // select current a element
		try {
			const activeNav = this.closest(activeLi, 'ul'); // select closest ul
			if (activeNav.classList.contains('sub-menu')) {
				this.closest(activeNav, 'li').classList.add('active');
			} else {
				this.closest(activeLi, 'li').classList.add('active');
			}
			const parentNav = this.closest(activeNav, '.nav-item');
			if (parentNav) {
				parentNav.classList.add('active');
			}
		} catch (e) {}
	}

	closest(el, selector) {
		try {
			let matchesFn;
			// find vendor prefix
			['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(
				function(fn) {
					if (typeof document.body[fn] === 'function') {
						matchesFn = fn;
						return true;
					}
					return false;
				}
			);

			let parent;

			// traverse parents
			while (el) {
				parent = el.parentElement;
				if (parent && parent[matchesFn](selector)) {
					return parent;
				}
				el = parent;
			}
		} catch (e) {}

		return null;
	}

	render() {
		return (
			<div className="app-main-menu d-none d-md-block">
				<ul className="navbar-nav navbar-nav-mega">
					<li className="nav-item">
						<span className="nav-link">
							<IntlMessages id="sidebar.main" />
						</span>
						<ul className="sub-menu">
							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-view-dashboard zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.dashboard" />
									</span>
								</span>
								<ul className="sub-menu">
									<li>
										<Link href="/app/dashboard/crypto">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.dashboard.crypto" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/dashboard/listing">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.dashboard.listing" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/dashboard/crm">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.dashboard.crm" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/dashboard/intranet">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.dashboard.intranet" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/dashboard/eCommerce">
											<a className="prepend-icon">
												<span className="nav-text text-transform-none">
													<IntlMessages id="sidebar.dashboard.ecommerce" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/dashboard/news">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.dashboard.news" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/dashboard/misc">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.dashboard.misc" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>
							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-widgets zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.widgets" />
									</span>
								</span>
								<ul className="sub-menu">
									<li>
										<Link href="/app/widgets/classic">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.classic" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/widgets/modern">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.modern" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-trending-up zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.metrics" />
									</span>
								</span>

								<ul className="sub-menu">
									<li>
										<Link href="/app/metrics/classic">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.classic" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/metrics/modern">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.modern" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>
						</ul>
					</li>

					<li className="nav-item mega-menu">
						<span className="nav-link">
							<IntlMessages id="sidebar.components" />
						</span>

						<ul className="sub-menu">
							<li>
								<Link href="/app/components/alerts">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.alerts" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/appbar">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.appbar" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/auto-complete">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.autocomplete" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/avatars">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.avatars" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/badges">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.badge" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/bottom-navigation">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.bottomNavigation" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/breadcrumbs">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.breadcrumbs" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/buttons">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.buttons" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/button-group">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.buttonGroup" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/cards">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.cards" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/carousel">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.carousel" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/chips">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.chips" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/color-picker">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.colorPicker" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/dialogs">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.dialogs" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/dividers">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.dividers" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/expansion-panel">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.expansionPanel" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/drawer">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.drawer" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/grid-list">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.gridList" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/list">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.lists" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/menu-paper">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.menusPaper" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/pickers">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.pickers" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/popovers">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.popovers" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/progressbar">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.progress" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/selects">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.selects" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/selection">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.selectionControl" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/snackbar">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.snackbars" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/stepper">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.stepper" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/tables">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.tables" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/tabs">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.tabs" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/text-fields">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.textFields" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/tooltips">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.tooltips" />
										</span>
									</a>
								</Link>
							</li>
							<li>
								<Link href="/app/components/typography">
									<a className="prepend-icon">
										<span className="nav-text">
											<IntlMessages id="sidebar.components.typography" />
										</span>
									</a>
								</Link>
							</li>
						</ul>
					</li>

					<li className="nav-item">
						<span className="nav-link">
							<IntlMessages id="sidebar.extensions" />
						</span>
						<ul className="sub-menu">
							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-code-setting zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.editors" />
									</span>
								</span>

								<ul className="sub-menu">
									<li>
										<Link href="/app/editor/ck">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.editors.CKEditor" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/editor/wysiswyg">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.editors.WYSISWYGEditor" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-brush zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.pickers" />
									</span>
								</span>

								<ul className="sub-menu">
									<li>
										<Link href="/app/pickers/date-time">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.pickers.dateTimePickers" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/pickers/color">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.pickers.colorPickers" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-key zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.extensions" />
									</span>
								</span>

								<ul className="sub-menu">
									<li>
										<Link href="/app/extensions/dnd">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.extensions.dragNDrop" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/extensions/dropzone">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.extensions.dropzone" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/extensions/sweet-alert">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.extensions.sweetAlert" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/extensions/notification">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.extensions.notification" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-chart zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.chart" />
									</span>
								</span>

								<ul className="sub-menu sub-menu-half">
									<li>
										<Link href="/app/chart/line">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.line" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/chart/bar">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.bar" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/chart/area">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.area" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/chart/composed">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.composed" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/chart/scatter">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.scatter" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/chart/pie">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.pie" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/chart/radial">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.radial" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/chart/radar">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.radar" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/chart/treemap">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.chart.tree" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-google-maps zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.map" />
									</span>
								</span>

								<ul className="sub-menu sub-menu-half">
									<li>
										<Link href="/app/map/simple">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.simple" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/styled">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.styled" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/geo-location">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.geoLocation" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/directions">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.mapDirection" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/overlay">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.overlay" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/kml">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.kmLayer" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/popup-info">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.popupInfo" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/traffic">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.trafficLayer" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/street-view">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.streetView" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/event">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.eventListener" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/drawing">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.mapDrawing" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/map/clustering">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.map.mapClustering" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-calendar zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.calendar" />
									</span>
								</span>

								<ul className="sub-menu">
									<li>
										<Link href="/app/calendar/basic">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.calendar.basic" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/calendar/cultures">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.calendar.cultures" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/calendar/dnd">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.calendar.dnd" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/calendar/popup">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.calendar.popup" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/calendar/rendering">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.calendar.rendering" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/calendar/selectable">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.calendar.selectable" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/calendar/timeslots">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.calendar.timeslots" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-shopping-cart zmdi-hc-fw" />
									<span className="nav-text text-transform-none">
										<IntlMessages id="sidebar.eCommerce" />
									</span>
								</span>

								<ul className="sub-menu">
									<li>
										<Link href="/app/ecommerce/products-list">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.eCommerce.productsList" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/ecommerce/products-grid">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.eCommerce.productsGrid" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-collection-item-8 zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule" />
									</span>
								</span>

								<ul className="sub-menu sub-menu-half">
									<li>
										<Link href="/app/app-module/login-1">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.login1" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/app-module/login-2">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.login2" />
												</span>
											</a>
										</Link>
									</li>

									<li>
										<Link href="/app/app-module/login-with-stepper">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.loginStepper" />
												</span>
											</a>
										</Link>
									</li>

									<li>
										<Link href="/app/app-module/sign-up-1">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.signup1" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/app-module/sign-up-2">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.signup2" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/app-module/forgot-password-1">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.forgotPassword1" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/app-module/forgot-password-2">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.forgotPassword2" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/app-module/lock-screen-1">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.lock1" />
												</span>
											</a>
										</Link>
									</li>
									<li>
										<Link href="/app/app-module/lock-screen-2">
											<a className="prepend-icon">
												<span className="nav-text">
													<IntlMessages id="sidebar.appModule.lock2" />
												</span>
											</a>
										</Link>
									</li>
								</ul>
							</li>
						</ul>
					</li>

					<li className="nav-item">
						<span className="nav-link">
							<IntlMessages id="sidebar.modules" />
						</span>

						<ul className="sub-menu">
							<li>
								<Link href="/app/to-do">
									<i className="zmdi zmdi-check-square zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule.toDo" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/to-do-redux">
									<i className="zmdi zmdi-check-square zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule.toDoRedux" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/mail">
									<i className="zmdi zmdi-email zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule.mail" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/mail-redux">
									<i className="zmdi zmdi-email zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule.mailRedux" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/chat">
									<i className="zmdi zmdi-comment zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule.chat" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/chat-redux">
									<i className="zmdi zmdi-comment zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule.chatRedux" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/contact">
									<i className="zmdi zmdi-account-box zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule.contact" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/contact-redux">
									<i className="zmdi zmdi-account-box zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.appModule.contactRedux" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/social-apps/profile">
									<i className="zmdi zmdi-account-box zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.profile" />
									</span>
								</Link>
							</li>

							<li>
								<Link href="/app/social-apps/wall">
									<i className="zmdi zmdi-account-box zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.wall" />
									</span>
								</Link>
							</li>
						</ul>
					</li>

					<li className="nav-item">
						<span className="nav-link">
							<IntlMessages id="sidebar.extras" />
						</span>
						<ul className="sub-menu">
							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-view-web zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.tables" />
									</span>
								</span>

								<ul className="sub-menu">
									<li>
										<Link href="/app/table/basic">
											<span className="nav-text">
												<IntlMessages id="sidebar.tables.basicTable" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/table/data">
											<span className="nav-text">
												<IntlMessages id="sidebar.tables.dataTable" />
											</span>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-swap-alt zmdi-hc-fw zmdi-hc-rotate-90" />
									<span className="nav-text">
										<IntlMessages id="sidebar.timeLine" />
									</span>
								</span>
								<ul className="sub-menu">
									<li>
										<Link href="/app/time-line/default">
											<span className="nav-text">
												<IntlMessages id="sidebar.timeLine.default" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/time-line/default-with-icon">
											<span className="nav-text">
												<IntlMessages id="sidebar.timeLine.defaultwithIcons" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/time-line/left-align">
											<span className="nav-text">
												<IntlMessages id="sidebar.timeLine.leftAligned" />
											</span>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-view-list zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.customViews" />
									</span>
								</span>
								<ul className="sub-menu">
									<li>
										<Link href="/app/custom-views/simple-list">
											<span className="nav-text">
												<IntlMessages id="sidebar.customViews.plainListView" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/custom-views/strip-list">
											<span className="nav-text">
												<IntlMessages id="sidebar.customViews.withDivider" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/custom-views/card-list">
											<span className="nav-text">
												<IntlMessages id="sidebar.customViews.cardListView" />
											</span>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-book-image zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.forms" />
									</span>
								</span>
								<ul className="sub-menu">
									<li>
										<Link href="/app/form/components">
											<span className="nav-text">
												<IntlMessages id="sidebar.forms.components" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/form/stepper">
											<span className="nav-text">
												<IntlMessages id="sidebar.forms.stepper" />
											</span>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-view-web zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.icons" />
									</span>
								</span>
								<ul className="sub-menu">
									<li>
										<Link href="/app/icons/material">
											<span className="nav-text">
												<IntlMessages id="sidebar.icons.material" />
											</span>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-collection-bookmark zmdi-hc-fw zmdi-hc-rotate-90" />
									<span className="nav-text">
										<IntlMessages id="sidebar.extraElements" />
									</span>
								</span>
								<ul className="sub-menu">
									<li>
										<Link href="/app/extra-elements/pricing-table">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraElements.pricingTable" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/extra-elements/callouts">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraElements.callouts" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/extra-elements/testimonials">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraElements.testimonials" />
											</span>
										</Link>
									</li>
								</ul>
							</li>

							<li className="nav-arrow">
								<span className="nav-link">
									<i className="zmdi zmdi-pages zmdi-hc-fw" />
									<span className="nav-text">
										<IntlMessages id="sidebar.extraPages" />
									</span>
								</span>
								<ul className="sub-menu sub-menu-half">
									<li>
										<Link href="/app/extra-pages/about-us">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraPages.aboutUs" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/extra-pages/contact-us">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraPages.contactUs" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/extra-pages/blog">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraPages.blog" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/extra-pages/faq">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraPages.faq" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/extra-pages/portfolio">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraPages.portfolio" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/extra-pages/error-404">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraPages.404" />
											</span>
										</Link>
									</li>
									<li>
										<Link href="/app/extra-pages/error-500">
											<span className="nav-text">
												<IntlMessages id="sidebar.extraPages.500" />
											</span>
										</Link>
									</li>
								</ul>
							</li>
						</ul>
					</li>
				</ul>
			</div>
		);
	}
}

export default Menu;
