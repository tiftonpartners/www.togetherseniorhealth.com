module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
            diagnostics: false,
            ignoreCodes: [2339],
        },
    },
    testRunner: 'jest-circus/runner',
    preset: 'ts-jest',
    testTimeout: 50000,
    globalSetup: './config/setup.ts',
    globalTeardown: './config/teardown.js',
    setupFilesAfterEnv: ['./config/mocksSetup.ts'],
    modulePathIgnorePatterns: ['rest'],
    testEnvironment: 'node',
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
        '^.+\\.ts?$': 'ts-jest',
    },
    rootDir: './test',
    testMatch: ['**/*.test.(ts|js)'],
};
