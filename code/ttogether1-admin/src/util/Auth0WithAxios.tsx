import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from './Api';

const Auth0WithAxios: React.FC = (props) => {
	const { getAccessTokenSilently } = useAuth0();

	// Set the AUTH token for any request
	axios.interceptors.request.use(
		async (config) => {
			const accessToken = await getAccessTokenSilently();
			//const token = localStorage.getItem('token');
			config.headers.Authorization = accessToken ? `Bearer ${accessToken}` : '';
			return config;
		},
		(error) => {
			Promise.reject(error);
		}
	);
	return <>{props.children}</>;
};

export default Auth0WithAxios;
