import React from 'react';
import { List } from '@material-ui/core';
import NavMenuItem from './NavMenuItem';
import NavSection from './NavSection';
import NavCollapse from './NavCollapse';
import RequirePermissions from 'util/RequirePermissions';
import _ from 'lodash';

const MenuItem = props => {
    const { item } = props;

    switch (item.type) {
        case 'section':
            return <NavSection {...item} />;
        case 'collapse':
            return <NavCollapse {...item} />;
        case 'item':
            return <NavMenuItem {...item} />;
        default:
            return <></>;
    }
};

const Navigation = props => {
    const { menuItems } = props;
    return (
        <List component="nav" disablePadding className="side-nav-menu">
            {menuItems.map((item, index) =>
                _.get(item, 'permissions') || _.get(item, 'permissionsOr') ? (
                    <RequirePermissions
                        perms={_.get(item, 'permissions')}
                        permsOr={_.get(item, 'permissionsOr')}
                        key={index}
                    >
                        <MenuItem item={item} />
                    </RequirePermissions>
                ) : (
                    <MenuItem item={item} key={index} />
                )
            )}
        </List>
    );
};

export default Navigation;
