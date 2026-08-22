const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = {};
let withdrawalRequests = [];

app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'İstifadəçi adı daxil edin.' });

    if (!users[username]) {
        users[username] = { username, balance: 0, watchedAds: 0, lastAdTime: 0 };
    }
    res.json({ success: true, user: users[username] });
});

app.post('/api/watch-ad', (req, res) => {
    const { username } = req.body;
    const user = users[username];
    if (!user) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });

    const currentTime = Date.now();
    if (currentTime - user.lastAdTime < 10000) {
        return res.status(429).json({ error: 'Lütfən 10 saniyə gözləyin.' });
    }

    user.balance += 0.05;
    user.watchedAds += 1;
    user.lastAdTime = currentTime;

    res.json({ success: true, balance: user.balance.toFixed(2), watchedAds: user.watchedAds });
});

app.post('/api/withdraw', (req, res) => {
    const { username, cardNumber, amount } = req.body;
    const user = users[username];
    if (!user) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 5.00) {
        return res.status(400).json({ error: 'Minimum çıxarış 5.00 AZN-dir.' });
    }
    if (user.balance < withdrawAmount) {
        return res.status(400).json({ error: 'Balansınızda kifayət qədər vəsaət yoxdur.' });
    }

    user.balance -= withdrawAmount;
    withdrawalRequests.push({ username, cardNumber, amount: withdrawAmount, date: new Date().toLocaleString() });

    res.json({ success: true, message: 'Çıxarış sorğusu qəbul olundu.', newBalance: user.balance.toFixed(2) });
});

app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
