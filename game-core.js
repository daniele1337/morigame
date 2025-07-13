// Основная логика игры
const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");

// Переменные игры
let frames = 0;
let gamePaused = false;
let mute = false;
let night = false;
let engineHeld = false;

// Определение устройства
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Состояния игры
const state = {
    current: 0,
    home: 0,
    getReady: 1,
    game: 2,
    gameOver: 3
};

// Telegram интеграция
let tg = null;
let currentUser = null;

// Инициализация
function initGame() {
    if (!cvs) {
        console.error('Canvas not found!');
        return;
    }
    
    canvasScale();
    window.addEventListener("resize", canvasScale);
    initTelegram();
    console.log('Game initialized');
}

// Telegram инициализация
function initTelegram() {
    setTimeout(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            currentUser = tg.initDataUnsafe?.user;
            console.log('Telegram initialized');
        }
    }, 200);
}

// Игровой цикл (оптимизированный)
function gameLoop() {
    update();
    draw();
    if (!gamePaused) frames++;
    requestAnimationFrame(gameLoop);
}

// Запуск игры
window.addEventListener("load", () => {
    initGame();
    gameLoop();
}); 