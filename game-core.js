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
}

// Telegram инициализация
initTelegram = function() {
    setTimeout(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            currentUser = tg.initDataUnsafe?.user;
        }
    }, 200);
}

let lastTime = performance.now();

function gameLoop(now) {
    let delta = (now - lastTime) / 1000; // в секундах
    window.lastDelta = delta; // для передачи в draw-функции
    
    // Обновляем игру только если не на паузе
    if (!gamePaused) {
        update(delta);
        // checkAllCollisions(); // удаляем вызов
        updateExplosion(delta);
    }
    
    // Отрисовка всегда происходит (чтобы показать состояние паузы)
    draw();
    drawExplosion();
    
    if (!gamePaused) frames++;
    lastTime = now;
    requestAnimationFrame(gameLoop);
}

// Запуск игры
window.addEventListener("load", () => {
    state.current = state.home;
    canvasScale();
    initGame();
    lastTime = performance.now(); // сброс времени при старте
    gameLoop(lastTime);
});

// Добавляю отладку размеров объектов в draw()
oldDraw = draw;
draw = function() {
    oldDraw();
} 