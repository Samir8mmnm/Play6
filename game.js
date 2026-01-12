// ========== КОНФИГУРАЦИЯ FIREBASE ==========
const firebaseConfig = {
    apiKey: "AIzaSyDeVrBxpeosfFQGfxEdrKkR2GTwoKj_eAI",
    authDomain: "math-battle-game-d9608.firebaseapp.com",
    projectId: "math-battle-game-d9608",
    storageBucket: "math-battle-game-d9608.firebasestorage.app",
    messagingSenderId: "88861902806",
    appId: "1:88861902806:web:d9f134d18977d286dfc677"
};

// Инициализация Firebase
let db;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    console.log("✅ Firebase успешно инициализирован");
} catch (error) {
    console.error("❌ Ошибка инициализации Firebase:", error);
}

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let nick = "";
let roomId = null;
let players = [];
let isReady = false;
let isCreator = false;
let gameStarted = false;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let startTime;
let questionTimer;
let elapsedTime = 0;
let userAnswers = [];
let roomUnsubscribe = null;
let progressUnsubscribe = null;
let isPageUnloading = false;
let detailedResultsShown = false;
let hasDoubleXP = false;
let baseScoreMultiplier = 1;
let specialNames = ['эпштейн', 'пидиди', 'мегаманс', 'чахапов'];

// ========== ВОПРОСЫ (50 штук) ==========
const allQuestions = [
    {id:1,q:"2 + 2 × 2 = ?",a:["6","8","4","10"],c:0,exp:"Сначала умножение: 2 × 2 = 4, затем сложение: 2 + 4 = 6."},
    {id:2,q:"15% от 200?",a:["15","30","25","20"],c:1,exp:"15% = 0.15. 200 × 0.15 = 30."},
    {id:3,q:"5² + 3² = ?",a:["34","25","29","36"],c:0,exp:"5² = 25, 3² = 9. 25 + 9 = 34."},
    {id:4,q:"√144 = ?",a:["11","12","13","14"],c:1,exp:"12 × 12 = 144, поэтому √144 = 12."},
    {id:5,q:"3/4 от 80?",a:["50","60","70","80"],c:1,exp:"80 ÷ 4 = 20, 20 × 3 = 60."},
    {id:6,q:"7 × 8 = ?",a:["48","54","56","64"],c:2,exp:"Таблица умножения: 7 × 8 = 56."},
    {id:7,q:"1000 ÷ 40?",a:["25","30","35","40"],c:0,exp:"1000 ÷ 40 = 25."},
    {id:8,q:"Следующее: 2, 4, 8, 16, ...?",a:["24","32","48","64"],c:1,exp:"Каждое число умножается на 2: 16×2=32."},
    {id:9,q:"Градусы в прямом углу?",a:["45°","90°","180°","360°"],c:1,exp:"Прямой угол всегда равен 90 градусам."},
    {id:10,q:"0.5 в виде дроби?",a:["1/5","1/4","1/3","1/2"],c:3,exp:"0.5 = 5/10 = 1/2."},
    {id:11,q:"x + 7 = 15, то x = ?",a:["6","7","8","9"],c:2,exp:"x = 15 - 7 = 8."},
    {id:12,q:"2x - 5 = 11",a:["x=6","x=7","x=8","x=9"],c:2,exp:"2x = 11+5=16, x=16÷2=8."},
    {id:13,q:"3a + 2b + 4a - b",a:["7a+b","7a+3b","a+b","7a-b"],c:0,exp:"3a+4a=7a, 2b-b=b."},
    {id:14,q:"(x+3)(x-3)?",a:["x²-9","x²+9","x²-6","x²+6"],c:0,exp:"Формула разности квадратов."},
    {id:15,q:"y=2x+1, x=3, то y=?",a:["5","6","7","8"],c:2,exp:"y=2×3+1=6+1=7."},
    {id:16,q:"Периметр квадрата со стороной 5 см?",a:["15 см","20 см","25 см","30 см"],c:1,exp:"P=4×a=4×5=20 см."},
    {id:17,q:"Площадь прямоугольника 6×8 см?",a:["48 см²","42 см²","36 см²","28 см²"],c:0,exp:"6×8=48 см²."},
    {id:18,q:"Сколько градусов в треугольнике?",a:["90°","180°","270°","360°"],c:1,exp:"Сумма углов треугольника=180°."},
    {id:19,q:"Диаметр круга 10 см. Радиус?",a:["5 см","10 см","15 см","20 см"],c:0,exp:"Радиус=диаметр÷2=10÷2=5 см."},
    {id:20,q:"Объем куба с ребром 3 см?",a:["9 см³","18 см³","27 см³","36 см³"],c:2,exp:"V=a³=3³=27 см³."},
    {id:21,q:"Следующее: 1, 4, 9, 16, ...?",a:["20","24","25","36"],c:2,exp:"Квадраты: 1²,2²,3²,4²,5²=25."},
    {id:22,q:"Следующее: 2, 6, 12, 20, ...?",a:["28","30","32","36"],c:1,exp:"+4,+6,+8,+10: 20+10=30."},
    {id:23,q:"Сколько сторон у шестиугольника?",a:["5","6","7","8"],c:1,exp:"Гексагон имеет 6 сторон."},
    {id:24,q:"Пропущено: 3, 7, 15, 31, ?",a:["47","55","63","72"],c:2,exp:"×2+1: 31×2+1=63."},
    {id:25,q:"Сумма чисел от 1 до 10?",a:["45","50","55","60"],c:2,exp:"(1+10)×10/2=55."},
    {id:26,q:"¾ + ½?",a:["1¼","1½","1¾","2"],c:0,exp:"¾+½=¾+2/4=5/4=1¼"},
    {id:27,q:"12 × 11 = ?",a:["121","132","144","122"],c:1,exp:"12×11=132"},
    {id:28,q:"45 ÷ 0.5 = ?",a:["22.5","45","90","180"],c:2,exp:"45÷0.5=45÷1/2=45×2=90"},
    {id:29,q:"2³ × 2² = ?",a:["16","32","64","128"],c:1,exp:"2³=8,2²=4,8×4=32"},
    {id:30,q:"Минут в 2.5 часа?",a:["120","150","180","200"],c:1,exp:"2.5×60=150"},
    {id:31,q:"9 × 7 = ?",a:["56","63","72","81"],c:1,exp:"9×7=63"},
    {id:32,q:"25% от 80?",a:["15","20","25","30"],c:1,exp:"80×0.25=20"},
    {id:33,q:"√64 = ?",a:["6","7","8","9"],c:2,exp:"8×8=64"},
    {id:34,q:"1/3 от 99?",a:["30","33","36","39"],c:1,exp:"99÷3=33"},
    {id:35,q:"8² - 4² = ?",a:["48","52","56","60"],c:0,exp:"64-16=48"},
    {id:36,q:"Градусов в окружности?",a:["180°","270°","360°","450°"],c:2,exp:"Окружность=360°"},
    {id:37,q:"3/5 = ?%",a:["30%","40%","50%","60%"],c:3,exp:"3/5=0.6=60%"},
    {id:38,q:"Следующее: 1, 3, 6, 10, ...?",a:["13","14","15","16"],c:2,exp:"+2,+3,+4,+5=15"},
    {id:39,q:"Площадь круга с радиусом 7 см?",a:["~154","~144","~134","~124"],c:0,exp:"πr²=3.14×49≈154"},
    {id:40,q:"Нулей в миллионе?",a:["4","5","6","7"],c:2,exp:"1,000,000 - 6 нулей"},
    {id:41,q:"15 + 27 = ?",a:["32","42","52","62"],c:1,exp:"15+27=42"},
    {id:42,q:"0.75 в процентах?",a:["7.5%","75%","750%","0.75%"],c:1,exp:"0.75×100=75%"},
    {id:43,q:"Сколько сторон у октагона?",a:["6","7","8","9"],c:2,exp:"8 сторон"},
    {id:44,q:"6 × 9 = ?",a:["45","54","63","72"],c:1,exp:"6×9=54"},
    {id:45,q:"200 ÷ 8?",a:["20","25","30","35"],c:1,exp:"200÷8=25"},
    {id:46,q:"4³ = ?",a:["12","16","64","256"],c:2,exp:"4×4×4=64"},
    {id:47,q:"Месяцев в 1.5 годах?",a:["12","15","18","21"],c:2,exp:"1.5×12=18"},
    {id:48,q:"√81?",a:["7","8","9","10"],c:2,exp:"9×9=81"},
    {id:49,q:"5! (факториал)?",a:["60","100","120","150"],c:2,exp:"5×4×3×2×1=120"},
    {id:50,q:"2⁵?",a:["16","32","64","128"],c:1,exp:"2×2×2×2×2=32"}
];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getUniqueQuestions(count) {
    const shuffled = shuffleArray([...allQuestions]);
    return shuffled.slice(0, Math.min(count, allQuestions.length));
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function showLoader(show, text = 'Загрузка...') {
    const loader = document.getElementById('loader');
    if (!loader) return;
    
    if (show) {
        loader.innerHTML = `
            <div class="spinner"></div>
            <div class="loader-text">${text}</div>
        `;
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

function updateConnectionStatus(connected) {
    const el = document.getElementById('connection-status');
    if (!el) return;
    
    if (connected) {
        el.innerHTML = '<span class="status-online">✅ Подключено к серверу</span>';
        el.classList.remove('hidden');
        
        // Автоскрытие через 3 секунды
        setTimeout(() => {
            el.classList.add('hidden');
        }, 3000);
    } else {
        el.innerHTML = '<span class="status-offline">❌ Нет подключения к серверу</span>';
        el.classList.remove('hidden');
    }
}

function debugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, data || '');
    
    const debugContent = document.getElementById('debug-content');
    if (debugContent) {
        const div = document.createElement('div');
        div.style.cssText = 'margin: 4px 0; padding: 4px; border-bottom: 1px solid #4a5568; font-family: monospace;';
        div.innerHTML = `<span style="color:#48bb78">${logMessage}</span>`;
        
        if (data) {
            const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
            div.innerHTML += `<pre style="color:#e2e8f0; margin:4px 0 4px 10px; font-size:11px; background:#2d3748; padding:8px; border-radius:4px; overflow-x:auto;">${dataStr}</pre>`;
        }
        
        debugContent.appendChild(div);
        debugContent.scrollTop = debugContent.scrollHeight;
        
        // Ограничиваем количество сообщений
        const children = debugContent.children;
        if (children.length > 100) {
            debugContent.removeChild(children[0]);
        }
    }
}

function toggleDebug() {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
        debugPanel.classList.toggle('hidden');
        if (!debugPanel.classList.contains('hidden')) {
            debugLog("Отладочная панель открыта");
        }
    }
}

