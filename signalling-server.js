const socket_io = require("socket.io");
const {newMessage, newServerMessage} = require("./message");
const {addUser, removeUser, getUser, hasUser, getUsersInRoom} = require("./users");

module.exports = function (server) {
    const io = socket_io(server, {
        cors: {
            origin: ["http://localhost:3000",
                "http://10.0.0.195:3000",
                "https://hamikadze.github.io"],
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", function (socket) {
        console.log(`New connection`);

        const onJoin = function (data) {
            try {
                const {username, room} = JSON.parse(data);
                const {error, user} = addUser({id: socket.id, name: username, room});
                if (error) {
                    socket.emit('error',
                        {type: 'addUser', error: error});
                    return console.error(error);
                }
                socket.join(user.room);

                socket.emit('logged', {user: 'SERVER', data: user});
                socket.emit('message',
                    newServerMessage({
                        message: `${user.name}, Welcome to ${user.room} room.`
                    }));

                socket.broadcast.to(user.room).emit('message',
                    newServerMessage({message: `${user.name} has joined!`}));
                socket.broadcast.to(user.room).emit('webrtc_new_peer',
                    {user: 'SERVER', data: user});

                io.to(user.room).emit('roomData', {
                    room: user.room,
                    users: getUsersInRoom(user.room) // get user data based on user's room
                });
            } catch (e) {
                console.error(e);
            }
        }

        const onSendMessage = function ({text}) {
            try {
                const user = getUser(socket.id);
                io.to(user.room).emit('message', newMessage({user, message: text}));
            } catch (e) {
                console.error(e);
            }
        }

        const onRtcMessage = function (data) {
            try {
                console.log(data);
                const json = JSON.parse(data);
                const user = getUser(json.to);
                if (json.to !== undefined && hasUser(json.to)) {
                    console.log(`RTCMessage to: ${json.to} from ${json.id}`);
                    console.log([user, data]);
                    io.sockets.to(user.id).emit("webrtc", data);
                } else {
                    console.log(`RTCMessage to all in room: ${socket.room} from ${json.id}`)
                    socket.broadcast.to(user.room).emit("webrtc", data);
                }
            } catch (e) {
                console.error(e);
            }
        }

        const onDisconnect = function () {
            try {
                const user = removeUser(socket.id);

                if (user) {
                    io.to(user.room).emit('message',
                        newServerMessage({message: `${user.name.toUpperCase()} has left.`}));
                    io.to(user.room).emit('roomData', {
                        room: user.room,
                        users: getUsersInRoom(user.room)
                    });

                    console.log(`Disconnected`);
                    console.log(user);
                }
            } catch (e) {
                console.error(e);
            }
        }

        socket.on('join', onJoin)
        socket.on('webrtc', onRtcMessage);
        socket.on('disconnect', onDisconnect);
        socket.on('sendMessage', onSendMessage);
    });
};