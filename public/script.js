// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBDZoOipyP_qpzpguPfCPG1uAUukPjZZY0",
    authDomain: "messen-a1dea.firebaseapp.com",
    projectId: "messen-a1dea",
    storageBucket: "messen-a1dea.appspot.com",
    messagingSenderId: "420750574907",
    appId: "1:420750574907:web:09700b9c4742ae0a18231e",
    measurementId: "G-BWMYJCM21B"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Hiển thị giao diện nickname sau khi đăng ký
document.getElementById('register-btn').onclick = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        alert('Đăng ký thành công!');
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('nickname-container').style.display = 'block';
    } catch (error) {
        alert(error.message);
    }
};

// Lưu nickname và chuyển đến trang chat
document.getElementById('submit-nickname-btn').onclick = async function() {
    const nickname = document.getElementById('nickname').value;
    const user = auth.currentUser;

    if (nickname) {
        await db.collection('users').doc(user.uid).set({ nickname: nickname });
        document.getElementById('nickname-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
        loadMessages();
    }
};

// Đăng nhập và chuyển đến trang chat
document.getElementById('login-btn').onclick = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
        loadMessages();
    } catch (error) {
        alert(error.message);
    }
};

// Gửi tin nhắn
document.getElementById('send-btn').onclick = async function() {
    const message = document.getElementById('message').value;
    const user = auth.currentUser;

    if (message) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const nickname = userDoc.data().nickname;

        await db.collection('messages').add({
            text: message,
            sender: user.uid,
            nickname: nickname,
            timestamp: new Date()
        });
        document.getElementById('message').value = '';
    }
};

// Tải và hiển thị tin nhắn
function loadMessages() {
    const messagesQuery = db.collection('messages').orderBy('timestamp', 'asc');

    messagesQuery.onSnapshot((snapshot) => {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';

        snapshot.forEach((doc) => {
            const messageData = doc.data();
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');

            if (messageData.sender === auth.currentUser.uid) {
                messageElement.classList.add('sender');
                messageElement.textContent = `Bạn (${messageData.nickname}): ${messageData.text}`;
            } else {
                messageElement.classList.add('receiver');
                messageElement.textContent = `${messageData.nickname}: ${messageData.text}`;
            }

            messagesDiv.appendChild(messageElement);
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Lắng nghe trạng thái đăng nhập
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
        loadMessages();
    }
});