function clearDebug() {
    const debugContent = document.getElementById('debug-content');
    if (debugContent) {
        debugContent.innerHTML = '';
        debugLog("Логи очищены");
    }
}

function showNotification(text, type = 'info') {
    const colors = {
        info: {bg: '#4299E1', color: 'white'},
        success: {bg: '#48BB78', color: 'white'},
        warning: {bg: '#ED8936', color: 'white'},
        special: {bg: 'linear-gradient(135deg, #F6E05E, #D69E2E)', color: '#744210'}
    };
    
    const color = colors[type] || colors.info;
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    notification.style.background = color.bg;
    notification.style.color = color.color;
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== ПРОВЕРКА СПЕЦИАЛЬНЫХ ИМЕН ==========
function checkSpecialName(name) {
    if (!name) return false;
    
    const lowerName = name.toLowerCase().trim();
    return specialNames.some(special => lowerName === special);
}

function updateSpecialNameInfo() {
    const nickInput = document.getElementById('nick');
    const infoDiv = document.getElementById('special-nick-info');
    
    if (!nickInput || !infoDiv) return;
    
    const currentNick = nickInput.value.trim();
    const isSpecial = checkSpecialName(currentNick);
    
    if (isSpecial) {
        infoDiv.classList.remove('hidden');
        infoDiv.innerHTML = `<strong>✨ БОНУС АКТИВИРОВАН!</strong> Никнейм "${currentNick}" дает x2 опыт!`;
        infoDiv.style.background = 'linear-gradient(135deg, rgba(246, 224, 94, 0.2), rgba(214, 158, 46, 0.2))';
        infoDiv.style.color = '#744210';
        infoDiv.style.border = '2px solid #D69E2E';
    } else {
        infoDiv.classList.add('hidden');
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Математическая битва загружается...");
    
    // Настройка переключения режимов
    const modeSelect = document.getElementById("mode");
    if (modeSelect) {
        modeSelect.addEventListener("change", function() {
            const mode = this.value;
            document.getElementById("single-settings").classList.toggle("hidden", mode !== "single");
            document.getElementById("multi-settings").classList.toggle("hidden", mode !== "multi");
        });
    }
    
    // Загрузка ника
    const savedNick = localStorage.getItem('mathBattleNick') || 'Игрок' + Math.floor(Math.random() * 1000);
    const nickInput = document.getElementById('nick');
    if (nickInput) {
        nickInput.value = savedNick;
        nick = savedNick;
        
        // Проверка специального имени
        updateSpecialNameInfo();
        
        // Сохранение ника при изменении
        nickInput.addEventListener('input', function() {
            const newNick = this.value.trim();
            localStorage.setItem('mathBattleNick', newNick);
            nick = newNick;
            
            // Проверка специального имени
            updateSpecialNameInfo();
        });
    }
    
    // Проверка Firebase
    checkFirebaseConnection();
    
    debugLog("Приложение загружено");
});

async function checkFirebaseConnection() {
    try {
        if (!db) {
            updateConnectionStatus(false);
            return false;
        }
        
        await db.enableNetwork();
        
        // Простая проверка
        const testRef = db.collection('connection_test').doc('ping');
        await testRef.set({
            ping: new Date().toISOString()
        }, { merge: true });
        
        updateConnectionStatus(true);
        debugLog("Firebase подключен успешно");
        return true;
    } catch (error) {
        updateConnectionStatus(false);
        debugLog("Firebase не подключен:", error.message);
        return false;
    }
}

async function testFirebaseConnection() {
    showLoader(true, 'Проверка Firebase...');
    debugLog("🔧 Проверка подключения Firebase...");
    
    try {
        const connected = await checkFirebaseConnection();
        
        if (connected) {
            // Пробуем создать тестовый документ
            const testRef = db.collection('test_connection').doc('test');
            await testRef.set({
                test: "connection_test",
                timestamp: new Date().toISOString()
            });
            
            const doc = await testRef.get();
            if (doc.exists) {
                await testRef.delete();
                showNotification("✅ Firebase работает отлично!", 'success');
                debugLog("✅ Тест Firebase пройден успешно");
            }
        } else {
            showNotification("❌ Ошибка подключения к Firebase", 'warning');
        }
    } catch (error) {
        console.error("❌ Ошибка теста Firebase:", error);
        debugLog("Ошибка теста Firebase:", error);
        
        let errorMessage = "Ошибка: ";
        if (error.code === 'permission-denied') {
            errorMessage += "Нет разрешений. Проверьте правила Firestore.";
        } else if (error.code === 'failed-precondition') {
            errorMessage += "Firestore не активирован.";
        } else {
            errorMessage += error.message;
        }
        
        showNotification(errorMessage, 'warning');
    } finally {
        showLoader(false);
    }
}

// ========== ОДИНОЧНАЯ ИГРА ==========
function startSingleGame() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) {
        alert("Введите ваш ник!");
        return;
    }
    
    const count = parseInt(document.getElementById("auto-count").value) || 10;
    if (count < 1 || count > 50) {
        alert("Выберите от 1 до 50 вопросов!");
        return;
    }
    
    // Проверяем специальное имя
    hasDoubleXP = checkSpecialName(nick);
    baseScoreMultiplier = hasDoubleXP ? 2 : 1;
    
    if (hasDoubleXP) {
        showNotification(`🎉 БОНУС АКТИВИРОВАН! Никнейм "${nick}" дает x2 опыт!`, 'special');
    }
    
    questions = getUniqueQuestions(count);
    
    document.getElementById("start").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    document.getElementById("live-results").classList.add("hidden");
    
    startGame();
    debugLog("Одиночная игра начата", { 
        questions: questions.length, 
        nick,
        hasDoubleXP,
        multiplier: baseScoreMultiplier
    });
}

