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
    
    // Включаем кэширование для офлайн-работы
    db.enablePersistence()
        .then(() => {
            console.log("✅ Firebase работает с кэшированием");
            updateConnectionStatus(true, true); // Показываем только создателю
        })
        .catch((err) => {
            console.log("⚠️ Офлайн кэширование недоступно:", err);
            updateConnectionStatus(false, true);
        });
    
    console.log("✅ Firebase успешно инициализирован");
} catch (error) {
    console.error("❌ Ошибка инициализации Firebase:", error);
    updateConnectionStatus(false, true);
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

// Секретные имена для двойного опыта
const SECRET_NAMES = ["Пидиди", "Эпштейн", "Чахапов", "Мегаманс"];
let hasDoubleXP = false;

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

function showLoader(show) {
    document.getElementById('loader').classList.toggle('hidden', !show);
}

// Обновленная функция для отображения статуса подключения
function updateConnectionStatus(connected, forceShow = false) {
    const el = document.getElementById('connection-status');
    if (!el) return;
    
    // Показываем статус только создателю комнаты или если принудительно
    const shouldShow = forceShow || isCreator;
    
    if (connected && shouldShow) {
        el.innerHTML = '<span class="status-online">✅ Онлайн</span>';
        el.classList.remove('hidden');
    } else if (!connected && shouldShow) {
        el.innerHTML = '<span class="status-offline">❌ Офлайн</span>';
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function debugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, data || '');
    
    const debugContent = document.getElementById('debug-content');
    if (debugContent) {
        const div = document.createElement('div');
        div.style.cssText = 'margin: 2px 0; padding: 2px; border-bottom: 1px solid rgba(0,255,0,0.1);';
        div.innerHTML = `<span style="color:#0f0">${logMessage}</span>`;
        if (data) {
            div.innerHTML += `<pre style="color:#ff0; margin:2px 0 2px 10px; font-size:10px;">${JSON.stringify(data, null, 2)}</pre>`;
        }
        debugContent.appendChild(div);
        debugContent.scrollTop = debugContent.scrollHeight;
        
        const children = debugContent.children;
        if (children.length > 50) {
            debugContent.removeChild(children[0]);
        }
    }
}

function showDebugInfo() {
    document.getElementById('debug-panel').classList.toggle('hidden');
    debugLog("Отладочная панель открыта");
}

function clearDebug() {
    document.getElementById('debug-content').innerHTML = '';
}

function checkSecretName(name) {
    const trimmedName = name.trim();
    hasDoubleXP = SECRET_NAMES.some(secretName => 
        trimmedName.toLowerCase() === secretName.toLowerCase()
    );
    
    return hasDoubleXP;
}

function showDoubleXPNotification() {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = "🎉 ВАУ! Вы используете секретное имя! Получаете ДВОЙНОЙ опыт за все ответы!";
    notification.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
    notification.style.color = '#000';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Математическая Битва загружается...");
    
    // Настройка переключения режимов
    document.getElementById("mode").addEventListener("change", function() {
        const mode = this.value;
        document.getElementById("single-settings").classList.toggle("hidden", mode !== "single");
        document.getElementById("multi-settings").classList.toggle("hidden", mode !== "multi");
    });
    
    // Загрузка ника
    const savedNick = localStorage.getItem('mathBattleNick') || 'Игрок' + Math.floor(Math.random() * 1000);
    document.getElementById('nick').value = savedNick;
    nick = savedNick;
    
    // Проверка на секретное имя
    if (checkSecretName(nick) && hasDoubleXP) {
        setTimeout(() => {
            showDoubleXPNotification();
        }, 1000);
    }
    
    // Сохранение ника при изменении
    document.getElementById('nick').addEventListener('input', function() {
        const newNick = this.value.trim();
        localStorage.setItem('mathBattleNick', newNick);
        nick = newNick;
        
        // Проверка на секретное имя
        if (checkSecretName(newNick) && hasDoubleXP) {
            showDoubleXPNotification();
        }
    });
    
    // Проверка Firebase
    checkFirebaseConnection();
    
    debugLog("Приложение загружено");
});

async function checkFirebaseConnection() {
    try {
        if (!db) {
            updateConnectionStatus(false);
            return;
        }
        
        // Простая проверка подключения
        await db.enableNetwork();
        
        updateConnectionStatus(true);
        debugLog("Firebase подключен успешно");
    } catch (error) {
        updateConnectionStatus(false);
        debugLog("Firebase не подключен:", error.message);
    }
}

