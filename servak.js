const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Импортируем после создания app
const { initDB } = require('./db');
const taleRoutes = require('./routes/taleRoutes');

// Главная инициализация
async function startServer() {
    try {
        await initDB();

        // Подключаем маршруты
        app.use('/api/tales', taleRoutes);

        const PORT = process.env.PORT1 || process.env.PORT2 || 3000;
        app.listen(PORT, () => {
            console.log(`\n🚀 Сервер Дедушки Дрёмы успешно запущен!`);
            console.log(`   Адрес: http://localhost:${PORT}`);
            console.log(`   Фронтенд: http://localhost:${PORT}/osnova1.html\n`);
        });

    } catch (error) {
        console.error("❌ Критическая ошибка при запуске сервера:");
        console.error(error.message);
        console.error(error.stack);
        process.exit(1); // завершаем с ошибкой
    }
}

startServer();