// ========== МУЛЬТИПЛЕЕР ==========
async function createRoom() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) {
        alert("Введите ваш ник!");
        return;
    }
    
    if (!db) {
        alert("Firebase не инициализирован.");
        return;
    }
    
    const questionCount = parseInt(document.getElementById("multi-question-count").value) || 20;
    const timePerQuestion = parseInt(document.getElementById("question-time").value) || 45;
    
    if (questionCount < 5 || questionCount > 50) {
        alert("Выберите от 5 до 50 вопросов!");
        return;
    }
    
    // Проверяем специальное имя
    hasDoubleXP = checkSpecialName(nick);
    baseScoreMultiplier = hasDoubleXP ? 2 : 1;
    
    showLoader(true, 'Создание комнаты...');
    debugLog("Создание комнаты...", { 
        questionCount, 
        timePerQuestion,
        nick,
        hasDoubleXP
    });
    
    try {
        const connected = await checkFirebaseConnection();
        if (!connected) {
            throw new Error("Нет подключения к Firebase");
        }
        
        roomId = generateRoomCode();
        isCreator = true;
        
        debugLog("Генерируем код комнаты:", roomId);
        
        const roomQuestions = getUniqueQuestions(questionCount);
        
        const roomData = {
            creator: nick,
            players: [{
                nick: nick,
                ready: true,
                score: 0,
                progress: 0,
                joinedAt: new Date().toISOString(),
                lastUpdate: new Date().toISOString(),
                hasBonus: hasDoubleXP
            }],
            status: "waiting",
            questions: roomQuestions,
            questionCount: questionCount,
            timePerQuestion: timePerQuestion,
            gameStarted: false,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        
        await db.collection("rooms").doc(roomId).set(roomData);
        
        debugLog("✅ Комната создана успешно!", { 
            roomId, 
            nick, 
            questions: questionCount,
            time: timePerQuestion,
            hasBonus: hasDoubleXP
        });
        
        if (hasDoubleXP) {
            showNotification(`🎉 БОНУС АКТИВИРОВАН! Никнейм "${nick}" дает x2 опыт!`, 'special');
        }
        
        showLobby();
        listenToRoom();
        updateShareLink();
        
    } catch (error) {
        console.error("❌ Ошибка создания комнаты:", error);
        debugLog("Ошибка создания комнаты:", error);
        alert("Не удалось создать комнату: " + error.message);
    } finally {
        showLoader(false);
    }
}

async function joinRoom() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) {
        alert("Введите ваш ник!");
        return;
    }
    
    if (!db) {
        alert("Firebase не инициализирован.");
        return;
    }
    
    roomId = document.getElementById("room-code").value.trim().toUpperCase();
    if (!roomId || roomId.length !== 4) {
        alert("Введите корректный код комнаты (4 символа)");
        return;
    }
    
    // Проверяем специальное имя
    hasDoubleXP = checkSpecialName(nick);
    baseScoreMultiplier = hasDoubleXP ? 2 : 1;
    
    showLoader(true, 'Присоединение к комнате...');
    debugLog("Присоединение к комнате:", roomId);
    
    try {
        const connected = await checkFirebaseConnection();
        if (!connected) {
            throw new Error("Нет подключения к Firebase");
        }
        
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
            throw new Error("Комната не найдена! Проверьте код.");
        }
        
        const room = roomDoc.data();
        
        if (room.status !== "waiting") {
            throw new Error("Игра уже началась или завершена!");
        }
        
        if (room.players.length >= 8) {
            throw new Error("Комната заполнена (максимум 8 игроков)!");
        }
        
        if (room.players.some(p => p.nick === nick)) {
            throw new Error("Игрок с таким ником уже есть в комнате!");
        }
        
        const newPlayer = {
            nick: nick,
            ready: false,
            score: 0,
            progress: 0,
            joinedAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            hasBonus: hasDoubleXP
        };
        
        await roomRef.update({
            players: [...room.players, newPlayer],
            lastActive: new Date().toISOString()
        });
        
        isCreator = false;
        
        debugLog("✅ Успешно присоединился к комнате", { 
            roomId, 
            nick,
            hasDoubleXP
        });
        
        if (hasDoubleXP) {
            showNotification(`🎉 БОНУС АКТИВИРОВАН! Никнейм "${nick}" дает x2 опыт!`, 'special');
        }
        
        showLobby();
        listenToRoom();
        
    } catch (error) {
        console.error("❌ Ошибка присоединения:", error);
        debugLog("Ошибка присоединения:", error);
        alert("Ошибка: " + error.message);
    } finally {
        showLoader(false);
    }
}

