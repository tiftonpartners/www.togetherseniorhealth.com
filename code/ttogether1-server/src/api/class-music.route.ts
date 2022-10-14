import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { ClassMusicController } from './class-music.controller';
import permissions from './permissions.middleware';

const log = Logger.logger('ClassMusicRouter');
// @ts-ignore:
export const classMusicRouter = new Router();
try {
    classMusicRouter
        .route('/files')
        .get(
            permissions('apiGetMusicFiles'),
            ClassMusicController.apiGetMusicFiles
        );
} catch (e) {
    log.error(`Exception resolving class music controller: ${e}`);
}
