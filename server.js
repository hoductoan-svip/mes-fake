const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Kết nối MongoDB
mongoose.connect('mongodb+srv://thanhalinh56:efKr1iSs7U3VvNws@cluster1.r0ghg.mongodb.net/cluster1?retryWrites=true&w=majority&appName=Cluster1&ssl=true', 
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Kết nối đến MongoDB thành công!'))
.catch(err => console.error('Lỗi kết nối đến MongoDB:', err));

// Định nghĩa schema và model
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    nickname: String
});

const User = mongoose.model('User', userSchema);

const visitLogSchema = new mongoose.Schema({
    nickname: String,
    connectTime: { type: Date, default: Date.now },
    disconnectTime: Date
});

const VisitLog = mongoose.model('VisitLog', visitLogSchema);

const messageSchema = new mongoose.Schema({
    nickname: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Quản lý nickname
const nicknames = {};  // Đối tượng để lưu trữ nickname của từng socket

io.on('connection', (socket) => {
    let nickname = '';
    let visitEntry = null;

    // Xử lý khi người dùng đặt nickname
    socket.on('setNickname', (nick) => {
        nickname = nick;
        nicknames[socket.id] = nickname; // Lưu nickname vào đối tượng nicknames

        visitEntry = new VisitLog({ nickname });
        visitEntry.save().then(() => {
            console.log(`${nickname} đã kết nối.`);
        });
    });

    // Xử lý khi người dùng gửi tin nhắn
    socket.on('sendMessage', (message) => {
        const msg = { nickname, message };
        const newMessage = new Message(msg);
        newMessage.save().then(() => {
            console.log(`Tin nhắn từ ${nickname} đã được lưu.`);
        }).catch((err) => {
            console.error('Lỗi khi lưu tin nhắn:', err);
        });
        io.emit('receiveMessage', msg);
    });

    // Xử lý khi người dùng ngắt kết nối
    socket.on('disconnect', () => {
        if (visitEntry) {
            visitEntry.disconnectTime = new Date();
            visitEntry.save().then(() => {
                console.log(`${nickname} đã ngắt kết nối.`);
            });
        }
        delete nicknames[socket.id]; // Xóa nickname khi ngắt kết nối
    });
});

// Route đăng ký
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

// Route đăng nhập
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác!' });
    }

    res.json({ success: true });
});

// Chạy server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
