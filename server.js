const express = require('express');
const cors = require('cors');

require('dotenv').config();

const { AccessToken } = require('livekit-server-sdk');

const createToken = ({ canPublish, userName }) => {
    // if this room doesn't exist, it'll be automatically created when the first
    // client joins
    const roomName = 'spacev2-demo';
    // identifier to be used for participant.
    // it's available as LocalParticipant.identity with livekit-client SDK
    const participantName = userName;

    const at = new AccessToken(process.env.LK_API_KEY, process.env.LK_API_SECRET, {
        identity: participantName,
    });

    console.log(userName)
    console.log(canPublish)

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

app.get('/token', (req, res) => {
    const userType = req.query.userType;
    const userName = req.query.userName;

    let canPublish = false;
    if (userType === 'sender') {
        canPublish = true;
    } else if (userType === 'receiver') {
        canPublish = false;
    }

    const token = createToken({ canPublish, userName });

    res.send(token);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})