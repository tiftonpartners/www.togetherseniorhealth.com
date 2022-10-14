module.exports = {
    apps: [
        {
            name: 'app',
            script: './dist/src/index.js',
            instances: '1',
            autorestart: true,
            env_development: {},
            env_production: {},
        },
    ],
};
