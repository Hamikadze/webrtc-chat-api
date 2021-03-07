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
        const onJoin = (data) => {
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

        const onSendMessage = ({text}) => {
            try {
                const user = getUser(socket.id);
                io.to(user.room).emit('message', newMessage({user, message: text}));
            } catch (e) {
                console.error(e);
            }
        }

        const onRtcMessage = (data) => {
            try {
                const user = getUser(data.to);
                if (data.to !== undefined && hasUser(data.to)) {
                    io.sockets.to(user.id).emit("webrtc", data);
                } else {
                    console.log(`RTCMessage to all in room: ${socket.room} from ${data.id}`)
                    socket.broadcast.to(user.room).emit("webrtc", data);
                }
            } catch (e) {
                console.error(e);
            }
        }

        const onDisconnect = () => {
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