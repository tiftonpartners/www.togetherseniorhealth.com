import { EventEmitter } from 'events';

/**
 * This abstract class implements an object that requires a mutual-exclusion
 * lock on its instance variables
 *
 * See https://thecodebarbarian.com/mutual-exclusion-patterns-with-node-promises
 */
export class MutexObject {
    _locked = false;
    _ee = new EventEmitter();

    acquire(): Promise<void> {
        return new Promise((resolve) => {
            // If nobody has the lock, take it and resolve immediately
            if (!this._locked) {
                // Safe because JS doesn't interrupt you on synchronous operations,
                // so no need for compare-and-swap or anything like that.
                this._locked = true;
                return resolve();
            }

            // Otherwise, wait until somebody releases the lock and try again
            const tryAcquire = () => {
                if (!this._locked) {
                    this._locked = true;
                    this._ee.removeListener('release', tryAcquire);
                    return resolve();
                }
            };
            this._ee.on('release', tryAcquire);
        });
    }

    release() {
        // Release the lock immediately
        this._locked = false;
        setImmediate(() => this._ee.emit('release'));
    }
}
