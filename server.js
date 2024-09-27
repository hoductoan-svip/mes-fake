const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect('mongodb+srv://thanhalinh56:efKr1iSs7U3VvNws@cluster1.r0ghg.mongodb.net/cluster1?retryWrites=true&w=majority&appName=Cluster1&ssl=true', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    nickname: String
});

const User = mongoose.model('User', userSchema);

const messages = [];

io.on('connection', (socket) => {
    let nickname = '';

    socket.on('setNickname', (nick) => {
        nickname = nick;
    });

    socket.on('sendMessage', (message) => {
        const msg = { nickname, message };
        messages.push(msg);
        io.emit('receiveMessage', msg);
    });
});

// Đăng ký
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email đã tồn tại!' });
    }

    const user = new User({ email, password });
    await user.save();
    res.json({ success: true });
});

// Đăng nhập
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác!' });
    }

    res.json({ success: true });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
