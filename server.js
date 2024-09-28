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

mongoose.connect('mongodb+srv://thanhalinh56:efKr1iSs7U3VvNws@cluster1.r0ghg.mongodb.net/cluster1?retryWrites=true&w=majority&appName=Cluster1&ssl=true');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    nickname: String
});

const User = mongoose.model('User', userSchema);

const messages = [];
// Schema để lưu thông tin truy cập
const visitLogSchema = new mongoose.Schema({
    nickname: String,
    connectTime: { type: Date, default: Date.now },
    disconnectTime: Date
});

const VisitLog = mongoose.model('VisitLog', visitLogSchema);
// Schema để lưu tin nhắn
const messageSchema = new mongoose.Schema({
    nickname: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
io.on('connection', (socket) => {
    let nickname = '';
    let visitEntry = null;  // Biến để lưu thông tin truy cập của người dùng

    socket.on('setNickname', (nick) => {
        nickname = nick;
        // Tạo bản ghi lịch sử truy cập khi người dùng đặt nickname
        visitEntry = new VisitLog({ nickname });
        visitEntry.save().then(() => {
            console.log(`${nickname} đã kết nối.`);
        });
    });

    socket.on('disconnect', () => {
        if (visitEntry) {
            // Cập nhật thời gian ngắt kết nối khi người dùng rời đi
            visitEntry.disconnectTime = new Date();
            visitEntry.save().then(() => {
                console.log(`${nickname} đã ngắt kết nối.`);
            });
        }
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
