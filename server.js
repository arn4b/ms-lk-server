const express = require('express');
const cors = require('cors');

require('dotenv').config();

const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const createRoom = async (roomId) => {
    const livekitHost = 'https://spacev2-demo-17wvllxz.livekit.cloud';
    const roomService = new RoomServiceClient(livekitHost, process.env.LK_API_KEY, process.env.LK_API_SECRET);

    const opts = {
        name: roomId,
        emptyTimeout: 10 * 60, // 10 minutes
        maxParticipants: 20,
    };

    try {
        const room = await roomService.createRoom(opts);
        console.log('room created', room);
        return room.name;
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
}

const createToken = async ({ canPublish, userName, roomId }) => {
    // if this room doesn't exist, it'll be automatically created when the first
    // client joins
    const roomName = await createRoom(roomId);
    // identifier to be used for participant.
    // it's available as LocalParticipant.identity with livekit-client SDK
    const participantName = userName;

    const at = new AccessToken(process.env.LK_API_KEY, process.env.LK_API_SECRET, {
        identity: participantName,
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: canPublish,
        canSubscribe: true,
    });

    return at.toJwt();
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/token', async (req, res) => {
    const userType = req.query.userType;
    const userName = req.query.userName;
    const roomId = req.query.roomId;

    let canPublish = false;
    if (userType === 'sender') {
        canPublish = true;
    } else if (userType === 'receiver') {
        canPublish = false;
    }

    const token = await createToken({ canPublish, userName, roomId });
    console.log("🚀 ~ file: server.js:68 ~ app.get ~ token:", token)

    res.send(token);
});

app.get('/createRoom', (req, res) => {
    const roomId = req.query.roomId;

    const room = createRoom(roomId)
    res.send(room);
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})