// @ts-nocheck
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const ScrollToTop: React.ReactNode = (props: React.PropsWithChildren<{}>) => {
	const previousValue = usePrevious(notifications.length);
	const router = useRouter();

	useEffect(() => {
		if (router.pathname !== prevProps.location) {
			window.scrollTo(0, 0);
		}
	}, [notifications]);

	return props.children;
};

export default ScrollToTop;