function showLobby() {
    document.getElementById("start").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidden");
    document.getElementById("game").classList.add("hidden");
    document.getElementById("results").classList.add("hidden");
    
    document.getElementById("room-code-display").textContent = roomId;
    
    debugLog("Лобби показано", { roomId, isCreator, hasDoubleXP });
}

function updateShareLink() {
    const currentUrl = window.location.href.split('?')[0];
    const shareUrl = `${currentUrl}?room=${roomId}`;
    const shareBox = document.getElementById('share-link');
    if (shareBox) {
        shareBox.textContent = shareUrl;
        shareBox.title = "Нажмите чтобы скопировать ссылку";
    }
}

function copyRoomCode() {
    const code = document.getElementById('room-code-display').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showNotification('✅ Код комнаты скопирован: ' + code, 'success');
    }).catch(err => {
        showNotification('❌ Не удалось скопировать код', 'warning');
    });
}

function listenToRoom() {
    if (!roomId || !db) return;
    
    if (roomUnsubscribe) {
        roomUnsubscribe();
        debugLog("Старая подписка отменена");
    }
    
    debugLog("Начинаю слушать комнату:", roomId);
    
    roomUnsubscribe = db.collection("rooms").doc(roomId).onSnapshot(
        (doc) => {
            if (!doc.exists) {
                debugLog("Комната удалена или не найдена");
                showNotification("Комната была удалена или не найдена!", 'warning');
                setTimeout(() => location.reload(), 2000);
                return;
            }
            
            const room = doc.data();
            players = room.players || [];
            
            debugLog("Получено обновление комнаты", {
                playersCount: players.length,
                status: room.status,
                gameStarted: room.gameStarted
            });
            
            updateLobbyInfo(room);
            updatePlayersList(room);
            updateLobbyControls(room);
            
            if (room.status === "started" && !room.gameStarted) {
                startCountdown();
            }
            
            if (room.gameStarted && !gameStarted && room.status === "started") {
                debugLog("Запускаем игру для всех игроков");
                startMultiplayerGame(room);
            }
            
            if (room.status === "finished" && gameStarted) {
                debugLog("Игра завершена, показываем результаты");
                showMultiplayerResults(room);
            }
        },
        (error) => {
            console.error("❌ Ошибка подписки на комнату:", error);
            debugLog("Ошибка подписки на комнату:", error);
            updateConnectionStatus(false);
        }
    );
}

function updateLobbyInfo(room) {
    const lobbyInfo = document.getElementById("lobby-info");
    if (!lobbyInfo) return;
    
    const questionCount = room.questionCount || 20;
    const timePerQuestion = room.timePerQuestion || 45;
    
    lobbyInfo.innerHTML = `
        <div style="background: rgba(102, 126, 234, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #667eea;">⚙️ Настройки игры</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <strong>📊 Количество вопросов:</strong><br>
                    <span style="color: #48bb78; font-size: 18px;">${questionCount}</span>
                </div>
                <div>
                    <strong>⏱️ Время на вопрос:</strong><br>
                    <span style="color: #ed8936; font-size: 18px;">${timePerQuestion} сек</span>
                </div>
            </div>
            ${isCreator ? `
                <div style="margin-top: 10px; font-size: 14px; color: #718096;">
                    <em>Вы создатель комнаты и можете начать игру</em>
                </div>
            ` : ''}
        </div>
    `;
}

