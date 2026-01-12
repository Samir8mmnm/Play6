document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const modeButtons = document.querySelectorAll('.mode-btn');
    const soloPanel = document.getElementById('solo-settings');
    const multiPanel = document.getElementById('multi-settings');
    const questionRange = document.getElementById('questionRange');
    const rangeValue = document.getElementById('rangeValue');
    const startSoloBtn = document.getElementById('startSoloGame');
    const soloLoader = document.getElementById('solo-loader');
    const gameModal = document.getElementById('gameModal');
    const closeGameBtn = document.getElementById('closeGame');
    const questionText = document.getElementById('questionText');
    const answersContainer = document.getElementById('answersContainer');
    const timerBar = document.getElementById('timerBar');
    const timerText = document.getElementById('timerText');
    const currentQuestionEl = document.getElementById('currentQuestion');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const currentScoreEl = document.getElementById('currentScore');
    const correctCountEl = document.getElementById('correctCount');
    
    // Статистика
    const totalGamesEl = document.getElementById('totalGames');
    const correctAnswersEl = document.getElementById('correctAnswers');
    const bestScoreEl = document.getElementById('bestScore');
    const levelEl = document.getElementById('level');
    
    // Игровые переменные
    let currentMode = 'solo';
    let gameActive = false;
    let currentQuestion = 0;
    let totalQuestions = 10;
    let score = 0;
    let correctAnswers = 0;
    let timerInterval;
    let timeLeft = 45;
    let questions = [];
    let secretNames = ['Эпштейн', 'Пидиди', 'Мегаманс', 'Чахапов']; // Скрыты от пользователя
    
    // Загрузка статистики из localStorage
    loadStats();
    
    // === ОБРАБОТЧИКИ ИНТЕРФЕЙСА ===
    
    // Переключение режимов
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            modeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.dataset.mode;
            
            soloPanel.classList.remove('active');
            multiPanel.classList.remove('active');
            
            if (currentMode === 'solo') {
                soloPanel.classList.add('active');
            } else {
                multiPanel.classList.add('active');
            }
        });
    });
    
    // Слайдер количества вопросов
    questionRange.addEventListener('input', function() {
        rangeValue.textContent = this.value;
    });
    
    // Начать одиночную игру
    startSoloBtn.addEventListener('click', startSoloGame);
    
    // Закрыть модальное окно игры
    closeGameBtn.addEventListener('click', function() {
        gameModal.classList.add('hidden');
        resetGame();
    });
    
    // === ФУНКЦИИ ИГРЫ ===
    
    function startSoloGame() {
        const username = document.getElementById('username').value.trim();
        const questionCount = parseInt(questionRange.value);
        
        if (!username) {
            alert('Введите никнейм!');
            return;
        }
        
        // Проверка на секретное имя (x2 опыт)
        const isSecretName = secretNames.includes(username);
        if (isSecretName) {
            console.log('Секретное имя обнаружено! Опыт x2');
        }
        
        // Показываем загрузку
        soloLoader.classList.remove('hidden');
        startSoloBtn.disabled = true;
        
        // Имитация загрузки вопросов (в реальном приложении - запрос к API)
        setTimeout(() => {
            generateQuestions(questionCount);
            soloLoader.classList.add('hidden');
            startSoloBtn.disabled = false;
            
            // Начинаем игру
            totalQuestions = questionCount;
            currentQuestion = 0;
            score = 0;
            correctAnswers = 0;
            
            // Обновляем статистику
            totalGamesEl.textContent = parseInt(totalGamesEl.textContent) + 1;
            
            // Показываем игровое окно
            showGameModal();
            loadNextQuestion();
        }, 1500); // Имитация задержки сети
    }
    
    function generateQuestions(count) {
        questions = [];
        const operations = ['+', '-', '×', '÷'];
        
        for (let i = 0; i < count; i++) {
            const operation = operations[Math.floor(Math.random() * operations.length)];
            let num1, num2, answer;
            
            switch(operation) {
                case '+':
                    num1 = Math.floor(Math.random() * 50) + 1;
                    num2 = Math.floor(Math.random() * 50) + 1;
                    answer = num1 + num2;
                    break;
                case '-':
                    num1 = Math.floor(Math.random() * 50) + 20;
                    num2 = Math.floor(Math.random() * 20) + 1;
                    answer = num1 - num2;
                    break;
                case '×':
                    num1 = Math.floor(Math.random() * 12) + 1;
                    num2 = Math.floor(Math.random() * 12) + 1;
                    answer = num1 * num2;
                    break;
                case '÷':
                    num2 = Math.floor(Math.random() * 10) + 2;
                    answer = Math.floor(Math.random() * 10) + 2;
                    num1 = num2 * answer;
                    break;
            }
            
            // Генерируем неправильные ответы
            const wrongAnswers = [];
            while (wrongAnswers.length < 3) {
                const wrong = answer + (Math.floor(Math.random() * 10) - 5);
                if (wrong !== answer && wrong > 0 && !wrongAnswers.includes(wrong)) {
                    wrongAnswers.push(wrong);
                }
            }
            
            const allAnswers = [answer, ...wrongAnswers];
            shuffleArray(allAnswers);
            
            questions.push({
                text: `Сколько будет ${num1} ${operation} ${num2}?`,
                correct: answer,
                answers: allAnswers
            });
        }
    }
    
    function showGameModal() {
        gameModal.classList.remove('hidden');
        totalQuestionsEl.textContent = totalQuestions;
        updateScoreDisplay();
    }
    
    function loadNextQuestion() {
        if (currentQuestion >= totalQuestions) {
            endGame();
            return;
        }
        
        currentQuestion++;
        currentQuestionEl.textContent = currentQuestion;
        
        const question = questions[currentQuestion - 1];
        questionText.textContent = question.text;
        
        // Очищаем предыдущие ответы
        answersContainer.innerHTML = '';
        
        // Создаем кнопки ответов
        question.answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = answer;
            button.addEventListener('click', function() {
                checkAnswer(answer, question.correct, button);
            });
            answersContainer.appendChild(button);
        });
        
        // Запускаем таймер
        startTimer();
    }
    
    function startTimer() {
        timeLeft = 45;
        timerBar.style.width = '100%';
        timerText.textContent = timeLeft;
        
        clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerText.textContent = timeLeft;
            timerBar.style.width = `${(timeLeft / 45) * 100}%`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeout();
            }
        }, 1000);
    }
    
    function checkAnswer(selected, correct, button) {
        clearInterval(timerInterval);
        
        // Отключаем все кнопки
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.disabled = true;
            if (parseInt(btn.textContent) === correct) {
                btn.classList.add('correct');
            }
        });
        
        if (selected === correct) {
            button.classList.add('correct');
            score += 10;
            correctAnswers++;
            
            // Обновляем статистику
            correctAnswersEl.textContent = parseInt(correctAnswersEl.textContent) + 1;
            
            // Проверка на лучший счёт
            if (score > parseInt(bestScoreEl.textContent)) {
                bestScoreEl.textContent = score;
                saveStats();
            }
        } else {
            button.classList.add('wrong');
        }
        
        updateScoreDisplay();
        
        // Следующий вопрос через 1.5 секунды
        setTimeout(() => {
            loadNextQuestion();
        }, 1500);
    }
    
    function handleTimeout() {
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.disabled = true;
            if (parseInt(btn.textContent) === questions[currentQuestion - 1].correct) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            loadNextQuestion();
        }, 1500);
    }
    
    function updateScoreDisplay() {
        currentScoreEl.textContent = score;
        correctCountEl.textContent = correctAnswers;
    }
    
    function endGame() {
        // Обновляем уровень (каждые 100 очков = +1 уровень)
        const level = Math.floor(score / 100) + 1;
        levelEl.textContent = level;
        
        // Сохраняем статистику
        saveStats();
        
        // Показываем результаты
        setTimeout(() => {
            alert(`Игра завершена!\n\nПравильных ответов: ${correctAnswers}/${totalQuestions}\nСчёт: ${score}\nУровень: ${level}`);
            gameModal.classList.add('hidden');
            resetGame();
        }, 500);
    }
    
    function resetGame() {
        gameActive = false;
        currentQuestion = 0;
        score = 0;
        correctAnswers = 0;
        clearInterval(timerInterval);
    }
    
    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function saveStats() {
        const stats = {
            totalGames: totalGamesEl.textContent,
            correctAnswers: correctAnswersEl.textContent,
            bestScore: bestScoreEl.textContent,
            level: levelEl.textContent
        };
        localStorage.setItem('mathBattleStats', JSON.stringify(stats));
    }
    
    function loadStats() {
        const saved = localStorage.getItem('mathBattleStats');
        if (saved) {
            const stats = JSON.parse(saved);
            totalGamesEl.textContent = stats.totalGames || '0';
            correctAnswersEl.textContent = stats.correctAnswers || '0';
            bestScoreEl.textContent = stats.bestScore || '0';
            levelEl.textContent = stats.level || '1';
        }
    }
    
    // === МУЛЬТИПЛЕЕР (заглушки) ===
    
    document.getElementById('createRoom').addEventListener('click', function() {
        const roomCode = Math.floor(1000 + Math.random() * 9000);
        alert(`Комната создана!\nКод для присоединения: ${roomCode}\n\n(Это демо-версия, мультиплеер не реализован)`);
    });
    
    document.getElementById('joinRoom').addEventListener('click', function() {
        const code = document.getElementById('roomCode').value;
        if (code.length === 4) {
            alert(`Присоединяемся к комнате ${code}...\n\n(Это демо-версия, мультиплеер не реализован)`);
        } else {
            alert('Введите 4-значный код комнаты!');
        }
    });
});
