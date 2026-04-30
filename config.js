// config.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const { OpenAI } = require('openai');

// Конфигурация БД из твоего .env
const dbConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.USER || 'root',
    password: process.env.DBPASSWORD || 'DBPASSW0RD',
    database: process.env.DATABASE || 'talesdb',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Настройка клиента DeepSeek
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.API_KEY
});

module.exports = { pool, openai };