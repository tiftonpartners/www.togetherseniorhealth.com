const fs = require('fs');
import { ObjectUnsubscribedError } from 'rxjs';
import { Logger } from '../core/logger.service';
require('dotenv').config();
// Import required AWS SDK clients and commands for Node.js
const { S3Client, ListObjectsCommand } = require('@aws-sdk/client-s3');
const path = require('path');
var cfsign = require('aws-cloudfront-sign');

// Constants from environment variables.
const AccessKey = process.env.AWS_CLASS_MUSIC_ACCESS_KEY;
const Secret = process.env.AWS_CLASS_MUSIC_SECRET;
const Bucket = process.env.AWS_CLASS_MUSIC_BUCKET;
const Region = process.env.AWS_CLASS_MUSIC_REGION;
const KeyID = process.env.AWS_CLOUDFRONT_KEY_ID;
const UrlPrefix = process.env.AWS_CLOUDFRONT_MUSIC_PREFIX;
const ExpiresMins = Number(process.env.AWS_CLOUDFRONT_MUSIC_EXPIRES_MINS);
const SecretKeyFile = process.env.AWS_CLOUDFRONT_SECRET_KEY; // Could be an actual PEM key, or the name of local key file.

const s3 = new S3Client({
    region: Region,
    credentials: { accessKeyId: AccessKey, secretAccessKey: Secret },
});
const log = Logger.logger('ClassMusicService');

// The environment might contain the name of a local
// key file, in which case we read the contents.  Otherwise,
// the key is in the environment
let SecretKey = SecretKeyFile;
if (fs.existsSync(SecretKeyFile)) {
    log.debug(`Reading local Cloundfront key from file: ${SecretKeyFile}`);
    SecretKey = fs.readFileSync(SecretKeyFile, 'utf8');
} else {
    log.debug('Got Cloudfront key from environment');
}

/**
 * Information about a music file, including its Signed URI for
 * access via CloudFront
 */
export class ClassMusicFile {
    fileName = '';
    title = '';
    ext = '';
    size = 0;
    expireTime = ''; // Expiration time for the signedURI, ISO 8601
    signedURI = ''; // URI for access to CloudFront, signed
    unsignedURI = ''; // CloudFront URI, without signing.

    /**
     * Construct song object from S3 object.  Its signedURI will be calculated
     * to expire as determined by ExpiresMins
     * @param s3ObjectInfo Information about an S3 object, returned from ListObjectsCommand
     */
    constructor(s3ObjectInfo: any) {
        const f = path.parse(s3ObjectInfo.Key);
        this.fileName = s3ObjectInfo.Key;
        this.ext = f.ext;
        this.title = f.name;
        this.size = s3ObjectInfo.Size;
        this.extendSignedURI();
    }

    /**
     * Extend the expiration time of the signed URI
     */
    extendSignedURI() {
        const expireTime = new Date().getTime() + 1000 * 60 * ExpiresMins;
        this.expireTime = new Date(expireTime).toISOString();
        const signingParams = {
            keypairId: KeyID,
            privateKeyString: SecretKey,
            // Optional - this can be used as an alternative to privateKeyString
            // privateKeyPath: SecretKey,
            expireTime: expireTime,
        };
        this.unsignedURI = encodeURI(
            'https://' + UrlPrefix + '/' + this.fileName
        );
        this.signedURI = cfsign.getSignedUrl(
            // Note: This is confusing.  If the URI contains characters that
            // need URI encoding, the returned signed URI will be encoded,
            // but the signature will not match.
            this.unsignedURI,
            signingParams
        );
    }
}

export class ClassMusicService {
    static async getMusicFiles(): Promise<ClassMusicFile[]> {
        const objs = await s3.send(new ListObjectsCommand({ Bucket: Bucket }));
        // Note: There is an 'Icon' file of zero length that we filter out.
        return objs.Contents.filter((o: any) => o.Size > 0).map(
            (obj: any) => new ClassMusicFile(obj)
        );
    }
}
