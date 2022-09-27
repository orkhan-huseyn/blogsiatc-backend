const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Message = require('./models/messages');

// TODO: check if token expired
// TODO: implement some good room logic

module.exports = (httpServer) => {
  const { Server } = require('socket.io');
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.of('/chat').on('connection', async (socket) => {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      socket.disconnect(true);
      return;
    }

    const cookies = cookie.parse(socket.handshake.headers.cookie);
    const accessToken = cookies['app-access-token'];
    const userInfo = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

    socket.join(userInfo.id);

    await User.findByIdAndUpdate(userInfo.id, { online: true });

    socket.broadcast.emit('user online', userInfo.id);

    socket.on('join room', (userId) => {
      socket.join(userId);
      socket.broadcast.emit('new user', userId);
    });

    socket.on('disconnecting', async () => {
      socket.broadcast.emit('user offline', userInfo.id);
      await User.findByIdAndUpdate(userInfo.id, { online: false });
    });

    socket.on('send message', async (data) => {
      const { userId, content } = data;

      const message = new Message({
        fromUser: userInfo.id,
        toUser: userId,
        content,
      });
      await message.save();

      const formattedMessage = {
        id: message._id,
        content: message.content,
        createdAt: message.createdAt,
        fromMyself: false,
        fromUser: userInfo.id,
      };

      socket.to(userId).emit('new message', formattedMessage);
    });
  });
};
