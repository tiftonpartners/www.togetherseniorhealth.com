import React, { ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import { changeNavigationStyle, setDrawerType, setHorizontalMenuPosition } from '../../store/settings/actions';
import { Button, ButtonGroup } from 'reactstrap';
import { RootState } from 'typesafe-actions';
import { DrawerTypes, NavigationStyles, HorizonalMenuPositions } from 'constants/Enums';

const Customizer = () => {
	const dispatch = useDispatch();

	const drawerType = useSelector<RootState, DrawerTypes>(({ settings }) => settings.drawerType);
	const navigationStyle = useSelector<RootState, NavigationStyles>(({ settings }) => settings.navigationStyle);
	const horizontalNavPosition = useSelector<RootState, HorizonalMenuPositions>(
		({ settings }) => settings.horizontalNavPosition
	);

	const setFixedDrawer = () => {
		dispatch(setDrawerType(DrawerTypes.FIXED_DRAWER));
	};

	const setCollapsedDrawer = () => {
		dispatch(setDrawerType(DrawerTypes.COLLAPSED_DRAWER));
	};

	const setMiniDrawer = () => {
		dispatch(setDrawerType(DrawerTypes.MINI_DRAWER));
	};

	return (
		<div className="side-nav-option">
			<div className="mb-1">
				<h3 className="mb-1 mt-4">Navigation Style</h3>
				<div className="text-left py-3">
					<FormControl className="d-block" component="fieldset" required>
						<RadioGroup
							className="sidenav-dir"
							aria-label="nav-style"
							name="navStyle"
							value={navigationStyle}
							onChange={(event: ChangeEvent<HTMLInputElement>) => {
								dispatch(changeNavigationStyle(event.target.value as NavigationStyles));
							}}
						>
							<FormControlLabel
								control={<Radio />}
								value={NavigationStyles.HORIZONTAL_NAVIGATION}
								label="Horizontal"
							/>
							<FormControlLabel
								control={<Radio />}
								value={NavigationStyles.VERTICAL_NAVIGATION}
								label="Vertical"
							/>
						</RadioGroup>
					</FormControl>
				</div>
			</div>
			{navigationStyle === NavigationStyles.HORIZONTAL_NAVIGATION ? (
				<ButtonGroup>
					{console.log('navigationStyle', horizontalNavPosition)}
					<Button
						color="default"
						className={`jr-btn  ${horizontalNavPosition === HorizonalMenuPositions.INSIDE_THE_HEADER &&
							'active'} `}
						onClick={() => {
							dispatch(setHorizontalMenuPosition(HorizonalMenuPositions.INSIDE_THE_HEADER));
						}}
					>
						Inside
					</Button>
					<Button
						color="default"
						className={`jr-btn ${horizontalNavPosition === HorizonalMenuPositions.ABOVE_THE_HEADER &&
							'active'} `}
						onClick={() => {
							dispatch(setHorizontalMenuPosition(HorizonalMenuPositions.ABOVE_THE_HEADER));
						}}
					>
						Top
					</Button>
					<Button
						color="default"
						className={`jr-btn ${horizontalNavPosition === HorizonalMenuPositions.BELOW_THE_HEADER &&
							'active'} `}
						onClick={() => {
							dispatch(setHorizontalMenuPosition(HorizonalMenuPositions.BELOW_THE_HEADER));
						}}
					>
						Below
					</Button>
				</ButtonGroup>
			) : (
				<ButtonGroup>
					<Button
						color="default"
						className={`jr-btn  ${drawerType === DrawerTypes.FIXED_DRAWER && 'active'} `}
						onClick={setFixedDrawer}
					>
						Fixed
					</Button>
					<Button
						color="default"
						className={`jr-btn ${drawerType === DrawerTypes.COLLAPSED_DRAWER && 'active'} `}
						onClick={setCollapsedDrawer}
					>
						Collapsed
					</Button>
					<Button
						color="default"
						className={`jr-btn ${drawerType === DrawerTypes.MINI_DRAWER && 'active'} `}
						onClick={setMiniDrawer}
					>
						Mini
					</Button>
				</ButtonGroup>
			)}
		</div>
	);
};

export default Customizer;
