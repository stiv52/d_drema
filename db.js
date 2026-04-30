const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);

const defaultData = {
  users: {},
  tales: {},
  taleParts: {},
  userSettings: {},    // расширенные настройки пользователя
  taleFeedback: {},    // отзывы и оценки завершённых сказок
  taleHistory: []
};

const db = new Low(adapter, defaultData);

async function initDB() {
  await db.read();
  if (!db.data || Object.keys(db.data).length === 0) {
    //db.data = { ...defaultData };
    db.data = JSON.parse(JSON.stringify(defaultData));
    await db.write();
  }
  console.log('✅ LowDB успешно инициализирован');
  console.log(`   Пользователей: ${Object.keys(db.data.users).length}`);
  console.log(`   Сказок всего: ${Object.keys(db.data.tales).length}`);
}

module.exports = { db, initDB };