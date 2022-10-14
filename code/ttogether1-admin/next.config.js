module.exports = {
    target: 'serverless',
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: true
            }
        ];
    }
};
