import axios from 'axios';
import { AgoraRecordingService } from '../../src/av/agora-recording.service';
import { Logger } from '../../src/core/logger.service';
const log = Logger.logger('AgoraRecordingTest');

// const channel = 'Testing2';
// const uid = 1004;

// function getRandomInt() {
//     return new Date().getTime();
// }

// function sleep(msg, secs) {
//     log.info(`Sleeping for ${secs} seconds: ${msg}`);
//     return new Promise((resolve) => setTimeout(resolve, secs * 1000));
// }

describe('Agora - Recording REST API', () => {
    // Run through an entire recording cycle (aquire, start, query, stop)
    // using the Agora Client Service.
    //
    // *NOTE* This needs to be run while the channel is active - could not find a way
    // to isolate each function for testing
    // async function doRecordingTest(compositeMode) {
    //     let token = AgoraClientService.getChannelUserToken(channel, uid);
    //     expect(token).toBeTruthy();
    //     expect(token.length).toBeGreaterThanOrEqual(139);

    //     const resourceId = await AgoraRecordingService.acquireResource(
    //         channel,
    //         uid
    //     );
    //     expect(resourceId).toBeTruthy();
    //     expect(resourceId.length).toBeGreaterThanOrEqual(299);

    //     let sid = null;
    //     try {
    //         sid = await AgoraRecordingService.startRecording(
    //             channel,
    //             uid,
    //             resourceId,
    //             token,
    //             compositeMode
    //         );
    //     } catch (e) {
    //         log.info(
    //             'Recording could not be started.  Error:',
    //             e.data,
    //             e.message
    //         );
    //         throw new Error('Test Failed');
    //     }
    //     expect(sid).toBeTruthy();
    //     expect(sid.length).toBeGreaterThanOrEqual(10);
    //     await sleep('Recording has been started', 10);

    //     let result = await AgoraRecordingService.queryRecording(
    //         resourceId,
    //         sid,
    //         compositeMode
    //     );
    //     log.info('Query Result:', result);
    //     await sleep('Recording more', 10);

    //     result = await AgoraRecordingService.stopRecording(
    //         channel,
    //         uid,
    //         resourceId,
    //         sid,
    //         compositeMode
    //     );
    //     return result;
    // }

    // it('should do Agora Recording test in individual mode', async () => {
    //     const result = await doRecordingTest(false);
    //     expect(result.serverResponse.fileListMode).toEqual('json');
    //     const files = [];
    //     for (file of result.serverResponse.fileList) {
    //         files.push(file.fileName);
    //     }
    //     log.info('Recording Files:', files);
    // });

    // it('should do Agora Recording test in composite mode', async () => {
    //     const result = await doRecordingTest(true);
    //     expect(result.serverResponse.fileListMode).toEqual('string');

    //     log.info('Recording File:', result.serverResponse.fileList);
    // });

    // it('should get a list of recordings files that we can download', async () => {
    //     const files = await AgoraRecordingService.getRecordingFiles();
    //     let errorFound = false;
    //     expect(files.length).toBeGreaterThan(0);
    //     // Check that we can actuall access the files.
    //     // Files with an apostrophe in the name cause
    //     // access errors.
    //     const results$ = files.map(async (f) => {
    //         expect(f).toBeTruthy();
    //         expect(f.title).toBeTruthy();
    //         expect(f.title.length).toBeGreaterThan(0);
    //         expect(f.ext === '.m3u8' || f.ext === '.ts').toBeTruthy();
    //         expect(f.size).toBeGreaterThan(0);
    //         try {
    //             return await axios.get(f.signedURI);
    //         } catch (e) {
    //             errorFound = true;
    //             log.info('Failed on:', f.title, f.signedURI);
    //         }
    //     });
    //     await Promise.all(results$);
    //     expect(errorFound).toBeFalsy();
    //     return;
    // });

    it('should get a list of recordings files that we can download by session', async () => {
        const files = await AgoraRecordingService.getRecordingFilesForSession(
            'MTSTANDG1-211208'
        );
        let errorFound = false;

        if (files) {
            expect(files.length).toBeGreaterThan(0);
            const results$ = files.map(async (f) => {
                expect(f).toBeTruthy();
                expect(f.title).toBeTruthy();
                expect(f.title.length).toBeGreaterThan(0);
                expect(f.title.includes('MTSTANDG1-211208')).toBeTruthy();
                expect(f.ext === '.m3u8' || f.ext === '.ts').toBeTruthy();
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
        } else {
            throw new Error('No recordings found');
        }

        return;
    });
});
