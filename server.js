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
    let color = '';  // Biến để lưu màu sắc của người dùng
    let visitEntry = null;  // Biến để lưu thông tin truy cập của người dùng

    // Mảng các màu sắc để lựa chọn
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD', '#E67E22', '#2ECC71'];

    // Xử lý khi người dùng đặt nickname
    socket.on('setNickname', (nick) => {
        nickname = nick;
        color = colors[Math.floor(Math.random() * colors.length)];  // Gán ngẫu nhiên một màu

        // Tạo bản ghi lịch sử truy cập khi người dùng đặt nickname
        visitEntry = new VisitLog({ nickname });
        visitEntry.save().then(() => {
            console.log(`${nickname} đã kết nối với màu: ${color}`);
        });
    });

    // Xử lý khi người dùng gửi tin nhắn
    socket.on('sendMessage', (message) => {
        const msg = { nickname, message, color };  // Gửi kèm cả màu sắc của người dùng
        messages.push(msg);  // Đẩy tin nhắn vào mảng để lưu trữ cục bộ

        // Lưu tin nhắn vào MongoDB
        const newMessage = new Message({ nickname, message });
        newMessage.save().then(() => {
            console.log(`Tin nhắn từ ${nickname} đã được lưu.`);
        }).catch((err) => {
            console.error('Lỗi khi lưu tin nhắn:', err);
        });

        // Phát tin nhắn tới tất cả client kèm theo màu sắc của người dùng
        io.emit('receiveMessage', msg);
    });

    // Xử lý khi người dùng ngắt kết nối
    socket.on('disconnect', () => {
        if (visitEntry) {
            visitEntry.disconnectTime = new Date();  // Ghi nhận thời gian ngắt kết nối
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
