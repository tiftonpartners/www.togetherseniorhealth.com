module.exports = async function () {
    await global._mongod.stop();
};
