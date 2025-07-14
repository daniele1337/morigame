cvs = document.getElementById("canvas");
ctx = cvs.getContext("2d");
isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
DIE.src = "audio/die.wav";

FLAP = new Audio();
FLAP.src = "audio/flap.wav";

HIT = new Audio();
HIT.src = "audio/hit.wav";

POINT = new Audio();
POINT.src = "audio/point.wav";

SWOOSH = new Audio();
SWOOSH.src = "audio/swooshing.wav";

// === Функция для установки громкости всех звуков ===
function setAllSoundsVolume(vol) {
    DIE.volume = vol;
    FLAP.volume = vol;
    HIT.volume = vol;
    POINT.volume = vol;
    SWOOSH.volume = vol;
    // Добавьте сюда другие звуки, если появятся
} 