function updatePlayersList(room) {
    const playersList = document.getElementById("players-list");
    const playersCount = document.getElementById("players-count");
    
    if (!playersList || !playersCount) return;
    
    playersCount.textContent = players.length;
    
    let html = "";
    players.forEach(player => {
        let playerClass = "player-card";
        if (player.ready) playerClass += " ready";
        if (player.nick === (room.creator || players[0]?.nick)) playerClass += " creator";
        if (player.hasBonus) playerClass += " special-player";
        
        html += `
            <div class="${playerClass}">
                <strong>${player.nick}</strong>
                ${player.nick === (room.creator || players[0]?.nick) ? "👑" : ""}
                ${player.hasBonus ? '<span style="color: #D69E2E; margin-left: 5px;">✨</span>' : ''}
                <div style="margin-top: 8px; font-size: 14px;">
                    ${player.ready ? 
                        '<span style="color: #38a169;">✅ Готов</span>' : 
                        '<span style="color: #718096;">⏳ Ожидает</span>'
                    }
                </div>
                ${player.score > 0 ? `
                    <div style="margin-top: 5px; font-size: 12px; color: #d69e2e;">
                        🏆 ${player.score} очков
                    </div>
                ` : ''}
                ${player.hasBonus ? `
                    <div style="margin-top: 3px; font-size: 11px; color: #D69E2E; font-weight: bold;">
                        x2 опыт
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    playersList.innerHTML = html;
}

function updateLobbyControls(room) {
    const readyBtn = document.getElementById("ready-btn");
    const startBtn = document.getElementById("start-btn");
    const forceBtn = document.getElementById("force-start-btn");
    
    if (!readyBtn || !startBtn || !forceBtn) return;
    
    const currentPlayer = players.find(p => p.nick === nick);
    isReady = currentPlayer ? currentPlayer.ready : false;
    
    if (currentPlayer) {
        readyBtn.textContent = isReady ? "❌ Не готов" : "✅ Я готов";
        readyBtn.className = isReady ? "danger" : "success";
        readyBtn.disabled = false;
    } else {
        readyBtn.disabled = true;
    }
    
    if (isCreator) {
        const allReady = players.length > 1 && players.every(p => p.ready);
        const minPlayers = players.length >= 2;
        
        startBtn.classList.toggle("hidden", !(allReady && minPlayers));
        startBtn.disabled = !(allReady && minPlayers);
        
        forceBtn.classList.toggle("hidden", allReady || players.length < 2);
        
        debugLog("Кнопки создателя обновлены", {
            allReady,
            minPlayers,
            playersCount: players.length
        });
    } else {
        startBtn.classList.add("hidden");
        forceBtn.classList.add("hidden");
    }
}

async function toggleReady() {
    if (!roomId || !nick || !db) return;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
            showNotification("Комната не найдена!", 'warning');
            return;
        }
        
        const room = roomDoc.data();
        
        const updatedPlayers = room.players.map(p => {
            if (p.nick === nick) {
                const newReadyStatus = !p.ready;
                debugLog(`${nick} меняет готовность: ${newReadyStatus ? 'готов' : 'не готов'}`);
                return {
                    ...p,
                    ready: newReadyStatus,
                    lastUpdate: new Date().toISOString()
                };
            }
            return p;
        });
        
        await roomRef.update({
            players: updatedPlayers,
            lastActive: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Ошибка изменения готовности:", error);
        debugLog("Ошибка изменения готовности:", error);
        showNotification("Не удалось изменить статус готовности", 'warning');
    }
}

function startCountdown() {
    const countdownEl = document.getElementById("countdown");
    if (!countdownEl) return;
    
    countdownEl.classList.remove("hidden");
    
    let count = 3;
    countdownEl.textContent = count;
    debugLog("Обратный отсчет начат", { seconds: count });
    
    const countdownInterval = setInterval(() => {
        count--;
        countdownEl.textContent = count;
        
        if (count <= 0) {
            clearInterval(countdownInterval);
            countdownEl.classList.add("hidden");
            debugLog("Обратный отсчет завершен");
        }
    }, 1000);
}

async function startRoomGame() {
    if (!isCreator || !roomId || !db) {
        showNotification("Только создатель комнаты может начать игру!", 'warning');
        return;
    }
    
    debugLog("Создатель начинает игру...");
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        const allReady = players.length >= 2 && players.every(p => p.ready);
        if (!allReady) {
            showNotification("Не все игроки готовы или недостаточно игроков!", 'warning');
            return;
        }
        
        debugLog("Начинаем игру", {
            players: players.length,
            questions: room.questionCount
        });
        
        await roomRef.update({
            status: "started",
            startTime: new Date().toISOString(),
            gameStarted: false,
            lastActive: new Date().toISOString()
        });
        
        startCountdown();
        
        setTimeout(async () => {
            try {
                await roomRef.update({
                    gameStarted: true
                });
                debugLog("Игра официально начата!");
            } catch (error) {
                debugLog("Ошибка обновления gameStarted:", error);
            }
        }, 3000);
        
    } catch (error) {
        console.error("Ошибка начала игры:", error);
        debugLog("Ошибка начала игры:", error);
        showNotification("Не удалось начать игру: " + error.message, 'warning');
    }
}

async function forceStartGame() {
    if (!isCreator || !roomId || !db) return;
    
    if (!confirm("Начать игру, даже если не все готовы?\n\nИгроки, которые не готовы, будут автоматически помечены как готовые.")) {
        return;
    }
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        const updatedPlayers = room.players.map(player => ({
            ...player,
            ready: true,
            lastUpdate: new Date().toISOString()
        }));
        
        debugLog("Принудительный старт игры", {
            players: updatedPlayers.length
        });
        
        await roomRef.update({
            players: updatedPlayers,
            status: "started",
            startTime: new Date().toISOString(),
            gameStarted: false
        });
        
        startCountdown();
        
        setTimeout(async () => {
            try {
                await roomRef.update({ gameStarted: true });
                debugLog("Игра начата принудительно!");
            } catch (error) {
                debugLog("Ошибка обновления gameStarted:", error);
            }
        }, 3000);
        
    } catch (error) {
        console.error("Ошибка принудительного старта:", error);
        debugLog("Ошибка принудительного старта:", error);
        showNotification("Не удалось начать игру: " + error.message, 'warning');
    }
}

function startMultiplayerGame(room) {
    if (gameStarted) return;
    
    gameStarted = true;
    debugLog("Запускаем мультиплеерную игру...", room);
    
    questions = room.questions || getUniqueQuestions(room.questionCount || 20);
    
    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    document.getElementById("live-results").classList.remove("hidden");
    
    // Показываем индикатор бонуса если есть
    const bonusIndicator = document.getElementById('bonus-indicator');
    if (bonusIndicator) {
        bonusIndicator.classList.toggle('hidden', !hasDoubleXP);
    }
    
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    startTime = new Date();
    
    setTimeout(() => {
        startGame();
        debugLog("Игра начата для игрока", { 
            nick, 
            questions: questions.length,
            hasDoubleXP
        });
    }, 1000);
    
    listenToProgress();
}

function listenToProgress() {
    if (!roomId || !db) return;
    
    if (progressUnsubscribe) {
        progressUnsubscribe();
    }
    
    progressUnsubscribe = db.collection("rooms").doc(roomId).onSnapshot((doc) => {
        if (!doc.exists) return;
        
        const room = doc.data();
        const resultsContent = document.getElementById("live-results-content");
        
        if (!resultsContent) return;
        
        const sortedPlayers = [...(room.players || [])].sort((a, b) => b.score - a.score);
        
        let html = "";
        sortedPlayers.forEach((player, index) => {
            const place = index + 1;
            const progress = player.progress || 0;
            const total = room.questionCount || 20;
            const percent = total > 0 ? Math.round((progress / total) * 100) : 0;
            
            html += `
                <div class="result-row">
                    <div>
                        <strong>${place}. ${player.nick}</strong>
                        ${player.nick === room.creator ? "👑" : ""}
                        ${player.hasBonus ? '<span style="color: #D69E2E;">✨</span>' : ''}
                    </div>
                    <div>
                        <strong>${player.score}</strong> очков
                        ${player.hasBonus ? '<span style="color: #D69E2E; font-size: 12px;">(x2)</span>' : ''}
                    </div>
                    <div>
                        ${progress}/${total} (${percent}%)
                    </div>
                </div>
            `;
        });
        
        resultsContent.innerHTML = html;
    });
}

async function updatePlayerProgress() {
    if (!roomId || !nick || !db) return;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) return;
        
        const room = roomDoc.data();
        
        const updatedPlayers = room.players.map(p => {
            if (p.nick === nick) {
                return {
                    ...p,
                    score: score,
                    progress: currentQuestionIndex,
                    lastUpdate: new Date().toISOString(),
                    hasBonus: hasDoubleXP
                };
            }
            return p;
        });
        
        await roomRef.update({
            players: updatedPlayers,
            lastActive: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Ошибка обновления прогресса:", error);
        debugLog("Ошибка обновления прогресса:", error);
    }
}

