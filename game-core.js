// Основная логика игры
cvs = document.getElementById("canvas");
ctx = cvs.getContext("2d");

// Переменные игры
frames = 0;
gamePaused = false;
mute = false;
night = false;
engineHeld = false;

// Определение устройства
isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Состояния игры
state = {
    current: 0,
    home: 0,
    getReady: 1,
    game: 2,
    gameOver: 3
};

// Telegram интеграция
tg = null;
currentUser = null;

// Инициализация
initGame = function() {
    if (!cvs) {
        console.error('Canvas not found!');
        return;
    }
    
    // canvasScale вызывается до gameLoop
    canvasScale();
    window.addEventListener("resize", canvasScale);
    initTelegram();
    console.log('Game initialized');
}

// Telegram инициализация
initTelegram = function() {
    setTimeout(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            currentUser = tg.initDataUnsafe?.user;
            console.log('Telegram initialized');
        }
    }, 200);
}

// Игровой цикл (оптимизированный)
let lastTimestamp = performance.now();
gameLoop = function(timestamp) {
    if (timestamp === undefined) timestamp = performance.now();
    let deltaTime = (timestamp - lastTimestamp) / 1000; // в секундах
    lastTimestamp = timestamp;
    // Ограничиваем максимальный deltaTime для плавности (например, 50 мс)
    deltaTime = Math.min(deltaTime, 0.05);
    update(deltaTime);
    draw();
    if (!gamePaused) frames++;
    requestAnimationFrame(gameLoop);
}

// Запуск игры
window.addEventListener("load", () => {
    state.current = state.home;
    canvasScale();
    initGame();
    lastTimestamp = performance.now();
    gameLoop();
});

// Добавляю отладку размеров объектов в draw()
oldDraw = draw;
draw = function() {
    oldDraw();
    console.log('bird:', bird.x, bird.y, bird.w, bird.h);
    console.log('home.logo:', home.logo.x, home.logo.y, home.logo.w, home.logo.h);
    console.log('foreground:', foreground.x, foreground.y, foreground.w, foreground.h);
    console.log('background:', background.x, background.y, background.w, background.h);
} 