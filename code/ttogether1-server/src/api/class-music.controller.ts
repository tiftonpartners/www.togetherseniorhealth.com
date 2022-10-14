import { Request, Response } from 'express';
import { Logger } from '../core/logger.service';
import { AuthController } from './auth.controller';
import { ClassMusicFile, ClassMusicService } from '../av/class-music.service';
require('dotenv').config();

/**
 * Controller to implement REST API for Courses in MongoDB
 */
export class ClassMusicController extends AuthController {
    /**
     * Get all courses
     * @param req
     * @param res
     */
    static apiGetMusicFiles = async (req: Request, res: Response) => {
        try {
            res.json(await ClassMusicService.getMusicFiles());
        } catch (e) {
            res.status(500).send('ERROR getting class music files: ' + e.message);
        }
    };

}
