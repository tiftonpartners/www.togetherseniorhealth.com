import { Request, Response, NextFunction } from 'express';
import { Logger } from '../core/logger.service';
import { AuthController } from './auth.controller';
import { Attendance, AttendanceModel } from '../db/attendance.db';
import { UserInfo } from '../av/user.service';

const moment = require('moment-timezone');
require('moment-recur');
require('dotenv').config();

const log = Logger.logger('AttendanceController');

/**
 * Controller to implement REST API for Classes in MongoDB
 */
export class AttendanceController extends AuthController {
    /**
     * Get attendance records for a specific user, given their Auth0 user ID
     */
    static apiGetUserAttendance = async (req: Request, res: Response) => {
        const userId = req.params['userId'];
        if (!userId) {
            log.debug('(apiGetClassByAcronym) Missing user id');
            res.status(400).send('ERROR: Missing user id');
            return;
        }

        try {
            res.json(await AttendanceModel.find({ userId: userId }));
        } catch (e) {
            res.status(500).send('ERROR getting attendance: ' + e.message);
        }
    };

    /**
     * Get attendance for a specific class, given its ID
     */
    static apiGetClassAttendance = async (req: Request, res: Response) => {
        const classId = req.params['classId'];
        if (!classId) {
            log.debug('(apiGetClassByAcronym) Missing acronym');
            res.status(400).send('ERROR: Missing Acronym for Class');
            return;
        }

        try {
            res.json(await AttendanceModel.find({ classId: classId }));
        } catch (e) {
            res.status(500).send('ERROR getting attendance: ' + e.message);
        }
    };

    /**
     * Get all of the attendance for a session given its acronym
     */
    static apiGetsessionAttendance = async (req: Request, res: Response) => {
        const acronym = req.params['acronym'];
        if (!acronym) {
            res.status(400).send('ERROR: Missing Acronym for Class Session');
            return;
        }
        if (!acronym.match(/([^\-])+\-(\d+)$/g)) {
            res.status(400).send(
                `ERROR: Invalid Acronym for Class Session: "${acronym}"`
            );
            return;
        }
        const [classAcronym, num] = acronym.split('-');

        try {
            res.json(await AttendanceModel.find({ sessionAcronym: acronym }));
        } catch (e) {
            res.status(500).send('ERROR getting attendance: ' + e.message);
        }
    };

    /**
     * Get all attendance for the current user
     */
    static apiGetMyAttendance = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            res.json(await AttendanceModel.find({ userId: user.userId }));
        } catch (e) {
            res.status(500).send('ERROR getting attendance: ' + e.message);
        }
    };
}
