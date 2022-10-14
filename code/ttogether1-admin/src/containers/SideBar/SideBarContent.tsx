import React from 'react';
import CustomScrollbars from 'util/CustomScrollbars';
import Navigation from '../../components/Navigation';

const SideBarContent = () => {
    const navigationMenus = [
        {
            name: 'pages.dashboard',
            type: 'item',
            link: '/dashboard'
        },
        {
            name: 'pages.auth0Users',
            type: 'item',
            link: '/auth0-users',
            permissions: ['query:user']
        },
        {
            name: 'pages.emailLedger',
            type: 'item',
            link: '/email-ledger',
            permissions: ['query:email']
        },
        {
            name: 'pages.recordingLedger',
            type: 'item',
            link: '/recordings/recording-ledger',
            permissions: ['query:recording']
        },
        {
            name: 'pages.users',
            type: 'collapse',
            permissionsOr: ['query:prospect', 'query:participant'],
            children: [
                {
                    name: 'pages.prospects',
                    type: 'item',
                    link: '/prospects',
                    permissions: ['query:prospect']
                },
                {
                    name: 'pages.screenedParticipants',
                    type: 'item',
                    link: '/participants-screened',
                    permissions: ['query:participant']
                },
                {
                    name: 'pages.activeParticipants',
                    type: 'item',
                    link: '/participants-active',
                    permissions: ['query:participant']
                }
            ]
        },
        {
            name: 'pages.scheduledSessions',
            type: 'collapse',
            permissionsOr: ['query:session', 'queryMe:upcomingSession'],
            children: [
                {
                    name: 'pages.allSessions',
                    type: 'item',
                    link: '/sessions/all',
                    permissions: ['query:session']
                },
                {
                    name: 'pages.mySessions',
                    type: 'item',
                    link: '/sessions/me',
                    permissions: ['queryMe:upcomingSession']
                }
            ]
        },
        {
            name: 'pages.curriculum',
            type: 'item',
            link: '/curriculum',
            permissions: ['query:course']
        }
    ];

    return (
        <CustomScrollbars className=" scrollbar">
            <Navigation menuItems={navigationMenus} />
        </CustomScrollbars>
    );
};

export default SideBarContent;
