import React from 'react';
import AppLayouts from './AppLayouts';
import { useSelector } from 'react-redux';
import { AppProps } from 'next/app';
import { RootState } from 'typesafe-actions';
import { HorizonalMenuPositions, NavigationStyles } from 'constants/Enums';
import { NextPage } from 'next';
import { ClassValidator } from 'store/classes/validation';
import { withAuthenticationRequired } from '@auth0/auth0-react';

export type PageWithLayout = NextPage & {
    emptyLayout?: boolean;
};

const AppLayout = (props: AppProps) => {
    const { Component, pageProps } = props;
    const horizontalNavPosition = useSelector<
        RootState,
        HorizonalMenuPositions
    >(({ settings }) => settings.horizontalNavPosition);
    const navigationStyle = useSelector<RootState, NavigationStyles>(
        ({ settings }) => settings.navigationStyle
    );
    const onGetLayout = (layout: HorizonalMenuPositions) => {
        switch (layout) {
            case HorizonalMenuPositions.INSIDE_THE_HEADER:
                return 'InsideHeaderNav';

            case HorizonalMenuPositions.ABOVE_THE_HEADER:
                return 'AboveHeaderNav';

            case HorizonalMenuPositions.BELOW_THE_HEADER:
                return 'BelowHeaderNav';
            default:
                return 'Vertical';
        }
    };

    const Layout = (Component as PageWithLayout).emptyLayout
        ? React.Fragment
        : AppLayouts[
              navigationStyle === NavigationStyles.VERTICAL_NAVIGATION
                  ? 'Vertical'
                  : onGetLayout(horizontalNavPosition)
          ];

    let FinalComponent = Component;

    if ((Component as PageWithLayout).emptyLayout) {
        FinalComponent = withAuthenticationRequired(Component);
    }
    return (
        <Layout>
            <FinalComponent {...pageProps} />
        </Layout>
    );
};

export default AppLayout;
