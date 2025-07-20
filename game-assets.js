cvs = document.getElementById("canvas");
ctx = cvs.getContext("2d");
isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// === Глобальная переменная для отключения звука по умолчанию ===
mute = true;

// LOAD SPRITE SHEET
sprite_sheet = new Image();
sprite_sheet.onload = function() {
    console.log('Sprite sheet loaded successfully');
};
sprite_sheet.onerror = function() {
    console.error('Failed to load sprite sheet');
};
sprite_sheet.src = "img/sprite_sheet.png"

// === ДОБАВЛЯЕМ: Загрузка спрайта вертолёта ===
helicopter_sprite = new Image();
helicopter_sprite.onload = function() {
    console.log('Helicopter sprite loaded successfully');
};
helicopter_sprite.onerror = function() {
    console.error('Failed to load helicopter sprite');
};
helicopter_sprite.src = "img/helicopter@helicopter.png";

// === ДОБАВЛЯЕМ: Загрузка спрайта mori_model ===
mori_model_sprite = new Image();
mori_model_sprite.onload = function() {
    console.log('Mori model sprite loaded successfully');
};
mori_model_sprite.onerror = function() {
    console.error('Failed to load mori model sprite');
};
mori_model_sprite.src = "img/separated/mori_model.png";

// LOAD SOUNDS
DIE = new Audio();
DIE.src = "audio/explosion.wav";

POINT = new Audio();
POINT.src = "audio/point.wav";

// === Двойное наложение фонового звука ракеты ===
let ROCKET_BG_A = new Audio("audio/rocket1.wav");
let ROCKET_BG_B = new Audio("audio/rocket1.wav");
ROCKET_BG_A.loop = false;
ROCKET_BG_B.loop = false;
ROCKET_BG_A.volume = 0.2;
ROCKET_BG_B.volume = 0.2;
let rocketLoopActive = false;
let rocketOverlapTimeout = null;

function playRocketLoop() {
    if (rocketLoopActive) return;
    rocketLoopActive = true;
    ROCKET_BG_A.currentTime = 0;
    ROCKET_BG_A.play();
    scheduleRocketOverlap();
}

function scheduleRocketOverlap() {
    // Ждём до конца первого звука минус overlap (0.2 сек)
    let overlap = 0.2;
    let duration = ROCKET_BG_A.duration || 3.5; // fallback если duration не определён
    rocketOverlapTimeout = setTimeout(() => {
        if (!rocketLoopActive) return;
        ROCKET_BG_B.currentTime = 0;
        ROCKET_BG_B.play();
        ROCKET_BG_A.onended = () => {
            if (!rocketLoopActive) return;
            ROCKET_BG_A.currentTime = 0;
            ROCKET_BG_A.play();
            scheduleRocketOverlap();
        };
        ROCKET_BG_B.onended = () => {};
    }, (duration - overlap) * 1000);
}

function stopRocketLoop() {
    rocketLoopActive = false;
    if (rocketOverlapTimeout) clearTimeout(rocketOverlapTimeout);
    ROCKET_BG_A.pause();
    ROCKET_BG_B.pause();
    ROCKET_BG_A.currentTime = 0;
    ROCKET_BG_B.currentTime = 0;
}

// === Функция для установки громкости всех звуков ===
function setAllSoundsVolume(vol) {
    DIE.volume = vol;
    POINT.volume = vol;
    // Добавьте сюда другие звуки, если появятся
} 