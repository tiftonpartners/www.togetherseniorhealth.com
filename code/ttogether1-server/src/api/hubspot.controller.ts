import { Request, Response } from 'express';
import { AVUser, UserType } from '../db/user.db';
import { UserService } from '../av/user.service';
import { Logger } from '../core/logger.service';
import moment from 'moment';
import { ClassService } from '../service/class.service';
import { AdHocSessionService } from '../service/adhoc-session.service';
import { GenericSession } from '../db/session.db';
import { Class } from '../db/class.db';

const log = Logger.logger('HubspotController');

enum UpcomingClassState {
    upcoming,
    lobby_is_open,
    class_is_open,
    next_class_available,
    signup_for_class,
}

export class HubspotController {
    /**
     * Create hubspot user
     * POST
     *  @returns New hubspot user
     */
    static apiCreateHubspotUser = async (
        req: Request<any, any, { user: AVUser }>,
        res: Response
    ) => {
        try {
            const user = req.body.user;

            const avUser = await UserService.createOrUpdateHubspotUser(
                user,
                UserType.Prospect,
                res.locals.userInfo
            );

            const result = {
                admin_app_external_user_id: avUser.userId,
                personal_link: `${
                    process.env.AV_BASE ?? ''
                }/session/upcoming?ticket=${avUser.ticket}`,
            };
            res.status(200).json(result);
        } catch (e: any) {
            log.warn(`ERROR: ${e.message ?? 'unknown error'}`);
            res.status(e.status ?? 500).json({
                code: e.status ?? 500,
                msg: e.message,
            });
        }
    };

    /**
     * Data to build banner of upcoming class
     * GET
     * @see https://togetherseniorhealth.atlassian.net/browse/TOG-1371
     */
    static apiUpcomingClassBannerData = async (
        req: Request<{ userid: string }>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid;
            log.info(`(apiUpcomingClassBannerData) userId: ${userId})`);

            // output structure
            let result = {
                class: {
                    name: '',
                    time: null,
                    lobby_open_time: null,
                },
                instructor: {
                    name: '',
                },
                link: {
                    url: '',
                },
                state: UpcomingClassState[UpcomingClassState.signup_for_class],
            };
            // common link
            const avUser = await UserService.getAVUserById(userId, [], false);
            result.link.url = `${
                process.env.AV_BASE ?? ''
            }/session/upcoming?ticket=${avUser.ticket}`;

            // do our magic
            let nearest_class_session_time = undefined;
            let nearest_adhoc_session_time = undefined;
            let nearest_session: GenericSession | undefined = undefined;

            const utc_now = new Date(Date.now());

            let classes = await ClassService.getUpcomingClasses(userId);
            classes.sort(HubspotController.earliestClassSessionSort);
            if (classes.length > 0) {
                // NB about courageous [0] - we always have a session in the upcoming result set
                nearest_class_session_time = new Date(
                    classes[0].sessions[0].scheduledStartTime
                );
            }

            const adhoc_sessions =
                await AdHocSessionService.getUpcomingSessions(userId);
            adhoc_sessions.sort(HubspotController.earliestGenericSessionSort);
            if (adhoc_sessions.length > 0) {
                nearest_adhoc_session_time = new Date(
                    adhoc_sessions[0].scheduledStartTime
                );
            }

            // the class session is first
            if (
                nearest_class_session_time !== undefined &&
                ((nearest_adhoc_session_time !== undefined &&
                    nearest_class_session_time < nearest_adhoc_session_time) ||
                    nearest_adhoc_session_time === undefined)
            ) {
                const nearest_class = classes[0];
                nearest_session = nearest_class.sessions[0];

                result.class.name = nearest_class.name;
                // @ts-ignore
                result.class.time = nearest_class_session_time;
                // @ts-ignore
                result.class.lobby_open_time = new Date(
                    nearest_session.lobbyOpenTime
                );
                result.instructor.name =
                    nearest_class.instructorData?.name ?? '';
            }

            // the adhoc session is first
            if (
                nearest_adhoc_session_time !== undefined &&
                ((nearest_class_session_time !== undefined &&
                    nearest_adhoc_session_time < nearest_class_session_time) ||
                    nearest_class_session_time === undefined)
            ) {
                nearest_session = adhoc_sessions[0];

                result.class.name = nearest_session.name;
                // @ts-ignore
                result.class.time = nearest_adhoc_session_time;
                // @ts-ignore
                result.class.lobby_open_time = new Date(
                    nearest_session.lobbyOpenTime
                );

                const instructor_info = await UserService.rememberUser(
                    nearest_session.instructorId
                );
                result.instructor.name = instructor_info?.userData?.name ?? '';
            }

            // adjust class status
            if (nearest_session !== undefined) {
                result.state =
                    UpcomingClassState[UpcomingClassState.next_class_available];
                if (
                    utc_now.getDate() ===
                    new Date(nearest_session.scheduledStartTime).getDate()
                ) {
                    // mimic session.db methods behavior here
                    // .opensAfterNow
                    if (utc_now < new Date(nearest_session.lobbyOpenTime)) {
                        result.state =
                            UpcomingClassState[UpcomingClassState.upcoming];
                    }
                    // .inSession
                    else if (
                        new Date(nearest_session.scheduledStartTime) <=
                            utc_now &&
                        new Date(nearest_session.scheduledEndTime) >= utc_now
                    ) {
                        result.state =
                            UpcomingClassState[
                                UpcomingClassState.class_is_open
                            ];
                    }
                    // .isOpenNow
                    else if (
                        new Date(nearest_session.lobbyOpenTime) <= utc_now &&
                        new Date(nearest_session.lobbyCloseTime) >= utc_now
                    ) {
                        result.state =
                            UpcomingClassState[
                                UpcomingClassState.lobby_is_open
                            ];
                    }
                }
            }

            res.status(200).json(result);
        } catch (e: any) {
            log.warn(`ERROR: ${e.message ?? 'unknown error'}`);
            res.status(e.status ?? 500).json({
                code: e.status ?? 500,
                msg: e.message,
            });
        }
    };

    static earliestClassSessionSort(a: Class, b: Class): number {
        if (a.sessions.length === 0 || b.sessions.length === 0) {
            return 1;
        }
        return HubspotController.earliestGenericSessionSort(
            a.sessions[0],
            b.sessions[0]
        );
    }

    static earliestGenericSessionSort(
        a: GenericSession,
        b: GenericSession
    ): number {
        const aTime: moment.Moment = moment(a.lobbyOpenTime);
        const bTime: moment.Moment = moment(b.lobbyOpenTime);
        if (aTime.isBefore(bTime)) {
            return -1;
        } else if (aTime.isSame(bTime, 's')) {
            return 0;
        }
        return 1;
    }
}
