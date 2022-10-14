import React from 'react';
import { NextPage } from 'next';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import RequirePermissions from 'util/RequirePermissions';
import { PageWithLayout } from 'containers/AppLayout';
import dynamic from 'next/dynamic';

const RecordingDisplaytWithNoSSR = dynamic(
    () => import('tsh-components/Recording/recording-display'),
    { ssr: false }
);

const RecordingsPage: PageWithLayout = () => {
    const router = useRouter();

    const { sid } = router.query;

    return (
        <RequirePermissions
            perms={['get:recording']}
            displayMessage={true}
            displayLoader={true}
        >
            <RecordingDisplaytWithNoSSR sid={sid as string} />
        </RequirePermissions>
    );
};

RecordingsPage.emptyLayout = true;

export default RecordingsPage;
