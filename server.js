const express = require('express');
const cors = require('cors');

require('dotenv').config();

const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const livekitHost = 'https://spacev2-demo-17wvllxz.livekit.cloud';
const roomService = new RoomServiceClient(livekitHost, process.env.LK_API_KEY, process.env.LK_API_SECRET);

const createRoom = async (roomId) => {
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

const performAction = async ({ roomName, identity, canPublish }) => {
    if (canPublish) {
    try {
        const res = await roomService.updateParticipant(roomName, identity, undefined, {
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        return res;
    } catch (error) {
        console.error("🚀 ~ file: server.js:61 ~ performAction - TRUE ~ error:", error)
    }
    } else {
        try {
            const res = await roomService.updateParticipant(roomName, identity, undefined, {
                canPublish: false,
                canSubscribe: true,
                canPublishData: true,
            });

            return res;
        } catch (error) {
            console.error("🚀 ~ file: server.js:73 ~ performAction - FALSE ~ error:", error)
        }
    }
}

const kick = async ({ roomName, identity }) => {
    await roomService.removeParticipant({
        room: roomName,
        identity: identity,
    });
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

    res.send(token);
});

app.get('/execute', async (req, res) => {
    const roomName = req.query.roomName;
    const identity = req.query.identity;
    const canPublish = JSON.parse(req.query.canPublish);

    const updatedPeer = await performAction({ roomName, identity, canPublish });
    console.log("🚀 ~ file: server.js:101 ~ app.get ~ updatedPeer:", updatedPeer)
    res.send(updatedPeer);
})

app.get('/kick', async (req, res) => {
    const roomName = req.query.roomName;
    const identity = req.query.identity;

    const kicked = await kick({ roomName, identity });
    res.send(kicked);
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})