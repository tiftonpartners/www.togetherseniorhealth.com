import { ProgramModel } from '../db/program.db';

require('moment-recur');
const { Logger } = require('../core/logger.service');
export const testPrograms = require('./sample-programs.json');

const log = Logger.logger('Program Bootstrapper');

/**
 * Buid seed/test data of programs
 *
 */
export const buildProgramSeedData = async (sampleProgramsJSON?: any) => {
    const samplePrograms = sampleProgramsJSON || testPrograms;

    let changeMade = false;

    try {
        for (const program of samplePrograms) {
            let programDb = await ProgramModel.findOne({
                acronym: program.acronym,
            });
            if (!programDb) {
                log.debug(`Building program: "${program.acronym}"`);
                changeMade = true;
                programDb = new ProgramModel();
            }

            Object.assign(programDb, program);
            await programDb.save();
        }

        const programs = await ProgramModel.find();

        if (changeMade) {
            log.info(
                `***** Changes were made Bootstrapping data.  The programs database contains ${programs.length} programs`
            );
        }

        log.info(
            `After bootstrapping data, the programs database contains ${programs.length} programs`
        );
    } catch (e) {
        log.error(e);
        return;
    }
    return;
};
