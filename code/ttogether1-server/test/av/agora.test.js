const { AgoraClientService } = require("../../src/av/agora-client.service");

const TEST_USER = "testuser1";
const TEST_ROOM_PREFIX = "TestRoom-";
const TIME_MARGIN_MSEC = 1000; // Time margin for difference in server times

function getRandomInt() {
  return new Date().getTime();
}
function getRandomRoomName() {
  return `${TEST_ROOM_PREFIX}${getRandomInt()}`;
}

describe("Agora - REST API", () => {
  it("should create a Agora Client Service Instance", async () => {
    const roomName = getRandomRoomName();
    const startTime = new Date().getTime() - TIME_MARGIN_MSEC;
  });

  it("should create a Agora access token", async () => {
    const roomName = getRandomRoomName();
    token = AgoraClientService.getChannelUserToken(roomName, 100)
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThanOrEqual(139);
  });
});
