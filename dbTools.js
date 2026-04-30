// dbTools.js — улучшенные функции работы с базой
const { db } = require('./db');

const TABLE_SIZES = {
    3: "tiny",
    8: "small",
    16: "medium",
    32: "large"
};

// ====================== ПОЛЬЗОВАТЕЛЬ ======================
async function createUserIfNotExists(userId) {
    if (!db.data.users[userId]) {
        db.data.users[userId] = {
            user_id: parseInt(userId),
            name: null,
            sex: null,           // "male", "female", "other"
            age: null,
            hobby: null,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            process: "no",       // "yes" = генерация в процессе
            cur_tale: null
        };
        await db.write();
        console.log(`[DB] Создан новый пользователь ${userId}`);
    } else {
        // Обновляем время последней активности
        db.data.users[userId].lastActive = new Date().toISOString();
        await db.write();
    }
}

async function getUserData(userId) {
    return db.data.users[userId] || null;
}

async function updateUserField(userId, field, value) {
    if (!db.data.users[userId]) return false;
    
    db.data.users[userId][field] = value;
    if (field !== 'lastActive') {
        db.data.users[userId].lastActive = new Date().toISOString();
    }
    await db.write();
    return true;
}

// ====================== СКАЗКИ ======================
async function getOrCreateTale(userId, options = {}) {
    const {
        tale_size = 8,
        genre = "Случайный",
        hero = "Случайный",
        moral = "Случайная"
    } = options;

    // Завершаем все предыдущие активные сказки пользователя
    for (let taleNum in db.data.tales) {
        const tale = db.data.tales[taleNum];
        if (tale.user_id == userId && tale.cur_stage < tale.tale_size) {
            tale.status = "completed";
            tale.cur_stage = tale.tale_size;
        }
    }

    const taleNum = Date.now();

    db.data.tales[taleNum] = {
        tale_num: taleNum,
        user_id: parseInt(userId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        tale_size: parseInt(tale_size),
        cur_stage: 0,
        genre: genre,
        hero: hero,
        moral: moral,
        
        status: "active",           // active | completed | archived
        rating: null,
        feedback: null
    };

    // Инициализируем части сказки
    db.data.taleParts[taleNum] = {};
    for (let i = 0; i < tale_size; i++) {
        db.data.taleParts[taleNum][`p${i}`] = null;   // промпт / инструкция
        db.data.taleParts[taleNum][`ans${i}`] = null; // ответ ИИ
    }

    await db.write();
    console.log(`[DB] Создана новая сказка #${taleNum} (${tale_size} частей)`);
    
    return db.data.tales[taleNum];
}

async function getActiveTale(userId) {
    for (let taleNum in db.data.tales) {
        const tale = db.data.tales[taleNum];
        if (tale.user_id == userId && tale.status === "active" && tale.cur_stage < tale.tale_size) {
            return tale;
        }
    }
    return null;
}

async function getTaleById(taleNum) {
    return db.data.tales[taleNum] || null;
}

// ====================== ЧАСТИ СКАЗКИ ======================
async function addDataToTale(taleNum, text, isAiResponse = true) {
    if (!db.data.taleParts[taleNum]) return false;

    const tale = db.data.tales[taleNum];
    const stage = tale.cur_stage;

    const field = isAiResponse ? `p${stage}` : `ans${stage}`;
    db.data.taleParts[taleNum][field] = text;

    tale.updatedAt = new Date().toISOString();
    await db.write();
    return true;
}

async function getTaleContext(taleNum, size) {
    const parts = db.data.taleParts[taleNum];
    if (!parts) return [];

    const messages = [];
    for (let i = 0; i < size; i++) {
        if (parts[`p${i}`]) {
            messages.push({ role: "assistant", content: parts[`p${i}`] });
        }
        if (parts[`ans${i}`]) {
            messages.push({ role: "user", content: parts[`ans${i}`] });
        }
    }
    return messages;
}

async function advanceTaleStage(taleNum) {
    if (!db.data.tales[taleNum]) return false;
    
    db.data.tales[taleNum].cur_stage += 1;
    db.data.tales[taleNum].updatedAt = new Date().toISOString();
    await db.write();
    return db.data.tales[taleNum].cur_stage;
}

module.exports = {
    createUserIfNotExists,
    getUserData,
    updateUserField,
    getOrCreateTale,
    getActiveTale,
    getTaleById,
    addDataToTale,
    getTaleContext,
    advanceTaleStage
};