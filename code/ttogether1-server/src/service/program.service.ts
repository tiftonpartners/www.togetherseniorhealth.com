require('dotenv').config();
import { Auth0Token } from '../api/token.types';
import { UserInfo } from '../av/user.service';
import { Logger } from '../core/logger.service';
import { Program, ProgramDoc, ProgramModel } from '../db/program.db';

const log = Logger.logger('ProgramService');

/**
 * Provides additional functionality for Programs
 */
export class ProgramService {
    static programsCount: number;
    /**
     * Get all programs available
     */
    static async getAllPrograms(): Promise<ProgramDoc[]> {
        try {
            return await ProgramModel.find();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get all programs available for current user
     */
    static async getMyPrograms(
        userInfo: UserInfo
    ): Promise<{ programs: ProgramDoc[]; all?: boolean } | undefined> {
        try {
            if (userInfo) {
                const data = userInfo.tokenPrograms;
                const programs = data.programs;

                return await ProgramService.getProgramsByAcronyms(
                    programs,
                    data.all
                );
            }
            return;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get all programs available for acronyms given
     * @param acronyms list of acronyms to find programs from
     */
    static async getProgramsByAcronyms(
        acronyms: string[],
        all?: boolean
    ): Promise<{ programs: ProgramDoc[]; all?: boolean }> {
        try {
            if (all) {
                return {
                    programs: await ProgramModel.find(),
                    all: true,
                };
            } else {
                return {
                    programs: await ProgramModel.find({
                        acronym: { $in: acronyms },
                    }),
                };
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Create program
     * @param program Information to create program
     */
    static async createProgram(program: Program): Promise<ProgramDoc> {
        try {
            const programDb = await ProgramModel.findOne({
                $or: [
                    { acronym: program.acronym },
                    { shortName: program.shortName },
                ],
            });

            if (programDb) {
                throw new Error(
                    `Program for acronym ${program.acronym} or shortName ${program.shortName} already exists`
                );
            }

            return await ProgramModel.create({
                ...program,
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update program
     * @param program Information to update program
     */
    static async updateProgram({
        acronym,
        shortName,
        ...rest
    }: Partial<Program>): Promise<ProgramDoc | null> {
        try {
            let toUpdate: Partial<Program> = {
                ...rest,
            };

            if (!acronym) {
                throw new Error(`No program acronym provided`);
            }

            const programDb = await ProgramModel.findOne({
                acronym: acronym,
            });

            if (!programDb) {
                throw new Error(`No program found for acronym ${acronym}`);
            }

            if (shortName) {
                const programWithShortName = await ProgramModel.findOne({
                    shortName,
                });

                if (programWithShortName) {
                    throw new Error(
                        `Program already exists with shortName ${shortName}`
                    );
                }

                toUpdate = {
                    ...toUpdate,
                    shortName: shortName,
                };
            }

            return await ProgramModel.findOneAndUpdate(
                {
                    acronym,
                },
                toUpdate,
                {
                    new: true,
                    useFindAndModify: false,
                }
            );
        } catch (e) {
            throw e;
        }
    }
}

(async () => {
    const programs = await ProgramModel.find();
    ProgramService.programsCount = programs.length;
    log.info(
        `[ProgramService] (init) Setting programsCount to ${programs.length}`
    );
})();