// ========== ИГРОВОЙ ПРОЦЕСС ==========
function startGame() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    startTime = new Date();
    
    const qtotal = document.getElementById("qtotal");
    const scoreDisplay = document.getElementById("score");
    
    if (qtotal) qtotal.textContent = questions.length;
    if (scoreDisplay) scoreDisplay.textContent = score;
    
    showQuestion();
    updateProgress();
    
    debugLog("Игра начата", { 
        totalQuestions: questions.length,
        hasDoubleXP,
        multiplier: baseScoreMultiplier
    });
}

function showQuestion() {
    if (currentQuestionIndex >= questions.length) {
        finishGame();
        return;
    }
    
    const qnum = document.getElementById("qnum");
    const scoreDisplay = document.getElementById("score");
    
    if (qnum) qnum.textContent = currentQuestionIndex + 1;
    if (scoreDisplay) scoreDisplay.textContent = score;
    
    const question = questions[currentQuestionIndex];
    elapsedTime = 0;
    
    const questionElement = document.getElementById("question-text");
    if (questionElement) {
        questionElement.textContent = question.q;
    }
    
    const optionsDiv = document.getElementById("options");
    if (!optionsDiv) return;
    
    optionsDiv.innerHTML = "";
    
    clearInterval(questionTimer);
    
    const timerElement = document.getElementById("timer-value");
    const timerParent = document.getElementById("timer");
    if (timerElement && timerParent) {
        timerElement.textContent = "0";
        timerParent.classList.remove("timer-warning", "timer-danger");
    }
    
    questionTimer = setInterval(() => {
        elapsedTime++;
        if (timerElement && timerParent) {
            timerElement.textContent = elapsedTime;
            
            // Изменение цвета таймера
            if (elapsedTime > 30) {
                timerParent.classList.add("timer-danger");
                timerParent.classList.remove("timer-warning");
            } else if (elapsedTime > 15) {
                timerParent.classList.add("timer-warning");
                timerParent.classList.remove("timer-danger");
            }
        }
    }, 1000);
    
    question.a.forEach((answer, index) => {
        const label = document.createElement("label");
        label.className = "option";
        label.innerHTML = answer;
        
        label.onclick = () => {
            clearInterval(questionTimer);
            
            // Блокируем все варианты
            Array.from(document.querySelectorAll(".option")).forEach(o => o.onclick = null);
            
            // Подсчет очков с учетом множителя
            let points = 100 - Math.floor(elapsedTime / 5) * 5;
            if (points < 0) points = 0;
            
            const isCorrect = index === question.c;
            const actualPoints = isCorrect ? Math.floor(points * baseScoreMultiplier) : 0;
            
            if (isCorrect) {
                label.classList.add("correct");
                score += actualPoints;
                debugLog(`Правильный ответ! +${actualPoints} очков (базовых: ${points}, множитель: x${baseScoreMultiplier})`, { 
                    question: currentQuestionIndex + 1, 
                    time: elapsedTime,
                    basePoints: points,
                    multiplier: baseScoreMultiplier,
                    totalPoints: actualPoints
                });
                
                if (hasDoubleXP && baseScoreMultiplier > 1) {
                    showNotification(`✨ +${actualPoints} очков (x${baseScoreMultiplier} бонус)`, 'special');
                }
            } else {
                label.classList.add("wrong");
                const correctOption = document.querySelectorAll(".option")[question.c];
                if (correctOption) {
                    correctOption.classList.add("correct");
                }
                debugLog(`Неправильный ответ`, { 
                    question: currentQuestionIndex + 1,
                    selected: answer,
                    correct: question.a[question.c]
                });
            }
            
            // Сохраняем ответ
            userAnswers.push({
                question: question.q,
                userAnswer: answer,
                correctAnswer: question.a[question.c],
                isCorrect: isCorrect,
                explanation: question.exp,
                time: elapsedTime,
                basePoints: points,
                multiplier: baseScoreMultiplier,
                actualPoints: actualPoints
            });
            
            // Обновляем прогресс в мультиплеере
            if (roomId) {
                updatePlayerProgress();
            }
            
            // Следующий вопрос через 1 секунду
            setTimeout(() => {
                currentQuestionIndex++;
                showQuestion();
                updateProgress();
            }, 1000);
        };
        
        optionsDiv.appendChild(label);
    });
}

function updateProgress() {
    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
        const percent = Math.round((currentQuestionIndex / questions.length) * 100);
        progressBar.style.width = percent + "%";
    }
}

function finishGame() {
    clearInterval(questionTimer);
    
    const endTime = new Date();
    const elapsedSec = Math.round((endTime - startTime) / 1000);
    
    const gameElement = document.getElementById("game");
    const resultsElement = document.getElementById("results");
    
    if (gameElement) gameElement.classList.add("hidden");
    if (resultsElement) resultsElement.classList.remove("hidden");
    
    if (roomId) {
        const returnBtn = document.getElementById("return-btn");
        if (returnBtn) returnBtn.classList.remove("hidden");
        showMultiplayerResults(elapsedSec);
    } else {
        const returnBtn = document.getElementById("return-btn");
        if (returnBtn) returnBtn.classList.add("hidden");
        showSingleResults(elapsedSec);
    }
    
    debugLog("Игра завершена", {
        score: score,
        baseMultiplier: baseScoreMultiplier,
        time: elapsedSec,
        correctAnswers: userAnswers.filter(a => a.isCorrect).length,
        totalQuestions: questions.length
    });
}

function showSingleResults(elapsedSec) {
    const min = Math.floor(elapsedSec / 60);
    const sec = elapsedSec % 60;
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    
    const resElement = document.getElementById("final-result");
    if (resElement) {
        let resultHTML = `
            <strong>${nick}</strong>, ваш результат: <span style="color:#667eea; font-size:1.2em;">${score}</span> очков<br>
            Правильных ответов: <strong>${correctAnswers} из ${questions.length}</strong> (${accuracy}%)<br>
            Время: ${min} мин ${sec} сек
        `;
        
        if (hasDoubleXP) {
            const baseScore = Math.floor(score / baseScoreMultiplier);
            resultHTML += `<br><span style="color:#D69E2E; font-weight:bold;">✨ Бонус x${baseScoreMultiplier} применен! (базовых очков: ${baseScore})</span>`;
        }
        
        resElement.innerHTML = resultHTML;
    }
    
    // Сохраняем результат в историю
    saveGameResult({
        nick,
        score,
        correctAnswers,
        totalQuestions: questions.length,
        accuracy,
        time: elapsedSec,
        hasDoubleXP,
        multiplier: baseScoreMultiplier,
        mode: "single"
    });
    
    showDetailedResults();
}