// ========== ТЕСТ FIREBASE ==========
async function testFirebase() {
    showLoader(true);
    debugLog("🔍 Тестируем Firebase подключение...");
    
    try {
        if (!db) {
            throw new Error("Firebase не инициализирован");
        }
        
        await db.enableNetwork();
        debugLog("Сеть Firebase включена");
        
        alert("✅ Firebase работает отлично!\n\nМультиплеер доступен для игры!");
        updateConnectionStatus(true);
        
    } catch (error) {
        debugLog("❌ Ошибка теста Firebase:", error);
        updateConnectionStatus(false);
        
        let errorMessage = "Ошибка Firebase: ";
        
        if (error.code === 'permission-denied') {
            errorMessage += "Нет разрешений на запись в Firestore.\n\n";
            errorMessage += "Правила Firestore должны быть:\n\n";
            errorMessage += "rules_version = '2';\n";
            errorMessage += "service cloud.firestore {\n";
            errorMessage += "  match /databases/{database}/documents {\n";
            errorMessage += "    match /rooms/{roomId} {\n";
            errorMessage += "      allow read, write: if true;\n";
            errorMessage += "    }\n";
            errorMessage += "  }\n";
            errorMessage += "}\n";
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
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
    
    // Проверка на секретное имя
    checkSecretName(nick);
    
    const count = parseInt(document.getElementById("auto-count").value) || 10;
    if (count < 1 || count > 50) {
        alert("Выберите от 1 до 50 вопросов!");
        return;
    }
    
    questions = getUniqueQuestions(count);
    
    document.getElementById("start").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    document.getElementById("live-results").classList.add("hidden");
    
    startGame();
    debugLog("Одиночная игра начата", { 
        questions: questions.length, 
        nick,
        hasDoubleXP
    });
}

// ========== МУЛЬТИПЛЕЕР ==========
async function createRoom() {
    nick = document.getElementById("nick").value.trim();
    if (!nick) {
        alert("Введите ваш ник!");
        return;
    }
    
    // Проверка на секретное имя
    checkSecretName(nick);
    
    if (!db) {
        alert("Firebase не инициализирован. Нажмите 'Тест Firebase' для диагностики.");
        return;
    }
    
    const questionCount = parseInt(document.getElementById("multi-question-count").value) || 20;
    const timePerQuestion = parseInt(document.getElementById("question-time").value) || 45;
    
    if (questionCount < 5 || questionCount > 50) {
        alert("Выберите от 5 до 50 вопросов!");
        return;
    }
    
    showLoader(true);
    debugLog("Создание комнаты...", { questionCount, timePerQuestion, hasDoubleXP });
    
    try {
        await db.enableNetwork();
        
        // Генерируем уникальный код комнаты
        let attempts = 0;
        let newRoomId;
        let roomExists = true;
        
        // Проверяем, что комната с таким кодом не существует
        while (roomExists && attempts < 10) {
            newRoomId = generateRoomCode();
            const roomDoc = await db.collection("rooms").doc(newRoomId).get();
            roomExists = roomDoc.exists;
            attempts++;
        }
        
        if (roomExists) {
            throw new Error("Не удалось создать уникальный код комнаты. Попробуйте еще раз.");
        }
        
        roomId = newRoomId;
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
                hasDoubleXP: hasDoubleXP
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
            hasDoubleXP
        });
        
        showLobby();
        listenToRoom();
        updateShareLink();
        
        // Скрываем индикатор подключения после создания комнаты
        setTimeout(() => {
            updateConnectionStatus(true, false);
        }, 3000);
        
        alert(`✅ Комната создана!\n\nКод комнаты: ${roomId}\n\nДелитесь этим кодом с друзьями!`);
        
    } catch (error) {
        console.error("❌ Ошибка создания комнаты:", error);
        debugLog("Ошибка создания комнаты:", error);
        
        if (error.code === 'permission-denied') {
            alert("Ошибка доступа к Firebase.\n\nПроверьте правила Firestore или нажмите 'Тест Firebase' для диагностики.");
        } else {
            alert("Не удалось создать комнату: " + error.message);
        }
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
    
    // Проверка на секретное имя
    checkSecretName(nick);
    
    if (!db) {
        alert("Firebase не инициализирован. Нажмите 'Тест Firebase' для диагностики.");
        return;
    }
    
    roomId = document.getElementById("room-code").value.trim().toUpperCase();
    if (!roomId || roomId.length !== 4) {
        alert("Введите корректный код комнаты (4 символа)");
        return;
    }
    
    showLoader(true);
    debugLog("Присоединение к комнате:", roomId);
    
    try {
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
            hasDoubleXP: hasDoubleXP
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
        
        showLobby();
        listenToRoom();
        
        // Скрываем индикатор подключения для игроков
        updateConnectionStatus(false, false);
        
        alert(`✅ Вы присоединились к комнате ${roomId}!\n\nОжидайте начала игры...`);
        
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
    shareBox.textContent = shareUrl;
    shareBox.title = "Нажмите чтобы скопировать ссылку";
}

function copyRoomCode() {
    const code = document.getElementById('room-code-display').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('✅ Код комнаты скопирован: ' + code);
    }).catch(err => {
        alert('❌ Не удалось скопировать код');
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
                if (gameStarted) {
                    // Если мы в игре и комната удалена, завершаем игру локально
                    finishGame();
                } else {
                    alert("Комната была удалена!");
                    location.reload();
                }
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
            
            // ИЗМЕНЕНИЕ: Показываем результаты, только если мы уже завершили игру
            if (room.status === "finished" && gameStarted) {
                debugLog("Игра завершена, показываем результаты");
                // Не перезагружаем страницу, а показываем результаты
                if (document.getElementById("results").classList.contains("hidden")) {
                    showMultiplayerResults();
                }
            }
            
            // ИЗМЕНЕНИЕ: Если игра завершена, но мы еще не начали игру, просто показываем результаты
            if (room.status === "finished" && !gameStarted) {
                debugLog("Игра уже завершена другими игроками");
                showMultiplayerResults();
            }
        },
        (error) => {
            console.error("❌ Ошибка подписки на комнату:", error);
            debugLog("Ошибка подписки на комнату:", error);
            updateConnectionStatus(false, isCreator);
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
            ${hasDoubleXP ? `
                <div style="margin-top: 10px; padding: 10px; background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 8px; color: #000; font-weight: bold; text-align: center;">
                    ⚡ ВАУ! У вас ДВОЙНОЙ опыт за ответы! ⚡
                </div>
            ` : ''}
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
        if (player.hasDoubleXP) playerClass += " double-xp";
        
        html += `
            <div class="${playerClass}" style="${player.hasDoubleXP ? 'border: 3px solid gold; background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));' : ''}">
                <strong>${player.nick}</strong>
                ${player.nick === (room.creator || players[0]?.nick) ? "👑" : ""}
                ${player.hasDoubleXP ? "⚡" : ""}
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
                ${player.hasDoubleXP ? `
                    <div style="margin-top: 5px; font-size: 10px; color: #D69E2E; font-weight: bold;">
                        ✨ ДВОЙНОЙ опыт
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
            alert("Комната не найдена!");
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
        alert("Не удалось изменить статус готовности");
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
        alert("Только создатель комнаты может начать игру!");
        return;
    }
    
    debugLog("Создатель начинает игру...");
    
    try {
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const room = roomDoc.data();
        
        const allReady = players.length >= 2 && players.every(p => p.ready);
        if (!allReady) {
            alert("Не все игроки готовы или недостаточно игроков!");
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
        alert("Не удалось начать игру: " + error.message);
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
        alert("Не удалось начать игру: " + error.message);
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
    
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    startTime = new Date();
    
    // Показываем уведомление о двойном опыте, если есть
    if (hasDoubleXP) {
        const doubleXPNotification = document.createElement('div');
        doubleXPNotification.className = 'notification';
        doubleXPNotification.textContent = "⚡ У вас активен ДВОЙНОЙ опыт! Все ответы дают x2 очков!";
        doubleXPNotification.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
        doubleXPNotification.style.color = '#000';
        document.body.appendChild(doubleXPNotification);
        setTimeout(() => doubleXPNotification.remove(), 5000);
    }
    
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
                <div class="result-row" style="${player.hasDoubleXP ? 'border-left: 4px solid gold; background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 165, 0, 0.05));' : ''}">
                    <div>
                        <strong>${place}. ${player.nick}</strong>
                        ${player.nick === room.creator ? "👑" : ""}
                        ${player.hasDoubleXP ? " ⚡" : ""}
                    </div>
                    <div>
                        <strong>${player.score}</strong> очков
                        ${player.hasDoubleXP ? '<br><small style="color: #D69E2E;">(x2 опыт)</small>' : ''}
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
        secretNames: SECRET_NAMES
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
    if (timerElement) {
        timerElement.textContent = "0";
        timerElement.parentElement.classList.remove("timer-warning", "timer-danger");
    }
    
    questionTimer = setInterval(() => {
        elapsedTime++;
        if (timerElement) {
            timerElement.textContent = elapsedTime;
            
            // Изменение цвета таймера
            const timerParent = timerElement.parentElement;
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
            
            // Подсчет очков
            let points = 100 - Math.floor(elapsedTime / 5) * 5;
            if (points < 0) points = 0;
            
            // Применяем двойной опыт, если есть
            if (hasDoubleXP) {
                points *= 2;
            }
            
            const isCorrect = index === question.c;
            
            if (isCorrect) {
                label.classList.add("correct");
                score += points;
                debugLog(`Правильный ответ! +${points} очков ${hasDoubleXP ? '(x2)' : ''}`, { 
                    question: currentQuestionIndex + 1, 
                    time: elapsedTime,
                    doubleXP: hasDoubleXP
                });
            } else {
                label.classList.add("wrong");
                const correctOption = document.querySelectorAll(".option")[question.c];
                if (correctOption) {
                    correctOption.classList.add("correct");
                }
                debugLog(`Неправильный ответ`, { question: currentQuestionIndex + 1 });
            }
            
            // Сохраняем ответ
            userAnswers.push({
                question: question.q,
                userAnswer: answer,
                correctAnswer: question.a[question.c],
                isCorrect: isCorrect,
                explanation: question.exp,
                time: elapsedTime,
                points: isCorrect ? points : 0,
                doubleXP: hasDoubleXP && isCorrect
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
        time: elapsedSec,
        correctAnswers: userAnswers.filter(a => a.isCorrect).length,
        totalQuestions: questions.length,
        hasDoubleXP,
        doubleXPBonus: hasDoubleXP ? "активен" : "не активен"
    });
}

function showSingleResults(elapsedSec) {
    const min = Math.floor(elapsedSec / 60);
    const sec = elapsedSec % 60;
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    
    const resElement = document.getElementById("final-result");
    if (resElement) {
        resElement.innerHTML = `
            <strong>${nick}</strong>, ваш результат: <span style="color:#667eea; font-size:1.2em;">${score}</span> очков
            ${hasDoubleXP ? '<span style="color: gold; font-weight: bold;"> (с ДВОЙНЫМ опытом!)</span>' : ''}<br>
            Правильных ответов: <strong>${correctAnswers} из ${questions.length}</strong> (${accuracy}%)<br>
            Время: ${min} мин ${sec} сек
            ${hasDoubleXP ? '<br><span style="color: #D69E2E; font-weight: bold;">🎉 Секретное имя дало вам ДВОЙНОЙ опыт!</span>' : ''}
        `;
    }
    
    showDetailedResults();
}

async function showMultiplayerResults(elapsedSec) {
    try {
        if (!roomId || !db) return;
        
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
            // Если комнаты нет, показываем локальные результаты
            showSingleResults(elapsedSec || 0);
            return;
        }
        
        const room = roomDoc.data();
        
        // Если elapsedSec не передан, используем 0
        const finalElapsedSec = elapsedSec || 0;
        
        // Обновляем наш финальный счет только если игра начата
        if (gameStarted) {
            const updatedPlayers = room.players.map(p => {
                if (p.nick === nick) {
                    return {
                        ...p,
                        score: score,
                        finished: true,
                        finishTime: new Date().toISOString(),
                        totalTime: finalElapsedSec
                    };
                }
                return p;
            });
            
            await roomRef.update({
                players: updatedPlayers,
                lastActive: new Date().toISOString()
                // Не меняем статус на finished, если он уже установлен
            });
        }
        
        // Получаем актуальные данные
        const updatedRoomDoc = await roomRef.get();
        const updatedRoom = updatedRoomDoc.data();
        const currentPlayers = updatedRoom.players || [];
        
        // Сортируем игроков по очкам
        const sortedPlayers = [...currentPlayers].sort((a, b) => b.score - a.score);
        const playerIndex = sortedPlayers.findIndex(p => p.nick === nick);
        const playerPlace = playerIndex + 1;
        const isWinner = playerPlace === 1 && sortedPlayers.length > 0;
        
        const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
        const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
        
        const resElement = document.getElementById("final-result");
        if (resElement) {
            resElement.innerHTML = `
                <strong>${nick}</strong>, ваш результат: <span style="color:#667eea; font-size:1.2em;">${score}</span> очков
                ${hasDoubleXP ? '<span style="color: gold; font-weight: bold;"> (с ДВОЙНЫМ опытом!)</span>' : ''}<br>
                Место: <strong>${playerPlace} из ${sortedPlayers.length}</strong><br>
                Правильных ответов: <strong>${correctAnswers} из ${questions.length}</strong> (${accuracy}%)
                ${hasDoubleXP ? '<br><span style="color: #D69E2E; font-weight: bold;">🎉 Секретное имя дало вам ДВОЙНОЙ опыт!</span>' : ''}
            `;
        }
        
        if (isWinner) {
            const winnerElement = document.getElementById("winner");
            if (winnerElement) winnerElement.classList.remove("hidden");
            
            // Добавляем спецэффекты для победителя
            if (hasDoubleXP) {
                const winnerIcon = document.querySelector('.winner-icon');
                if (winnerIcon) winnerIcon.textContent = "⚡🏆⚡";
                const winnerText = document.querySelector('.winner-text');
                if (winnerText) winnerText.style.color = 'gold';
                winnerText.textContent = "ПОБЕДА С ДВОЙНЫМ ОПЫТОМ!";
            }
        }
        
        // Таблица результатов
        const finalResults = document.getElementById("final-results");
        if (finalResults && finalResults.tBodies[0]) {
            let html = "";
            sortedPlayers.forEach((player, index) => {
                const place = index + 1;
                const totalQuestions = updatedRoom.questionCount || 20;
                const progress = player.progress || 0;
                const playerAccuracy = progress > 0 ? Math.round((player.score / (progress * 100)) * 100) || 0 : 0;
                const finishTime = player.finished ? "Завершил" : "Не завершил";
                const hasDoubleXP = player.hasDoubleXP || false;
                
                html += `
                    <tr style="${hasDoubleXP ? 'background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 165, 0, 0.05));' : ''}">
                        <td>${place} ${place === 1 ? "🏆" : place === 2 ? "🥈" : place === 3 ? "🥉" : ""}</td>
                        <td>${player.nick} ${player.nick === updatedRoom.creator ? "👑" : ""} ${hasDoubleXP ? "⚡" : ""}</td>
                        <td><strong>${player.score}</strong> ${hasDoubleXP ? '<small style="color: #D69E2E;">(x2)</small>' : ''}</td>
                        <td>${finishTime}</td>
                        <td>${playerAccuracy}%</td>
                    </tr>
                `;
            });
            
            finalResults.tBodies[0].innerHTML = html;
        }
        
        // Показываем результаты
        const gameElement = document.getElementById("game");
        const resultsElement = document.getElementById("results");
        
        if (gameElement) gameElement.classList.add("hidden");
        if (resultsElement) resultsElement.classList.remove("hidden");
        
        // Показываем детальные результаты если есть данные
        if (userAnswers.length > 0) {
            showDetailedResults();
        }
        
        // Обновляем live-результаты
        const liveResults = document.getElementById("live-results");
        if (liveResults) liveResults.classList.add("hidden");
        
        debugLog("Мультиплеерные результаты показаны", {
            place: playerPlace,
            totalPlayers: sortedPlayers.length,
            isWinner: isWinner,
            hasDoubleXP: hasDoubleXP
        });
        
    } catch (error) {
        console.error("Ошибка показа результатов:", error);
        debugLog("Ошибка показа результатов:", error);
        
        // Показываем локальные результаты в случае ошибки
        showSingleResults(elapsedSec || 0);
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
    let totalPoints = 0;
    let totalDoubleXPPoints = 0;
    
    userAnswers.forEach((answer, index) => {
        const questionNumber = index + 1;
        const resultClass = answer.isCorrect ? "correct" : "wrong";
        const icon = answer.isCorrect ? "✅" : "❌";
        
        if (answer.isCorrect) {
            correctCount++;
            totalPoints += answer.points;
            if (answer.doubleXP) {
                totalDoubleXPPoints += answer.points / 2; // Половина - бонус
            }
        }
        
        html += `
            <div class="question-result ${resultClass}" style="${answer.doubleXP ? 'border: 2px solid gold;' : ''}">
                <div><strong>${icon} Вопрос ${questionNumber}:</strong> ${answer.question}</div>
                <div><strong>Ваш ответ:</strong> ${answer.userAnswer}</div>
                <div><strong>Правильный ответ:</strong> ${answer.correctAnswer}</div>
                <div><strong>Объяснение:</strong> ${answer.explanation}</div>
                <div style="margin-top: 5px; font-size: 14px; color: #718096;">
                    <strong>Время:</strong> ${answer.time} сек 
                    <strong>Очки:</strong> ${answer.points}
                    ${answer.doubleXP ? '<strong style="color: gold; margin-left: 10px;">⚡ ДВОЙНОЙ опыт!</strong>' : ''}
                </div>
            </div>
        `;
    });
    
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const totalTime = userAnswers.reduce((sum, answer) => sum + answer.time, 0);
    const avgTime = userAnswers.length > 0 ? Math.round(totalTime / userAnswers.length) : 0;
    
    const bonusText = hasDoubleXP ? `
        <div style="background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 15px; border-radius: 8px; margin: 10px 0; text-align: center; font-weight: bold;">
            ⚡ БОНУС ЗА СЕКРЕТНОЕ ИМЯ: +${totalDoubleXPPoints} очков! ⚡
        </div>
    ` : '';
    
    const statsHtml = `
        <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; border-left: 5px solid #667eea;">
            <h4 style="margin-top: 0; color: #4a5568;">📈 Статистика игры</h4>
            ${bonusText}
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
                    <div style="font-size: 14px; color: #718096;">очков ${hasDoubleXP ? '<br><span style="color: gold;">(x2 опыт)</span>' : ''}</div>
                </div>
            </div>
            ${hasDoubleXP ? `
                <div style="margin-top: 15px; text-align: center; color: #D69E2E; font-weight: bold;">
                    ⚡ Вы использовали секретное имя "${nick}" и получили ДВОЙНОЙ опыт!
                </div>
                <div style="margin-top: 5px; text-align: center; font-size: 12px; color: #718096;">
                    Секретные имена для двойного опыта: ${SECRET_NAMES.join(', ')}
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
        alert("Не удалось вернуться в лобби");
    }
}

async function leaveRoom() {
    if (!roomId || !nick) return;
    
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
    
    location.reload();
}

// ========== БЕЗОПАСНОЕ ОБНОВЛЕНИЕ КОМНАТЫ ==========
async function safelyUpdateRoom(data) {
    try {
        if (!roomId || !db) return false;
        
        const roomRef = db.collection("rooms").doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (roomDoc.exists) {
            await roomRef.update({
                ...data,
                lastActive: new Date().toISOString()
            });
            return true;
        }
        return false;
    } catch (error) {
        debugLog("Ошибка обновления комнаты:", error);
        return false;
    }
}

// ========== ОЧИСТКА СТАРЫХ КОМНАТ (автоматическая) ==========
async function cleanupOldRooms() {
    try {
        if (!db) return;
        
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const oldRooms = await db.collection("rooms")
            .where("lastActive", "<", hourAgo)
            .get();
        
        const deletionPromises = [];
        oldRooms.forEach(doc => {
            deletionPromises.push(doc.ref.delete());
            debugLog("Удалена старая комната:", doc.id);
        });
        
        await Promise.all(deletionPromises);
        
    } catch (error) {
        debugLog("Ошибка очистки комнат:", error);
    }
}

// Запускаем очистку каждые 30 минут
setInterval(cleanupOldRooms, 30 * 60 * 1000);

// Очищаем сразу при загрузке
cleanupOldRooms();

// ========== ОБРАБОТКА ЗАКРЫТИЯ СТРАНИЦЫ ==========
window.addEventListener('beforeunload', function(e) {
    if (!isPageUnloading && (gameStarted || roomId)) {
        e.preventDefault();
        e.returnValue = 'Вы находитесь в игре. Вы уверены, что хотите уйти?';
        leaveRoom();
    }
});

console.log("🎮 Математическая Битва полностью загружена и готова к работе!");
debugLog("Система готова. Добро пожаловать в игру!");
