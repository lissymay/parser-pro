import React, { useState } from 'react';

export default function App() {
  const [currentMode, setCurrentMode] = useState('to-json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [copyStatus, setCopyStatus] = useState('Копировать');
  
  // Состояния для истории
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Состояния для фильтрации и поиска внутри истории
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'to-json', 'to-custom'

  // Набор встроенных шаблонов (Песочница)
  const templates = {
    'to-json': [
      { label: '🎮 Профиль геймера', value: '[*nickname*: *CyberWitch*,*level*: 80,*premium*: T,*games*: |*Cyberpunk*, *Witcher*|]' },
      { label: '📦 Товар магазина', value: '[*title*: *Coffee Maker*,*price*: 150,*inStock*: F]' },
      { label: '👤 Пустой юзер', value: '[]' }
    ],
    'from-json': [
      { label: '🖥️ Конфиг сервера', value: '{\n  "host": "localhost",\n  "port": 8080,\n  "secure": true,\n  "tags": ["prod", "main"]\n}' },
      { label: '📄 Простая строка', value: '{\n  "status": "success"\n}' }
    ]
  };

  const swap = () => {
    setCurrentMode(currentMode === 'to-json' ? 'from-json' : 'to-json');
    setInput('');
    setOutput('');
    setError('');
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      // ИСПРАВЛЕНО: Порт изменен на 3001
      const response = await fetch('http://localhost:3001/history');
      if (response.ok) {
        const data = await response.json();
        setHistoryItems(data);
      }
    } catch (err) {
      console.error("Не удалось загрузить историю из БД", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) fetchHistory();
    setShowHistory(!showHistory);
  };

  // Очистка истории на бэкенде
  const handleClearHistory = async () => {
    if (!window.confirm("Вы уверены, что хотите полностью стереть историю трансляций из базы данных?")) return;
    try {
      // ИСПРАВЛЕНО: Порт изменен на 3001
      const response = await fetch('http://localhost:3001/history', { method: 'DELETE' });
      if (response.ok) {
        setHistoryItems([]);
      }
    } catch (err) {
      console.error("Ошибка при удалении истории", err);
    }
  };

  const handleSelectHistory = (item) => {
    setCurrentMode(item.operation);
    setInput(item.input);
    setOutput(item.output);
    setError('');
    setShowHistory(false);
  };

  // Копирование в буфер обмена стандартным API браузера
  const handleCopyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyStatus('Скопировано! ✓');
    setTimeout(() => setCopyStatus('Копировать'), 2000);
  };

  const handleConvert = async () => {
    setError('');
    setOutput('');

    const url = currentMode === 'to-json' ? '/to-json' : '/to-custom';
    const contentType = currentMode === 'to-json' ? 'text/plain' : 'application/json';
    
    let body = input;
    if (currentMode === 'from-json') {
      try {
        body = JSON.stringify(JSON.parse(input));
      } catch (e) {
        setError('Синтаксический сбой: На входе невалидный JSON объект');
        return;
      }
    }

    try {
      // ИСПРАВЛЕНО: Порт изменен на 3001
      const response = await fetch('http://localhost:3001' + url, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: body
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Критическая ошибка валидации формата' }));
        throw new Error(errData.error || 'Ошибка компиляции данных');
      }

      if (currentMode === 'to-json') {
        const data = await response.json();
        setOutput(JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        setOutput(text);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Фильтрация истории на клиенте с помощью JS .filter()
  const filteredHistory = historyItems.filter(item => {
    const matchesFilter = filterMode === 'all' || item.operation === filterMode;
    const matchesSearch = item.input.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.output.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const styles = {
    wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', padding: '20px', boxSizing: 'border-box', position: 'relative', overflowX: 'hidden' },
    container: { width: '100%', maxWidth: '1000px', backgroundColor: '#1e293b', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', border: '1px solid #334155' },
    titleBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    mainTitle: { color: '#f8fafc', margin: '0 0 4px 0', fontSize: '24px', fontWeight: '600' },
    subtitle: { color: '#94a3b8', margin: 0, fontSize: '14px' },
    historyToggleBtn: { backgroundColor: '#334155', border: '1px solid #475569', color: '#e2e8f0', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
    
    // Стили песочницы шаблонов
    templateBox: { display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' },
    templateLabel: { color: '#64748b', fontSize: '13px', fontWeight: '600' },
    templateBtn: { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' },

    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', backgroundColor: '#0f172a', padding: '12px 24px', borderRadius: '12px', border: '1px solid #334155' },
    label: { fontSize: '14px', fontWeight: '600', color: '#38bdf8', textTransform: 'uppercase', width: '40%', textAlign: 'center', letterSpacing: '1px' },
    swapBtn: { background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', width: '42px', height: '42px', cursor: 'pointer', fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', transform: isHovered ? 'scale(1.05)' : 'scale(1)' },
    
    flexAreas: { display: 'flex', gap: '24px' },
    card: { flex: 1, display: 'flex', flexDirection: 'column' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' },
    cardTitle: { color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
    actionBtn: { background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' },
    
    textarea: { width: '100%', height: '300px', padding: '20px', fontSize: '15px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#e2e8f0', resize: 'none', outline: 'none', lineHeight: '1.6', fontFamily: '"Fira Code", monospace', boxSizing: 'border-box' },
    errorBox: { marginTop: '24px', padding: '16px 20px', backgroundColor: '#451a03', color: '#f97316', borderRadius: '8px', fontWeight: '600', fontSize: '14px', borderLeft: '4px solid #ea580c' },
    convertBtn: { display: 'block', width: '100%', marginTop: '24px', padding: '16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.4)' },
    
    // Панель истории с поиском и фильтрами
    drawer: { position: 'fixed', top: 0, right: showHistory ? 0 : '-420px', width: '400px', height: '100vh', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', boxShadow: '-10px 0 25px rgba(0,0,0,0.5)', transition: 'right 0.3s ease-in-out', zIndex: 1000, padding: '30px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
    drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    drawerTitle: { color: '#f8fafc', margin: 0, fontSize: '18px', fontWeight: '600' },
    closeBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' },
    
    searchBar: { width: '100%', padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' },
    filterContainer: { display: 'flex', gap: '8px', marginBottom: '15px' },
    filterBtn: (active) => ({ flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer', border: '1px solid #334155', backgroundColor: active ? '#38bdf8' : '#0f172a', color: active ? '#0f172a' : '#94a3b8', transition: 'all 0.2s' }),
    
    historyList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '5px' },
    historyCard: { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s' },
    badge: { display: 'inline-block', fontSize: '11px', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' },
    historyCode: { color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 },
    
    clearHistoryBtn: { width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s' }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.titleBox}>
          <div>
            <h1 style={styles.mainTitle}>Parser Pro</h1>
            <p style={styles.subtitle}>Двусторонний строгий компилятор форматов данных</p>
          </div>
          <button style={styles.historyToggleBtn} onClick={toggleHistory}>
            📜 История трансляций
          </button>
        </div>

        {/* --- ПЕСОЧНИЦА ШАБЛОНОВ --- */}
        <div style={styles.templateBox}>
          <span style={styles.templateLabel}>⚡ Шаблоны:</span>
          {templates[currentMode === 'to-json' ? 'to-json' : 'from-json']?.map((tpl, i) => (
            <button 
              key={i} 
              style={styles.templateBtn} 
              onClick={() => { setInput(tpl.value); setOutput(''); setError(''); }}
              onMouseEnter={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.color = '#f8fafc'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = '#334155'; e.target.style.color = '#94a3b8'; }}
            >
              {tpl.label}
            </button>
          ))}
        </div>

        <div style={styles.header}>
          <div style={styles.label}>{currentMode === 'to-json' ? 'Custom Format' : 'JSON Object'}</div>
          <button 
            style={styles.swapBtn} 
            onClick={swap}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            ⇄
          </button>
          <div style={styles.label}>{currentMode === 'to-json' ? 'JSON Object' : 'Custom Format'}</div>
        </div>

        <div style={styles.flexAreas}>
          {/* Левая панель (Ввод) */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Входной поток</span>
              <button style={{...styles.actionBtn, color: '#94a3b8'}} onClick={() => { setInput(''); setOutput(''); setError(''); }}>Очистить ✕</button>
            </div>
            <textarea 
              style={styles.textarea} 
              placeholder={currentMode === 'to-json' ? '[*name*: *Alice*,*age*: 25,...]' : '{\n  "name": "Alice"\n}'} 
              value={input}
              onChange={e => setInput(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
              onBlur={(e) => e.target.style.borderColor = '#475569'}
            />
          </div>
          
          {/* Правая панель (Вывод) */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Результат компиляции</span>
              <button 
                style={{...styles.actionBtn, color: output ? '#38bdf8' : '#475569', cursor: output ? 'pointer' : 'not-allowed'}} 
                onClick={handleCopyToClipboard}
                disabled={!output}
              >
                {copyStatus}
              </button>
            </div>
            <textarea 
              style={{...styles.textarea, backgroundColor: '#1e293b', cursor: 'not-allowed', color: output ? '#38bdf8' : '#64748b'}} 
              placeholder="Ожидание компиляции..." 
              value={output} 
              readOnly 
            />
          </div>
        </div>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <button 
          style={styles.convertBtn} 
          onClick={handleConvert}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0369a1'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0284c7'}
        >
          Запустить трансляцию данных
        </button>
      </div>

      {/* --- ОБНОВЛЕННАЯ ПАНЕЛЬ ИСТОРИИ (С ПОИСКОМ И ФИЛЬТРАМИ) --- */}
      <div style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <h2 style={styles.drawerTitle}>Логи базы MongoDB</h2>
          <button style={styles.closeBtn} onClick={toggleHistory}>✕</button>
        </div>

        {/* Поле живого поиска */}
        <input 
          style={styles.searchBar} 
          type="text" 
          placeholder="🔎 Живой поиск по содержимому..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        {/* Фильтры направления */}
        <div style={styles.filterContainer}>
          <button style={styles.filterBtn(filterMode === 'all')} onClick={() => setFilterMode('all')}>Все</button>
          <button style={styles.filterBtn(filterMode === 'to-json')} onClick={() => setFilterMode('to-json')}>→ JSON</button>
          <button style={styles.filterBtn(filterMode === 'to-custom')} onClick={() => setFilterMode('to-custom')}>→ Custom</button>
        </div>
        
        <div style={styles.historyList}>
          {loadingHistory ? (
            <p style={{ color: '#94a3b8', textAlign: 'center' }}>Загрузка логов...</p>
          ) : filteredHistory.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', fontSize: '13px', marginTop: '20px' }}>Ничего не найдено</p>
          ) : (
            filteredHistory.map((item) => (
              <div 
                key={item._id} 
                style={styles.historyCard}
                onClick={() => handleSelectHistory(item)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'none'; }}
              >
                <span style={{
                  ...styles.badge, 
                  backgroundColor: item.operation === 'to-json' ? '#0369a1' : '#b45309',
                  color: '#fff'
                }}>
                  {item.operation === 'to-json' ? '→ JSON' : '→ Custom'}
                </span>
                <p style={styles.historyCode}><b>In:</b> {item.input}</p>
                <p style={{...styles.historyCode, marginTop: '4px', color: '#38bdf8'}}><b>Out:</b> {item.output}</p>
              </div>
            ))
          )}
        </div>

        {/* Кнопка очистки всей базы данных логов */}
        {historyItems.length > 0 && (
          <button 
            style={styles.clearHistoryBtn} 
            onClick={handleClearHistory}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#991b1b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#7f1d1d'}
          >
            🗑️ Очистить всю историю БД
          </button>
        )}
      </div>
    </div>
  );
}