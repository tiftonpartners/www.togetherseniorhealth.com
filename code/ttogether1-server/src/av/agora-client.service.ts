import {
    RtcTokenBuilder,
    RtmTokenBuilder,
    RtcRole,
    RtmRole,
} from 'agora-access-token';
import { Logger } from '../core/logger.service';
require('dotenv').config();

const log = Logger.logger('AgoriaClientService');

const agoraAppId = process.env.AGORA_APP_ID as string;
const agoraAppCert = process.env.AGORA_APP_CERT as string;
const agoraTokenExpiration = +(process.env.AGORA_TOKEN_EXPIRATION as string);

/**
 * This service makes calls to the Agora APIs
 */
export class AgoraClientService {
    public static GROUP_ROOM_MAX: number = 16; // Maximum number of participants in a group room

    static getChannelUserToken(channelName: string, uid: number) {
        const expires = Math.floor(Date.now() / 1000) + agoraTokenExpiration;
        // @ts-ignore
        return RtcTokenBuilder.buildTokenWithUid(
            agoraAppId,
            agoraAppCert,
            channelName,
            uid,
            RtcRole.PUBLISHER,
            expires
        );
    }
}
