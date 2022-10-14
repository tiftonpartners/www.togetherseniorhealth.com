import { Request, Response, NextFunction } from 'express';
import { AuthController } from './auth.controller';
import * as Permissions from './permissions.json';

// middleware for doing role-based permissions
export default function permissions(methodName: string) {
    return async (request: Request, response: Response, next: NextFunction) => {
        const userInfo = await AuthController.rememberUser(request);
        response.locals = {};
        response.locals.userInfo = userInfo; // pass to other methods in the middleware chain

        // route with permissions is required user to be logged in regardless
        if (!userInfo) {
            response.status(403).json({ message: 'Forbidden: Please login' });
            return;
        }
        // if authorization of permissions is required
        if (process.env.PERMISSIONS_AUTH_ENABLED === 'true') {
            try {
                if (userInfo && userInfo.token) {
                    if (Permissions && Permissions.hasOwnProperty(methodName)) {
                        let allowed: boolean = false;
                        let hasAll: boolean = true;

                        const perms = (Permissions as any)[methodName]
                            .permissions as string[];
                        const permsOr = (Permissions as any)[methodName]
                            .permissionsOr as string[];

                        if (Array.isArray(perms) && perms.length > 0) {
                            perms.forEach((perm) => {
                                // if user does not include all permissions required
                                // then they cannot access route
                                if (
                                    !userInfo.token?.permissions.includes(perm)
                                ) {
                                    hasAll = false;
                                }
                            });

                            if (hasAll) {
                                allowed = true;
                            }
                        }

                        // if not already allowed, check the OR clause of perms
                        if (
                            !allowed &&
                            Array.isArray(permsOr) &&
                            permsOr.length > 0
                        ) {
                            // must have at least one
                            permsOr.forEach((perm) => {
                                if (
                                    userInfo.token?.permissions.includes(perm)
                                ) {
                                    allowed = true;
                                }
                            });
                        }

                        if (allowed) {
                            response.locals.perms = userInfo.token?.permissions;
                            next(); // role is allowed, so continue on the next middleware
                        } else {
                            response.status(403).json({
                                message: `Forbidden: User does not have correct permissions for route`,
                            });
                        }
                    } else {
                        response.status(403).json({
                            message:
                                'Forbidden: Method name not found in permissions list',
                        }); // method name not found
                    }
                } else {
                    response
                        .status(403)
                        .json({ message: 'Forbidden: User not found' }); // user is not found
                }
                return;
            } catch (e) {
                response.status(400).json({ message: 'ERROR: ' + e });
                return;
            }
        } else {
            next(); // go to next method in middleware chain if not auth for perms is required
        }
        return;
    };
}
