const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Kết nối MongoDB
mongoose.connect('mongodb+srv://nguyenthimycute1106:o1UWInZVVMJQx5M0@cluster1.ne5vi.mongodb.net/?retryWrites=true&w=majority&appName=cluster1&ssl=true', 
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Kết nối đến MongoDB thành công!'))
.catch(err => console.error('Lỗi kết nối đến MongoDB:', err));

// Định nghĩa schema và model
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    nickname: String
});

const User = mongoose.model('User', userSchema);

// Route đăng ký
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email đã tồn tại!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ success: true });
});

// Route đăng nhập
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác!' });
    }

    res.json({ success: true });
});

// Chạy server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});