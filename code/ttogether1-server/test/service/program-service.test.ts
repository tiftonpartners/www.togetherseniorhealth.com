require('moment-recur');
require('dotenv').config();
import mongoose from 'mongoose';
import {
    getMongoConfig,
    TestGlobalMongoConfig,
} from '../config/testGlobal';
import { buildProgramSeedData } from '../../src/seed/program.sample';
import { ProgramService } from '../../src/service/program.service';
import testToken1 from '../data/test-token.json';
import { UserService } from '../../src/av/user.service';

let mongoConfig = new TestGlobalMongoConfig();

describe('ProgramService Tests', () => {
    beforeEach(async () => {
        mongoConfig = await getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
        await buildProgramSeedData();
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });

    it('should get all programs', async () => {
        const programs = await ProgramService.getAllPrograms();

        expect(programs).toBeTruthy();
        expect(programs.length).toEqual(7);
    });

    it("should get current user's programs", async () => {
        const u1 = await UserService.rememberUser(testToken1);
        expect(u1).toBeTruthy();

        if (u1) {
            const data = await ProgramService.getMyPrograms(u1);

            expect(data?.programs).toBeTruthy();

            if (data?.programs) {
                expect(data.programs.length).toEqual(2);
            }
        }
    });

    it('should get all programs for acronyms given', async () => {
        const data = await ProgramService.getProgramsByAcronyms(['RS', 'CC']);

        expect(data.programs).toBeTruthy();
        expect(data.programs.length).toEqual(2);
    });

    it('should create a program', async () => {
        const program = await ProgramService.createProgram({
            acronym: 'TEST2',
            shortName: 'TEST2 Program',
            longName: 'TEST2 Program',
            description: 'TEST2 Program',
            logoUrl: '/',
            coordinatorName: 'TEST2 COORD',
            coordinatorEmail: 'coord@tsh.care',
            coordinatorPhone: '333-333-3333',
        });

        expect(program).toBeTruthy();
        expect(program.createdOn).toBeTruthy();
        expect(program.acronym).toEqual('TEST2');
    });

    it('should maintain program acronyms as unique', async () => {
        await ProgramService.createProgram({
            acronym: 'TEST2',
            shortName: 'TEST2 Program',
            longName: 'TEST2 Program',
            description: 'TEST2 Program',
            logoUrl: '/',
            coordinatorName: 'TEST2 COORD',
            coordinatorEmail: 'coord@tsh.care',
            coordinatorPhone: '333-333-3333',
        });
        await expect(
            ProgramService.createProgram({
                acronym: 'TEST2',
                shortName: 'TEST2 Program',
                longName: 'TEST2 Program',
                description: 'TEST2 Program',
                logoUrl: '/',
                coordinatorName: 'TEST2 COORD',
                coordinatorEmail: 'coord@tsh.care',
                coordinatorPhone: '333-333-3333',
            })
        ).rejects.toThrow(
            `Program for acronym TEST2 or shortName TEST2 Program already exists`
        );
    });

    it('should update a program', async () => {
        await ProgramService.createProgram({
            acronym: 'TEST2',
            shortName: 'TEST2 Program',
            longName: 'TEST2 Program',
            description: 'TEST2 Program',
            logoUrl: '/',
            coordinatorName: 'TEST2 COORD',
            coordinatorEmail: 'coord@tsh.care',
            coordinatorPhone: '333-333-3333',
        });

        const program = await ProgramService.updateProgram({
            acronym: 'TEST2',
            shortName: 'TEST2 Program Updated',
        });

        expect(program).toBeTruthy();
        expect(program?.shortName).toEqual('TEST2 Program Updated');

        const programShortNameAlreadyExists = ProgramService.updateProgram({
            acronym: 'TEST',
            shortName: 'TEST2 Program Updated',
        });

        await expect(programShortNameAlreadyExists).rejects.toThrow(
            `Program already exists with shortName TEST2 Program Updated`
        );
    });
});
