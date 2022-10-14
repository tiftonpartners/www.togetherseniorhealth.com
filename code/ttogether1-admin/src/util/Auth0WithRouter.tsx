import React, { useEffect } from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import Router from 'next/router';
import Auth0WithAxios from './Auth0WithAxios';

export interface IRedirectCallbackState {
    returnTo?: string;
}
const Auth0WithRouter: React.FC = props => {
    const onRedirectCallback = (appState: IRedirectCallbackState) => {
        if (appState?.returnTo.indexOf('code=') === -1) {
            console.log('REDIRECTING: ' + appState?.returnTo);
            Router.replace(appState?.returnTo);
        } else {
            console.log('has code: ' + appState?.returnTo);
            Router.replace(window.location.pathname, window.location.pathname, {
                shallow: true
            });
        }
    };

    return (
        <Auth0Provider
            domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
            clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENTID}
            redirectUri={process.env.NEXT_PUBLIC_AUTH_REDIRECT}
            audience={process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}
            onRedirectCallback={onRedirectCallback}
        >
            <Auth0WithAxios>{props.children}</Auth0WithAxios>
        </Auth0Provider>
    );
};

export default Auth0WithRouter;
