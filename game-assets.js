// LOAD SPRITE SHEET
const sprite_sheet = new Image();
sprite_sheet.onload = function() {
    console.log('Sprite sheet loaded successfully');
};
sprite_sheet.onerror = function() {
    console.error('Failed to load sprite sheet');
};
sprite_sheet.src = "img/sprite_sheet.png"

// === ДОБАВЛЯЕМ: Загрузка спрайта вертолёта ===
const helicopter_sprite = new Image();
helicopter_sprite.onload = function() {
    console.log('Helicopter sprite loaded successfully');
};
helicopter_sprite.onerror = function() {
    console.error('Failed to load helicopter sprite');
};
helicopter_sprite.src = "img/helicopter@helicopter.png";

// === ДОБАВЛЯЕМ: Загрузка спрайта mori_model ===
const mori_model_sprite = new Image();
mori_model_sprite.onload = function() {
    console.log('Mori model sprite loaded successfully');
};
mori_model_sprite.onerror = function() {
    console.error('Failed to load mori model sprite');
};
mori_model_sprite.src = "img/separated/mori_model.png";

// LOAD SOUNDS
const DIE = new Audio();
DIE.src = "audio/die.wav";

const FLAP = new Audio();
FLAP.src = "audio/flap.wav";

const HIT = new Audio();
HIT.src = "audio/hit.wav";

const POINT = new Audio();
POINT.src = "audio/point.wav";

const SWOOSH = new Audio();
SWOOSH.src = "audio/swooshing.wav"; 