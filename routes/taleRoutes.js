const express = require('express');
const router = express.Router();

const { openai, TEMPERATURE = 1.2 } = require('../config');
const { 
    createUserIfNotExists, 
    getOrCreateTale, 
    getActiveTale, 
    addDataToTale, 
    getTaleContext,
    getUserData 
} = require('../dbTools');
const { getPrompt, getSystemPrompt } = require('../prompts');
const { db } = require('../db');        // ← Добавили этот импорт!

router.post('/generate', async (req, res) => {
    const { userId, userMessage = "", newTale = false } = req.body;

    if (!userId) {
        return res.status(400).json({ text: "Ошибка: userId не передан" });
    }

    try {
        await createUserIfNotExists(userId);

        let tale;
        if (newTale || !await getActiveTale(userId)) {
            tale = await getOrCreateTale(userId);
        } else {
            tale = await getActiveTale(userId);
        }

        if (!tale) {
            return res.json({ text: "Не удалось создать сказку. Попробуй ещё раз.", isEnd: true });
        }

        if (tale.cur_stage >= tale.tale_size) {
            return res.json({ 
                text: "🎉 Эта сказка уже завершена! Начни новую ✨", 
                isEnd: true 
            });
        }

        // Сохраняем сообщение пользователя
        if (userMessage.trim()) {
            await addDataToTale(tale.tale_num, userMessage.trim(), tale.tale_size, false);
        }

        const userData = await getUserData(userId) || {};
        let history = await getTaleContext(tale.tale_num, tale.tale_size);

        if (history.length === 0) {
            history = [{ role: "system", content: getSystemPrompt() }];
        }

        const currentPrompt = getPrompt(tale.cur_stage, userData, tale);
        history.push({ role: "user", content: currentPrompt });

        // Запрос к DeepSeek
        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: history,
            temperature: TEMPERATURE,
        });

        const aiText = response.choices[0].message.content;

        // Сохраняем ответ ИИ
        await addDataToTale(tale.tale_num, aiText, tale.tale_size, true);

        // Обновляем стадию
        tale.cur_stage += 1;
        await db.write();                    // ← Теперь db определён

        res.json({
            text: aiText,
            taleNum: tale.tale_num,
            currentStage: tale.cur_stage,
            isEnd: tale.cur_stage >= tale.tale_size
        });

    } catch (error) {
        console.error("❌ Ошибка в /api/tales/generate:");
        console.error(error.message);
        if (error.stack) console.error(error.stack);
        
        res.status(500).json({ 
            text: "😔 Дедушка Дрёма потерялся в лесу... Попробуй ещё раз!" 
        });
    }
});

module.exports = router;