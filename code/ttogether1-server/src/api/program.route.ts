import { Router } from 'express';
import { ProgramController } from './program.controller';
import permissions from './permissions.middleware';
import { Logger } from '../core/logger.service';
const log = Logger.logger('ProgramRouter');
// @ts-ignore:
export const programRouter = new Router();
try {
    programRouter
        .route('/all')
        .get(
            permissions('apiGetAllPrograms'),
            ProgramController.apiGetAllPrograms
        );
    programRouter
        .route('/me')
        .get(
            permissions('apiGetMyPrograms'),
            ProgramController.apiGetMyPrograms
        );
    programRouter
        .route('/byAcronyms')
        .get(
            permissions('apiGetProgramsByAcronyms'),
            ProgramController.apiGetProgramsByAcronyms
        );
    programRouter
        .route('/')
        .post(
            permissions('apiCreateProgram'),
            ProgramController.apiCreateProgram
        );
    programRouter
        .route('/')
        .patch(
            permissions('apiUpdateProgram'),
            ProgramController.apiUpdateProgram
        );
} catch (e) {
    log.error(`Exception resolving Program controller: ${e}`);
}
