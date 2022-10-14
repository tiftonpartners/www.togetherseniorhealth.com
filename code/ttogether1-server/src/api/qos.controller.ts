require('dotenv').config();
import { Request, Response } from 'express'
import * as pkg from '../../package.json'

const agoraAppId = process.env.AGORA_APP_ID as string;
const dbHost: string = (process.env.DB_HOST as string);
const dbUsername: string = (process.env.DB_USERNAME as string);
const dbName = (process.env.DB_NAME as string);
const dbConnectString = `mongodb+srv://${dbUsername}:<password>@${dbHost}/${dbName}`;
const auth0Domain = process.env.AUTH0_CUSTOM_DOMAIN as string;
const auth0ClientId = process.env.AUTH0_MGMT_API_CLIENT_ID as string;

export class QosController {

    static apiHealth = async (req: Request, res: Response) => {
        try {
            res.status(200).send(`OK\nMoving Together API Server${pkg.version}\nDatabase:${dbConnectString}\nAgora App ID:${agoraAppId}\nAuth0 Domain:${auth0Domain} Auth0 AppId:${auth0ClientId}`)
        } catch (e) {
            res.status(500).send('ERROR ' + e.message)
        }
    }
}
