const { JsonWebTokenError } = require('jsonwebtoken');
const { ClassMusicService } = require('../../src/av/class-music.service');
const axios = require('axios');
import { Logger } from '../../src/core/logger.service';
const log = Logger.logger('ClassMusicTest');

describe('Class Music', () => {
    it('should get a list of music files that we can download', async () => {
        const files = await ClassMusicService.getMusicFiles();
        let errorFound = false;
        expect(files.length).toBeGreaterThan(0);
        // Check that we can actuall access the files.
        // Files with an apostrophe in the name cause
        // access errors.
        const results$ = files.map(async (f) => {
            expect(f).toBeTruthy();
            expect(f.title).toBeTruthy();
            expect(f.title.length).toBeGreaterThan(0);
            expect(f.ext).toEqual('.mp3');
            expect(f.size).toBeGreaterThan(0);
            try {
                return await axios.get(f.signedURI);
            } catch (e) {
                errorFound = true;
                log.info('Failed on:', f.title, f.signedURI);
            }
        });
        await Promise.all(results$);
        expect(errorFound).toBeFalsy();
        return;
    });
});
