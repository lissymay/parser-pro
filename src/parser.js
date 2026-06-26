export function parse(str) {
    if (!str) throw new SyntaxError("Ошибка: Входная строка пуста");
    
    if (str !== str.trim()) {
        throw new SyntaxError("Ошибка синтаксиса: Обнаружены лишние пробелы в начале или конце строки");
    }
    
    if (!str.startsWith('[') || !str.endsWith(']')) {
        throw new SyntaxError("Ошибка синтаксиса: Объект должен начинаться с '[' и заканчиваться на ']'");
    }
    
    const body = str.slice(1, -1);
    if (!body) return {};
    
    const result = {};
    const pairs = [];
    let currentPair = "";
    let inArray = false;
    
    for (let i = 0; i < body.length; i++) {
        const char = body[i];
        if (char === '|') inArray = !inArray;
        
        // Разделяем строго по запятой между свойствами
        if (char === ',' && !inArray) {
            pairs.push(currentPair);
            currentPair = "";
        } else {
            currentPair += char;
        }
    }
    if (currentPair) pairs.push(currentPair);
    
    pairs.forEach(pair => {
        // Пробел сразу после запятой между свойствами запрещен
        if (pair.startsWith(' ')) {
            throw new SyntaxError(`Ошибка синтаксиса: Пробел после запятой между свойствами запрещен перед "${pair.trim()}"`);
        }
        
        if (!pair.includes(':')) {
            throw new SyntaxError(`Ошибка синтаксиса: Пропущено двоеточие в паре "${pair}"`);
        }
        
        const firstColonIndex = pair.indexOf(':');
        const keyPart = pair.slice(0, firstColonIndex);
        const valPart = pair.slice(firstColonIndex + 1);
        
        // ПРОВЕРКА ПРОБЕЛОВ ВОКРУГ ДВЕОТОЧИЯ:
        // Перед двоеточием пробела быть не должно. После двоеточия обязан быть ровно ОДИН пробел.
        if (keyPart.endsWith(' ')) {
            throw new SyntaxError(`Ошибка siнтаксиса: Пробел перед двоеточием запрещен в "${pair}"`);
        }
        if (!valPart.startsWith(' ') || valPart.slice(1).startsWith(' ')) {
            throw new SyntaxError(`Ошибка синтаксиса: После двоеточия должен идти строго ОДИН пробел в "${pair}"`);
        }
        
        // Убираем этот единственный законный пробел для дальнейшего парсинга значения
        const cleanValPart = valPart.slice(1);
        
        if (!keyPart.startsWith('*') || !keyPart.endsWith('*')) {
            throw new SyntaxError(`Ошибка синтаксиса: Ключ "${keyPart}" должен быть обернут в *key*`);
        }
        const key = keyPart.slice(1, -1);
        
        let value;
        if (cleanValPart.startsWith('*') && cleanValPart.endsWith('*')) {
            value = cleanValPart.slice(1, -1);
        } else if (cleanValPart.startsWith('|') && cleanValPart.endsWith('|')) {
            const arrayContent = cleanValPart.slice(1, -1);
            if (!arrayContent) {
                value = [];
            } else {
                const items = arrayContent.split(', ');
                value = items.map((item, idx) => {
                    if (idx > 0 && !items[idx-1] && item.startsWith(' ')) {
                         throw new SyntaxError("Ошибка синтаксиса: Нарушен формат пробелов внутри массива");
                    }
                    if (!item.startsWith('*') || !item.endsWith('*')) {
                        throw new SyntaxError(`Ошибка синтаксиса: Элемент массива "${item}" должен быть обернут в *`);
                    }
                    return item.slice(1, -1);
                });
            }
        } else if (cleanValPart === 'T') {
            value = true;
        } else if (cleanValPart === 'F') {
            value = false;
        } else {
            value = Number(cleanValPart);
            if (isNaN(value) || cleanValPart.includes(' ')) {
                throw new SyntaxError(`Ошибка синтаксиса: Неверный тип данных или лишний пробел в значении "${cleanValPart}"`);
            }
        }
        result[key] = value;
    });
    
    return result;
}

export function serialize(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new Error("Ошибка сериализации: Ожидался валидный объект");
    }
    
    const parts = Object.entries(obj).map(([k, v]) => {
        // Добавляем ровно один пробел после двоеточия во все типы данных
        if (Array.isArray(v)) {
            return `*${k}*: |${v.map(i => `*${i}*`).join(', ')}|`;
        }
        if (typeof v === 'string') {
            return `*${k}*: *${v}*`;
        }
        if (typeof v === 'boolean') {
            return `*${k}*: ${v ? 'T' : 'F'}`;
        }
        return `*${k}*: ${v}`;
    });
    
    return `[${parts.join(',')}]`;
}