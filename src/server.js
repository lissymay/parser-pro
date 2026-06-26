import express from 'express';
import cors from 'cors';
import { parse, serialize } from './parser.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.text());

app.post('/to-json', (req, res) => {
    try {
        const inputString = req.body;
        const jsObject = parse(inputString);
        
        // Проверка идеального совпадения байт-в-байт
        const reSerialized = serialize(jsObject);
        if (inputString !== reSerialized) {
            throw new SyntaxError("Ошибка целостности: Нарушено правило пробелов формата.");
        }

        return res.status(200).json(jsObject);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

app.post('/to-custom', (req, res) => {
    try {
        const customString = serialize(req.body);
        const verify = parse(customString);
        if (JSON.stringify(verify) !== JSON.stringify(req.body)) {
            throw new SyntaxError("Ошибка конвертации: Нарушена структура при сборке формата");
        }
        return res.status(200).send(customString);
    } catch (error) {
        return res.status(400).json({ error: error.message || "Ошибка: Данные не прошли проверку" });
    }
});

app.listen(PORT, () => {
    console.log(`[INFO] Сервер финальной строгости запущен на порту ${PORT}`);
});

app.delete('/history', async (req, res) => {
    try {
        await History.deleteMany({}); // Удаляет абсолютно все документы из коллекции
        return res.status(200).json({ message: "История успешно очищена" });
    } catch (error) {
        return res.status(500).json({ error: "Не удалось очистить историю" });
    }
});

app.listen(PORT, () => {
    console.log(`[INFO] Сервер строгого парсера с БД запущен на порту ${PORT}`);
});