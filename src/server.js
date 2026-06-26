import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose'; // Добавили Mongoose
import { parse, serialize } from './parser.js';

const app = express();
const PORT = 3001;

// 1. ПОДКЛЮЧЕНИЕ К MONGOOSE
// 'database-mongo-1' — это имя сервиса из твоего docker-compose лога
const MONGO_URI = process.env.MONGO_URI || 'mongodb://database-mongo-1:27017/parser_pro';

mongoose.connect(MONGO_URI)
  .then(() => console.log('[INFO] Успешное подключение к MongoDB'))
  .catch(err => console.error('[ERROR] Ошибка подключения к MongoDB:', err));

// 2. СОЗДАНИЕ СХЕМЫ И МОДЕЛИ ИСТОРИИ
const historySchema = new mongoose.Schema({
    operation: { type: String, required: true }, // 'to-json' или 'to-custom'
    input: { type: String, required: true },
    output: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const History = mongoose.model('History', historySchema);

app.use(cors());
app.use(express.json());
app.use(express.text());

// 3. РОУТЫ С ЗАПИСЬЮ В БД
app.post('/to-json', async (req, res) => {
    try {
        const inputString = req.body;
        const jsObject = parse(inputString);
        
        const reSerialized = serialize(jsObject);
        if (inputString !== reSerialized) {
            throw new SyntaxError("Ошибка целостности: Нарушено правило пробелов формата.");
        }

        const formattedOutput = JSON.stringify(jsObject, null, 2);

        // Сохраняем в историю
        await History.create({
            operation: 'to-json',
            input: inputString,
            output: formattedOutput
        });

        return res.status(200).json(jsObject);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

app.post('/to-custom', async (req, res) => {
    try {
        const customString = serialize(req.body);
        const verify = parse(customString);
        if (JSON.stringify(verify) !== JSON.stringify(req.body)) {
            throw new SyntaxError("Ошибка конвертации: Нарушена структура при сборке формата");
        }

        // Сохраняем в историю
        await History.create({
            operation: 'to-custom',
            input: JSON.stringify(req.body, null, 2),
            output: customString
        });

        return res.status(200).send(customString);
    } catch (error) {
        return res.status(400).json({ error: error.message || "Ошибка: Данные не прошли проверку" });
    }
});

// 4. ЭНДПОИНТ ПОЛУЧЕНИЯ ИСТОРИИ (его не было!)
app.get('/history', async (req, res) => {
    try {
        // Сортируем: новые сверху
        const history = await History.find().sort({ createdAt: -1 });
        return res.status(200).json(history);
    } catch (error) {
        return res.status(500).json({ error: "Не удалось получить историю из БД" });
    }
});

app.delete('/history', async (req, res) => {
    try {
        await History.deleteMany({}); 
        return res.status(200).json({ message: "История успешно очищена" });
    } catch (error) {
        return res.status(500).json({ error: "Не удалось очистить историю" });
    }
});

app.listen(PORT, () => {
    console.log(`[INFO] Сервер строгого парсера с БД запущен на порту ${PORT}`);
});