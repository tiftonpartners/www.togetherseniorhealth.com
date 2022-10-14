import { Request, Response } from 'express';
import { Logger } from '../core/logger.service';
import { AuthController } from './auth.controller';
import { Course, CourseModel } from '../db/course.db';
import { ProgramService } from '../service/program.service';
import { Program } from '../db/program.db';
require('dotenv').config();

/**
 * Controller to implement REST API for Programs in MongoDB
 */
export class ProgramController extends AuthController {
    /**
     * Get all programs
     * @param req
     * @param res
     */
    static apiGetAllPrograms = async (req: Request, res: Response) => {
        try {
            const programs = await ProgramService.getAllPrograms();
            res.status(200).json(programs);
        } catch (e) {
            res.status(500).send('ERROR getting programs: ' + e.message);
        }
    };

    /**
     * Get current user's programs
     * @param req
     * @param res
     */
    static apiGetMyPrograms = async (req: Request, res: Response) => {
        try {
            const programs = await ProgramService.getMyPrograms(
                res.locals.userInfo
            );
            res.status(200).json(programs);
        } catch (e) {
            res.status(500).send('ERROR getting programs: ' + e.message);
        }
    };

    /**
     * Get programs for acronyms given
     * @param req
     * @param res
     */
    static apiGetProgramsByAcronyms = async (
        req: Request<{}, {}, { acronyms: string[] }>,
        res: Response
    ) => {
        try {
            const acronyms = req.body.acronyms;
            const programs = await ProgramService.getProgramsByAcronyms(
                acronyms
            );
            res.status(200).json(programs);
        } catch (e) {
            res.status(500).send(
                'ERROR getting programs by acronyms: ' + e.message
            );
        }
    };

    /**
     * Create program
     * @param req
     * @param res
     */
    static apiCreateProgram = async (
        req: Request<{}, {}, Program>,
        res: Response
    ) => {
        try {
            const program = req.body;
            const programDb = await ProgramService.createProgram(program);
            res.status(200).json(programDb);
        } catch (e) {
            res.status(500).send('ERROR creating program: ' + e.message);
        }
    };

    /**
     * Update program
     * @param req
     * @param res
     */
    static apiUpdateProgram = async (
        req: Request<{}, {}, Partial<Program>>,
        res: Response
    ) => {
        try {
            const program = req.body;
            const programDb = await ProgramService.updateProgram(program);
            res.status(200).json(programDb);
        } catch (e) {
            res.status(500).send('ERROR updating program: ' + e.message);
        }
    };
}