async function showMultiplayerResults(elapsedSec) {
    try {
        if (!roomId || !db) {
            showSingleResults(elapsedSec);
            return;
        }
        
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
            showNotification("Комната не найдена!", 'warning');
            showSingleResults(elapsedSec);
            return;
        }
        
        const room = roomDoc.data();
        
        // Обновляем наш финальный счет
        const updatedPlayers = room.players.map(p => {
            if (p.nick === nick) {
                return {
                    ...p,
                    score: score,
                    finished: true,
                    finishTime: new Date().toISOString(),
                    totalTime: elapsedSec,
                    hasBonus: hasDoubleXP
                };
            }
            return p;
        });
        
        // Проверяем, все ли игроки закончили
        const allFinished = updatedPlayers.every(p => p.finished || p.score === 0);
        
        if (allFinished) {
            await roomRef.update({
                players: updatedPlayers,
                lastActive: new Date().toISOString(),
                status: "finished"
            });
        } else {
            await roomRef.update({
                players: updatedPlayers,
                lastActive: new Date().toISOString()
            });
        }
        
        // Сортируем игроков по очкам
        const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);
        const playerIndex = sortedPlayers.findIndex(p => p.nick === nick);
        const playerPlace = playerIndex + 1;
        const isWinner = playerPlace === 1;
        
        const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
        const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
        
        const resElement = document.getElementById("final-result");
        if (resElement) {
            let resultHTML = `
                <strong>${nick}</strong>, ваш результат: <span style="color:#667eea; font-size:1.2em;">${score}</span> очков<br>
                Место: <strong>${playerPlace} из ${sortedPlayers.length}</strong><br>
                Правильных ответов: <strong>${correctAnswers} из ${questions.length}</strong> (${accuracy}%)
            `;
            
            if (hasDoubleXP) {
                const baseScore = Math.floor(score / baseScoreMultiplier);
                resultHTML += `<br><span style="color:#D69E2E; font-weight:bold;">✨ Бонус x${baseScoreMultiplier} применен! (базовых очков: ${baseScore})</span>`;
            }
            
            resElement.innerHTML = resultHTML;
        }
        
        if (isWinner) {
            const winnerElement = document.getElementById("winner");
            if (winnerElement) winnerElement.classList.remove("hidden");
            showNotification("🏆 ПОБЕДА! Вы заняли первое место!", 'success');
        }
        
        // Таблица результатов
        const finalResults = document.getElementById("final-results");
        if (finalResults && finalResults.tBodies[0]) {
            let html = "";
            sortedPlayers.forEach((player, index) => {
                const place = index + 1;
                const totalQuestions = room.questionCount || 20;
                const progress = player.progress || 0;
                
                // Более точный расчет точности
                let playerAccuracy = 0;
                if (progress > 0) {
                    // Предполагаем, что за каждый правильный ответ дается примерно 100 очков
                    const estimatedCorrect = Math.floor(player.score / 100);
                    playerAccuracy = totalQuestions > 0 ? Math.round((estimatedCorrect / totalQuestions) * 100) : 0;
                }
                
                const finishTime = player.finished ? "Завершил" : "Не завершил";
                const bonusText = player.hasBonus ? '<span style="color:#D69E2E">✨</span>' : '';
                
                html += `
                    <tr>
                        <td>${place} ${place === 1 ? "🏆" : place === 2 ? "🥈" : place === 3 ? "🥉" : ""}</td>
                        <td>${player.nick} ${player.nick === room.creator ? "👑" : ""} ${bonusText}</td>
                        <td><strong>${player.score}</strong> ${player.hasBonus ? '<span style="color:#D69E2E; font-size:12px;">(x2)</span>' : ''}</td>
                        <td>${finishTime}</td>
                        <td>${playerAccuracy}%</td>
                    </tr>
                `;
            });
            
            finalResults.tBodies[0].innerHTML = html;
        }
        
        // Сохраняем результат в историю
        saveGameResult({
            nick,
            score,
            correctAnswers,
            totalQuestions: questions.length,
            accuracy,
            time: elapsedSec,
            hasDoubleXP,
            multiplier: baseScoreMultiplier,
            mode: "multi",
            playersCount: sortedPlayers.length,
            place: playerPlace
        });
        
        showDetailedResults();
        
        debugLog("Мультиплеерные результаты показаны", {
            place: playerPlace,
            totalPlayers: sortedPlayers.length,
            isWinner: isWinner,
            hasDoubleXP: hasDoubleXP
        });
        
    } catch (error) {
        console.error("Ошибка показа результатов:", error);
        debugLog("Ошибка показа результатов:", error);
        showNotification("Не удалось загрузить результаты", 'warning');
        showSingleResults(elapsedSec);
    }
}

function saveGameResult(gameData) {
    try {
        const gameHistory = JSON.parse(localStorage.getItem('mathBattleHistory') || '[]');
        
        gameHistory.unshift({
            ...gameData,
            date: new Date().toISOString()
        });
        
        // Ограничиваем историю 50 последними играми
        if (gameHistory.length > 50) {
            gameHistory.pop();
        }
        
        localStorage.setItem('mathBattleHistory', JSON.stringify(gameHistory));
        debugLog("Результат игры сохранен", gameData);
    } catch (error) {
        debugLog("Ошибка сохранения результата игры:", error);
    }
}

