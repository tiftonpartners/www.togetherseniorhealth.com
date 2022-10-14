import React, { useCallback } from 'react';
import { List } from '@material-ui/core';
import Link from 'next/link';
import IntlMessages from '../../util/IntlMessages';
import { useRouter } from 'next/router';

const NavMenuItem = props => {
    const { name, icon, link } = props;
    const router = useRouter();

    const isActive = useCallback(
        () => link === router.pathname || router.pathname.includes(link),
        [link, router.pathname]
    );

    return (
        <List component="div" className="nav-menu-item">
            <Link href={link}>
                <a
                    className={`prepend-icon nav-menu-link ${
                        isActive() ? 'active' : ''
                    }`}
                >
                    {/* Display an icon if any */}
                    {!!icon && (
                        <i className={'zmdi zmdi-hc-fw  zmdi-' + icon} />
                    )}
                    <span className="nav-text">
                        <IntlMessages id={name} />
                    </span>
                </a>
            </Link>
        </List>
    );
};

export default NavMenuItem;
