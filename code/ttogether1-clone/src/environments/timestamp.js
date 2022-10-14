// This is a utility to inject the current date/time
// into the environment.xxx.ts files so that the
// build time can be avaiable as part of the build.
//
// This will be called as part of the build process
//
// See https://medium.com/@izzatnadiri/how-to-inject-and-display-an-angular-build-timestamp-and-application-environment-details-in-67a312f80656

var replace = require('replace-in-file');
const fs = require('fs');
const moment = require('moment-timezone');

var timeStamp = moment(new Date())
  .tz('America/Los_Angeles')
  .format('YY-MM-DD_HHmm_zz');

const options = {
  files: ['src/environments/.env.ts'],
  from: /timeStamp: '(.*)'/g,
  to: "timeStamp: '" + timeStamp + "'",
  allowEmptyPaths: false
};

try {
  createTimestampIfNeeded(options);
  let changedFiles = replace.sync(options);
  if (changedFiles == 0) {
    throw "Please make sure that the file '" + options.files + "' has \"timeStamp: ''\"";
  }
} catch (error) {
  console.error('Error occurred:', error);
  throw error;
}

function createTimestampIfNeeded(options) {
  const TIMESTAMP_KEY = 'timeStamp';
  const EOF = '};';
  options.files.forEach(file => {
    try {
      const fileContent = fs.readFileSync(file);
      let fileContentString = (fileContent && fileContent.toString()) || '';
      const hasTimestamp = fileContentString.indexOf(TIMESTAMP_KEY);

      if (hasTimestamp === -1) {
        const timestampString = `   , ${TIMESTAMP_KEY}: ''
};`;
        fileContentString = fileContentString.replace(EOF, timestampString);
        fs.writeFileSync(file, fileContentString);
      }
    } catch (e) {
      console.error('Error createTimestampIfNeeded', e);
    }
  });
}