function showDetailedResults() {
    if (detailedResultsShown) return;
    
    detailedResultsShown = true;
    
    const detailedResultsEl = document.getElementById("detailed-results");
    const answersListEl = document.getElementById("answers-list");
    
    if (!detailedResultsEl || !answersListEl) return;
    
    detailedResultsEl.classList.remove("hidden");
    
    let html = "";
    let correctCount = 0;
    let totalBasePoints = 0;
    let totalBonusPoints = 0;
    
    userAnswers.forEach((answer, index) => {
        const questionNumber = index + 1;
        const resultClass = answer.isCorrect ? "correct" : "wrong";
        const icon = answer.isCorrect ? "✅" : "❌";
        
        if (answer.isCorrect) {
            correctCount++;
            totalBasePoints += answer.basePoints;
            totalBonusPoints += (answer.actualPoints - answer.basePoints);
        }
        
        const bonusText = answer.multiplier > 1 && answer.isCorrect ? 
            `<span style="color:#D69E2E; font-weight:bold;"> (x${answer.multiplier} бонус)</span>` : '';
        
        html += `
            <div class="question-result ${resultClass}">
                <div><strong>${icon} Вопрос ${questionNumber}:</strong> ${answer.question}</div>
                <div><strong>Ваш ответ:</strong> ${answer.userAnswer}</div>
                <div><strong>Правильный ответ:</strong> ${answer.correctAnswer}</div>
                <div><strong>Объяснение:</strong> ${answer.explanation}</div>
                <div style="margin-top: 5px; font-size: 14px; color: #718096;">
                    <strong>Время:</strong> ${answer.time} сек 
                    <strong>Очки:</strong> ${answer.isCorrect ? answer.actualPoints : 0}${bonusText}
                </div>
            </div>
        `;
    });
    
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const totalTime = userAnswers.reduce((sum, answer) => sum + answer.time, 0);
    const avgTime = userAnswers.length > 0 ? Math.round(totalTime / userAnswers.length) : 0;
    
    const statsHtml = `
        <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; border-left: 5px solid #667eea;">
            <h4 style="margin-top: 0; color: #4a5568;">📈 Статистика игры</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #718096;">Правильных ответов</div>
                    <div style="font-size: 28px; font-weight: 700; color: #48bb78;">${correctCount}/${questions.length}</div>
                    <div style="font-size: 14px; color: #718096;">${accuracy}%</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #718096;">Общее время</div>
                    <div style="font-size: 28px; font-weight: 700; color: #4299e1;">${totalTime} сек</div>
                    <div style="font-size: 14px; color: #718096;">${avgTime} сек/вопрос</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #718096;">Общий счет</div>
                    <div style="font-size: 28px; font-weight: 700; color: #d69e2e;">${score}</div>
                    <div style="font-size: 14px; color: #718096;">очков${hasDoubleXP ? `<br><span style="color:#D69E2E">(x${baseScoreMultiplier} бонус)</span>` : ''}</div>
                </div>
            </div>
            ${hasDoubleXP ? `
                <div style="margin-top: 15px; padding: 12px; background: linear-gradient(135deg, rgba(246, 224, 94, 0.2), rgba(214, 158, 46, 0.2)); border-radius: 8px; border: 1px solid #D69E2E;">
                    <div style="color: #744210; font-weight: bold; text-align: center;">
                        ✨ БОНУС X${baseScoreMultiplier} АКТИВИРОВАН!<br>
                        Базовых очков: ${totalBasePoints} | Бонусных: +${totalBonusPoints}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    answersListEl.innerHTML = statsHtml + html;
    
    const detailsBtn = document.getElementById("details-btn");
    if (detailsBtn) {
        detailsBtn.textContent = "📊 Скрыть детальные результаты";
        detailsBtn.onclick = () => {
            detailedResultsEl.classList.toggle("hidden");
            detailsBtn.textContent = detailedResultsEl.classList.contains("hidden") 
                ? "📊 Показать детальные результаты" 
                : "📊 Скрыть детальные результаты";
        };
    }
}

// ========== УПРАВЛЕНИЕ КОМНАТОЙ ==========
async function returnToLobby() {
    if (!roomId || !db) return;
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (roomDoc.exists) {
            const room = roomDoc.data();
            
            const updatedPlayers = room.players.map(p => {
                if (p.nick === nick) {
                    return {
                        ...p,
                        ready: false,
                        score: 0,
                        progress: 0,
                        finished: false
                    };
                }
                return p;
            });
            
            await roomRef.update({
                players: updatedPlayers,
                status: "waiting",
                gameStarted: false,
                lastActive: new Date().toISOString()
            });
        }
        
        if (progressUnsubscribe) {
            progressUnsubscribe();
            progressUnsubscribe = null;
        }
        
        gameStarted = false;
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];
        detailedResultsShown = false;
        
        const resultsElement = document.getElementById("results");
        const detailedResultsEl = document.getElementById("detailed-results");
        
        if (resultsElement) resultsElement.classList.add("hidden");
        if (detailedResultsEl) detailedResultsEl.classList.add("hidden");
        
        showLobby();
        
        debugLog("Вернулись в лобби");
        
    } catch (error) {
        console.error("Ошибка возврата в лобби:", error);
        debugLog("Ошибка возврата в лобби:", error);
        showNotification("Не удалось вернуться в лобби", 'warning');
    }
}

async function leaveRoom() {
    if (!roomId || !nick) {
        location.reload();
        return;
    }
    
    isPageUnloading = true;
    
    try {
        if (db) {
            const roomRef = db.collection("rooms").doc(roomId);
            const roomDoc = await roomRef.get();
            
            if (roomDoc.exists) {
                const room = roomDoc.data();
                
                const updatedPlayers = room.players.filter(p => p.nick !== nick);
                
                if (updatedPlayers.length === 0) {
                    await roomRef.delete();
                    debugLog("Комната удалена (последний игрок вышел)");
                } else {
                    await roomRef.update({
                        players: updatedPlayers,
                        lastActive: new Date().toISOString()
                    });
                    
                    if (room.creator === nick && updatedPlayers.length > 0) {
                        await roomRef.update({
                            creator: updatedPlayers[0].nick
                        });
                        debugLog("Новый создатель комнаты:", updatedPlayers[0].nick);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Ошибка при выходе:", error);
        debugLog("Ошибка при выходе:", error);
    }
    
    if (roomUnsubscribe) {
        roomUnsubscribe();
        roomUnsubscribe = null;
    }
    
    if (progressUnsubscribe) {
        progressUnsubscribe();
        progressUnsubscribe = null;
    }
    
    setTimeout(() => {
        location.reload();
    }, 100);
}

// ========== ОЧИСТКА СТАРЫХ КОМНАТ ==========
setInterval(async () => {
    try {
        if (!db) return;
        
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const oldRooms = await db.collection("rooms")
            .where("lastActive", "<", hourAgo)
            .get();
        
        oldRooms.forEach(doc => {
            doc.ref.delete();
            debugLog("Удалена старая комната:", doc.id);
        });
    } catch (error) {
        debugLog("Ошибка очистки комнат:", error);
    }
}, 30 * 60 * 1000);

// ========== ОБРАБОТКА ЗАКРЫТИЯ СТРАНИЦЫ ==========
window.addEventListener('beforeunload', function(e) {
    if (!isPageUnloading && (gameStarted || roomId)) {
        e.preventDefault();
        e.returnValue = 'Вы находитесь в игре. Вы уверены, что хотите уйти?';
        
        // Показываем сообщение о выходе
        if (roomId) {
            const leaveBtn = document.createElement('button');
            leaveBtn.textContent = 'Выйти из комнаты';
            leaveBtn.onclick = () => {
                leaveRoom();
            };
            
            const notification = document.createElement('div');
            notification.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.3); z-index:9999;';
            notification.innerHTML = `
                <h3>Вы находитесь в игре</h3>
                <p>Вы уверены, что хотите уйти?</p>
                <button onclick="location.reload()" style="margin-right:10px;">Обновить страницу</button>
            `;
            notification.appendChild(leaveBtn);
            document.body.appendChild(notification);
        }
    }
});

console.log("🎮 Математическая битва полностью загружена и готова к работе!");
debugLog("Система готова. Добро пожаловать в игру!");

// Проверяем специальное имя при загрузке
setTimeout(() => {
    updateSpecialNameInfo();
}, 500);
