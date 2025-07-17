// UI элементы игры

// Счет
score = {
    new_best: {spriteX: 921, spriteY: 349, spriteW: 64, spriteH: 28, x: 0, y: 0, w: 0, h: 0},
    number: [
        {spriteX: 98}, {spriteX: 127}, {spriteX: 156}, {spriteX: 185}, {spriteX: 214},
        {spriteX: 243}, {spriteX: 272}, {spriteX: 301}, {spriteX: 330}, {spriteX: 359}
    ],
    spriteY: 243, spriteW: 28, spriteH: 40,
    x: 0, y: 0, w: 0, one_w: 0, space: 0,
    score: {x: 0, y: 0, w: 0, h: 0}, best: {x: 0, y: 0, w: 0, h: 0},
    best_score: parseInt(localStorage.getItem("best_score")) || 0,
    game_score: 0, new_best_score: false,

    draw: function() {
        let game_score_s = this.game_score.toString();
        let best_score_s = this.best_score.toString();

        if(state.current == state.game) {
            let total_width = 0;
            for (let i = 0; i < game_score_s.length; i++) {
                if (game_score_s[i] == 1) {
                    total_width += this.one_w + this.space;
                } else {
                    total_width += this.w + this.space;
                }
            }
            total_width -= this.space;
            let offset = this.x - total_width / 2 + (this.w / 2);
            
            for(let i = 0; i < game_score_s.length; i++) {
                if (i < game_score_s.length - 1 && game_score_s[i+1] == 1) {
                    ctx.drawImage(sprite_sheet, this.number[parseInt(game_score_s[i])].spriteX, this.spriteY, this.spriteW, this.spriteH, offset, this.y, this.w, this.h);
                    offset = offset + this.one_w + this.space;
                } else {
                    ctx.drawImage(sprite_sheet, this.number[parseInt(game_score_s[i])].spriteX, this.spriteY, this.spriteW, this.spriteH, offset, this.y, this.w, this.h);
                    offset = offset + this.w + this.space;
                }
            }            
        }
    },

    scoreReset: function() {
        this.game_score = 0;
        this.new_best_score = false;
        
        // Сбрасываем ускорение при начале новой игры
        if (typeof speedBoostMultiplier !== 'undefined') {
            speedBoostMultiplier = 1.0;
            lastSpeedBoostScore = 0;
            if (typeof pipes !== 'undefined' && typeof pipes.dx !== 'undefined' && typeof baseHorizontalSpeed !== 'undefined') {
                pipes.dx = baseHorizontalSpeed;
            }
        }
    }
};

// Кнопки игры
gameButtons = {
    mute_button: {spriteX: 171, spriteY: 63, spriteW: 55, spriteH: 62},
    unmute_button: {spriteX: 171, spriteY: 0, spriteW: 55, spriteH: 62},
    start_button: {spriteX: 227, spriteY: 0, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0, y_pressed: 0, isPressed: false, pressTime: 0, hover: false, shineAnim: 0},
    pause_button: {spriteX: 280, spriteY: 114, spriteW: 52, spriteH: 56},
    resume_button: {spriteX: 227, spriteY: 114, spriteW: 52, spriteH: 56},
    home_button: {spriteX: 388, spriteY: 171, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0, y_pressed: 0, isPressed: false, pressTime: 0},
    restart_button: {spriteX: 227, spriteY: 57, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0, y_pressed: 0, isPressed: false, pressTime: 0},
    night_button: {spriteX: 280, spriteY: 171, spriteW: 56, spriteH: 60, x: 0, isPressed: false},
    day_button: {spriteX: 223, spriteY: 171, spriteW: 56, spriteH: 60, x: 0, isPressed: false},
    x: 0, y: 0, w: 0, h: 0, y_pressed: 0, isPressed: false,

    draw: function() {
        let button_y = this.isPressed ? this.y_pressed : this.y;
        let night_button_y = this.night_button.isPressed ? this.y_pressed : this.y;
        let start_button_y = this.start_button.isPressed ? this.start_button.y_pressed : this.start_button.y;
        let restart_button_y = this.restart_button.isPressed ? this.restart_button.y_pressed : this.restart_button.y;
        let home_button_y = this.home_button.isPressed ? this.home_button.y_pressed : this.home_button.y;
        const now = performance.now();
        // --- Рисуем главные кнопки с эффектом или без ---
        // --- Удалён универсальный цикл для кнопок с эффектом ---
        if(state.current == state.home) {
            // Звук
            if(!mute) {
                ctx.drawImage(btnSoundOnImg, this.x, button_y, this.w, this.h);
            } else {
                ctx.drawImage(btnSoundOffImg, this.x, button_y, this.w, this.h);
            }
            // День/ночь
            // ctx.drawImage(btnDayModeImg, this.night_button.x, night_button_y, this.w, this.h); // временно скрыто
            // if(!night) {
            //     ctx.drawImage(btnNightModeImg, this.night_button.x, night_button_y, this.w, this.h);
            // } else {
            //     ctx.drawImage(btnDayModeImg, this.night_button.x, night_button_y, this.w, this.h);
            // }
            // --- Кнопка старт с анимацией ---
            let t = performance.now() * 0.001;
            let pulse = 1 + 0.04 * Math.sin(t * 2);
            let centerX = this.start_button.x + this.start_button.w/2;
            let centerY = start_button_y + this.start_button.h/2;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(pulse, pulse);
            ctx.drawImage(btnStartImg, -this.start_button.w/2, -this.start_button.h/2, this.start_button.w, this.start_button.h);
            ctx.restore();
            if (this.start_button.hover || this.start_button.isPressed) {
                ctx.save();
                let grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.start_button.w*0.5);
                grad.addColorStop(0, 'rgba(255,255,255,0.25)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, this.start_button.w*0.5, this.start_button.h*0.3, 0, 0, 2*Math.PI);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            }
        } else if(state.current == state.game) {
            // Пауза/Продолжить
            if(!gamePaused) {
                ctx.drawImage(btnPauseImg, this.x, button_y, this.w, this.h);
            } else {
                ctx.drawImage(btnPlayImg, this.x, button_y, this.w, this.h);
            }
            // Отладочная информация (закомментировано)
            // console.log('Состояние паузы:', gamePaused, 'Координаты кнопки:', this.x, button_y, this.w, this.h);
        } else if(state.current == state.gameOver) {
            // --- Кнопка рестарт с анимацией ---
            let t2 = performance.now() * 0.001;
            let pulse2 = 1 + 0.04 * Math.sin(t2 * 2);
            let centerX2 = this.restart_button.x + this.restart_button.w/2;
            let centerY2 = restart_button_y + this.restart_button.h/2;
            ctx.save();
            ctx.translate(centerX2, centerY2);
            ctx.scale(pulse2, pulse2);
            ctx.drawImage(btnRestartImg, -this.restart_button.w/2, -this.restart_button.h/2, this.restart_button.w, this.restart_button.h);
            ctx.restore();
            if (this.restart_button.hover || this.restart_button.isPressed) {
                ctx.save();
                let grad = ctx.createRadialGradient(centerX2, centerY2, 0, centerX2, centerY2, this.restart_button.w*0.5);
                grad.addColorStop(0, 'rgba(255,255,255,0.25)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.ellipse(centerX2, centerY2, this.restart_button.w*0.5, this.restart_button.h*0.3, 0, 0, 2*Math.PI);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            }
            // --- Кнопка home с анимацией ---
            let centerX3 = this.home_button.x + this.home_button.w/2;
            let centerY3 = home_button_y + this.home_button.h/2;
            ctx.save();
            ctx.translate(centerX3, centerY3);
            ctx.scale(pulse2, pulse2);
            ctx.drawImage(btnHomeImg, -this.home_button.w/2, -this.home_button.h/2, this.home_button.w, this.home_button.h);
            ctx.restore();
            if (this.home_button.hover || this.home_button.isPressed) {
                ctx.save();
                let grad = ctx.createRadialGradient(centerX3, centerY3, 0, centerX3, centerY3, this.home_button.w*0.5);
                grad.addColorStop(0, 'rgba(255,255,255,0.25)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.ellipse(centerX3, centerY3, this.home_button.w*0.5, this.home_button.h*0.3, 0, 0, 2*Math.PI);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            }
        }
    }
};

// === Универсальная функция shine и вспышки для кнопок ===
function drawButtonShine(button, ctx, y_override) {
    let t = performance.now() * 0.001;
    let glossX = button.x + button.w * (0.2 + 0.6 * ((Math.sin(t) + 1) / 2));
    let glossY = (y_override !== undefined ? y_override : button.y) + button.h * 0.18;
    let glossW = button.w * 0.6;
    let glossH = button.h * 0.38;
    let grad = ctx.createLinearGradient(glossX, glossY, glossX + glossW, glossY + glossH);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.16)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(glossX + glossW/2, glossY + glossH/2, glossW/2, glossH/2, 0, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalAlpha = 1;
    // Вспышка при нажатии
    if (button.isPressed && button.pressTime) {
        let dt = performance.now() - button.pressTime;
        if (dt < 160) {
            let pressAlpha = 0.32 * (1 - dt/160);
            ctx.globalAlpha = pressAlpha;
            ctx.beginPath();
            ctx.ellipse(button.x + button.w/2, (y_override !== undefined ? y_override : button.y) + button.h/2, button.w*0.45, button.h*0.35, 0, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// Главный экран
home = {
    logo: {spriteX: 552, spriteY: 233, spriteW: 384, spriteH: 87, x: 0, y: 0, w: 0, h: 0},
    animation: [
        {spriteX: 0, spriteY: 0, spriteW: 180, spriteH: 136},
        {spriteX: 0, spriteY: 174, spriteW: 180, spriteH: 136},
        {spriteX: 0, spriteY: 342, spriteW: 180, spriteH: 136}
    ],
    bird: {x: 0, y: 0, w: 0, h: 0},
    frame: 0,
    // === Для эффекта круглого прожектора ===
    spotlightPos: 0, // 0..1 по X
    spotlightYPos: 0.5, // 0..1 по Y (относительно логотипа)
    spotlightSpeed: 0.22, // базовая скорость по X
    spotlightYSpeed: 0, // текущая скорость по Y
    spotlightTargetY: 0.5, // целевая позиция по Y
    spotlightDir: 1, // направление по X
    spotlightTimer: 0, // для смены направления
    policeRedPos: 0, // 0..1 (слева направо)
    policeBluePos: 1, // 1..0 (справа налево)
    policeSpeed: 0.45, // скорость движения лучей
    logoAlpha: 0, // прозрачность логотипа
    logoFadeIn: true,
    logoBlinkTimer: 0,
    logoBlinkState: false,
    logoSpotlightNoiseSeed: 0,
    draw: function() {
        let bird = this.animation[this.frame];
        if(state.current == state.home) {
            ctx.save();
            let now = performance.now() * 0.001;
            const policeAlphaBoost = 1.15;
            // === Логотип без прозрачности и мигания ===
            ctx.globalAlpha = 1;
            ctx.drawImage(mainLogoImg, this.logo.x, this.logo.y, this.logo.w, this.logo.h);
            // Пульсация (мигание) яркости для огней
            let redPulse = 0.45 + 0.35 * Math.abs(Math.sin(now * 3.1)); // 0.45..0.8
            let bluePulse = 0.45 + 0.35 * Math.abs(Math.cos(now * 3.1 + 1.2));
            // === Эффект круглого прожектора с шумом и такой же прозрачностью, как у огней ===
            this.logoSpotlightNoiseSeed += window.lastDelta * 0.25;
            let noiseX = Math.sin(this.logoSpotlightNoiseSeed * 1.3 + Math.cos(this.logoSpotlightNoiseSeed * 0.7)) * 0.04;
            let noiseY = Math.cos(this.logoSpotlightNoiseSeed * 1.1 + Math.sin(this.logoSpotlightNoiseSeed * 0.9)) * 0.04;
            let spotX = this.logo.x + this.logo.w * (this.spotlightPos + noiseX);
            let spotY = this.logo.y + this.logo.h * (this.spotlightYPos + noiseY);
            // Радиус: исходный размер
            let radius = Math.max(this.logo.w, this.logo.h) * 0.137;
            // Берём среднее значение пульсации для белого света
            let whitePulse = (redPulse + bluePulse) / 2;
            // Менее яркий градиент для белого прожектора (на 30% меньше)
            let grad = ctx.createRadialGradient(spotX, spotY, radius * 0.08, spotX, spotY, radius);
            grad.addColorStop(0, `rgba(255,255,220,${(0.308 * policeAlphaBoost * whitePulse).toFixed(3)})`);
            grad.addColorStop(0.12, `rgba(255,255,220,${(0.182 * policeAlphaBoost * whitePulse).toFixed(3)})`);
            grad.addColorStop(0.25, `rgba(255,255,220,${(0.098 * policeAlphaBoost * whitePulse).toFixed(3)})`);
            grad.addColorStop(0.45, `rgba(255,255,220,${(0.042 * policeAlphaBoost * whitePulse).toFixed(3)})`);
            grad.addColorStop(0.7, `rgba(255,255,220,${(0.014 * policeAlphaBoost * whitePulse).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(255,255,220,0)');
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(spotX, spotY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = grad;
            ctx.fill();
            // === Эффект полицейских мигалок внутри логотипа, огни двигаются вместе и мигают ===
            // Огни движутся по синусоиде внутри логотипа
            let centerY = this.logo.y + this.logo.h / 2;
            let minX = this.logo.x + this.logo.w * 0.15;
            let maxX = this.logo.x + this.logo.w * 0.85;
            let travel = (Math.sin(now * 1.2) + 1) / 2; // 0..1
            let policeX = minX + (maxX - minX) * travel;
            let policeY = centerY + Math.sin(now * 2.1) * this.logo.h * 0.18;
            // Радиус для полицейских огней: исходный, как у прожектора
            let policeRadius = radius * (1.05 + 0.08*Math.sin(now*2.1));
            // Красный огонь (слева)
            let redX = policeX - this.logo.w * 0.08;
            let redY = policeY;
            // Синий огонь (справа)
            let blueX = policeX + this.logo.w * 0.08;
            let blueY = policeY;
            // Более плавные градиенты для красного и синего огней
            let redGrad = ctx.createRadialGradient(redX, redY, policeRadius * 0.1, redX, redY, policeRadius);
            redGrad.addColorStop(0, `rgba(255,40,40,${(0.308 * redPulse * policeAlphaBoost).toFixed(3)})`);
            redGrad.addColorStop(0.12, `rgba(255,40,40,${(0.182 * redPulse * policeAlphaBoost).toFixed(3)})`);
            redGrad.addColorStop(0.25, `rgba(255,40,40,${(0.098 * redPulse * policeAlphaBoost).toFixed(3)})`);
            redGrad.addColorStop(0.45, `rgba(255,40,40,${(0.042 * redPulse * policeAlphaBoost).toFixed(3)})`);
            redGrad.addColorStop(0.7, `rgba(255,40,40,${(0.014 * redPulse * policeAlphaBoost).toFixed(3)})`);
            redGrad.addColorStop(1, 'rgba(255,40,40,0)');
            let blueGrad = ctx.createRadialGradient(blueX, blueY, policeRadius * 0.1, blueX, blueY, policeRadius);
            blueGrad.addColorStop(0, `rgba(40,40,255,${(0.308 * bluePulse * policeAlphaBoost).toFixed(3)})`);
            blueGrad.addColorStop(0.12, `rgba(40,40,255,${(0.182 * bluePulse * policeAlphaBoost).toFixed(3)})`);
            blueGrad.addColorStop(0.25, `rgba(40,40,255,${(0.098 * bluePulse * policeAlphaBoost).toFixed(3)})`);
            blueGrad.addColorStop(0.45, `rgba(40,40,255,${(0.042 * bluePulse * policeAlphaBoost).toFixed(3)})`);
            blueGrad.addColorStop(0.7, `rgba(40,40,255,${(0.014 * bluePulse * policeAlphaBoost).toFixed(3)})`);
            blueGrad.addColorStop(1, 'rgba(40,40,255,0)');
            ctx.globalCompositeOperation = 'source-over';
            // Красный прожектор
            ctx.beginPath();
            ctx.arc(redX, redY, policeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = redGrad;
            ctx.fill();
            // Синий прожектор
            ctx.beginPath();
            ctx.arc(blueX, blueY, policeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = blueGrad;
            ctx.fill();
            ctx.restore();
            ctx.drawImage(mori_model_sprite, bird.spriteX, bird.spriteY, bird.spriteW, bird.spriteH, this.bird.x, this.bird.y, this.bird.w, this.bird.h);
        }
    },
    update: function() {
        if (state.current == state.home) {
            // Хаотичное движение прожектора
            this.spotlightPos += this.spotlightSpeed * this.spotlightDir * window.lastDelta;
            if (this.spotlightPos > 1) { this.spotlightPos = 1; this.spotlightDir = -1; }
            if (this.spotlightPos < 0) { this.spotlightPos = 0; this.spotlightDir = 1; }
            this.spotlightTimer += window.lastDelta;
            if (this.spotlightTimer > 1.2 + Math.random()*1.2) {
                if (Math.random() < 0.5) this.spotlightDir *= -1;
                this.spotlightTimer = 0;
                this.spotlightTargetY = 0.15 + 0.7 * Math.random();
            }
            let dy = this.spotlightTargetY - this.spotlightYPos;
            this.spotlightYPos += dy * 0.08 + (Math.random()-0.5)*0.01;
            if (this.spotlightYPos < 0.15) this.spotlightYPos = 0.15;
            if (this.spotlightYPos > 0.85) this.spotlightYPos = 0.85;
            // === Движение полицейских лучей ===
            this.policeRedPos += this.policeSpeed * window.lastDelta;
            this.policeBluePos -= this.policeSpeed * window.lastDelta;
            if (this.policeRedPos > 1.1) this.policeRedPos = -0.1;
            if (this.policeBluePos < -0.1) this.policeBluePos = 1.1;
        } else {
            this.spotlightPos = 0;
            this.spotlightYPos = 0.5;
            this.spotlightDir = 1;
            this.spotlightTargetY = 0.5;
            this.spotlightTimer = 0;
            this.policeRedPos = 0;
            this.policeBluePos = 1;
            this.logoAlpha = 0;
            this.logoFadeIn = true;
            this.logoBlinkTimer = 0;
            this.logoBlinkState = false;
        }
        this.period = isMobile ? 24 : 36;
        this.frame += frames % this.period == 0 ? 1 : 0;
        this.frame = this.frame % this.animation.length; 
    }
};

// Экран готовности
getReady = {
    get_ready: {spriteX: 552, spriteY: 321, spriteW: 349, spriteH: 87, x: 0, y: 0, w: 0, h: 0},
    tap: {spriteX: 0, spriteY: 0, spriteW: 155, spriteH: 196, x: 0, y: 0, w: 0, h: 0},

    draw: function() {
        if(state.current == state.getReady) {
            ctx.drawImage(getReadyImg, this.get_ready.x, this.get_ready.y, this.get_ready.w, this.get_ready.h);
            ctx.drawImage(sprite_sheet, this.tap.spriteX, this.tap.spriteY, this.tap.spriteW, this.tap.spriteH, this.tap.x, this.tap.y, this.tap.w, this.tap.h);
        }
    }
};

// Экран окончания игры
gameOver = {
    game_over: {spriteX: 553, spriteY: 410, spriteW: 376, spriteH: 75, x: 0, y: 0, w: 0, h: 0},
    scoreboard: {spriteX: 548, spriteY: 0, spriteW: 452, spriteH: 232, x: 0, y: 0, w: 0, h: 0},
    scoreSaved: false,

    draw: function() {
        if(state.current == state.gameOver) {
            ctx.drawImage(gameOverImg, this.game_over.x, this.game_over.y, this.game_over.w, this.game_over.h);
            // ctx.drawImage(sprite_sheet, this.scoreboard.spriteX, this.scoreboard.spriteY, this.scoreboard.spriteW, this.scoreboard.spriteH, this.scoreboard.x, this.scoreboard.y, this.scoreboard.w, this.scoreboard.h); // временно скрыто
        }
    }
};

// === Загрузка отдельного изображения для get ready ===
const getReadyImg = new Image();
getReadyImg.src = "img/separated/get_ready.png";

// === Загрузка отдельного изображения для game over ===
const gameOverImg = new Image();
gameOverImg.src = "img/separated/game_over.png";

// === Загрузка отдельных изображений для кнопок ===
const btnDayModeImg = new Image(); btnDayModeImg.src = "img/separated/buttons/day_mode.png";
const btnHomeImg = new Image(); btnHomeImg.src = "img/separated/buttons/home.png";
const btnNightModeImg = new Image(); btnNightModeImg.src = "img/separated/buttons/night_mode.png";
const btnOkImg = new Image(); btnOkImg.src = "img/separated/buttons/ok.png";
const btnPauseImg = new Image(); btnPauseImg.src = "img/separated/buttons/pause.png";
const btnPlayImg = new Image(); btnPlayImg.src = "img/separated/buttons/play.png";
const btnRestartImg = new Image(); btnRestartImg.src = "img/separated/buttons/restart.png";
const btnScoreImg = new Image(); btnScoreImg.src = "img/separated/buttons/score.png";
const btnSoundOffImg = new Image(); btnSoundOffImg.src = "img/separated/buttons/sound_off.png";
const btnShareImg = new Image(); btnShareImg.src = "img/separated/buttons/share.png";
const btnSoundOnImg = new Image(); btnSoundOnImg.src = "img/separated/buttons/sound_on.png";
const btnStartImg = new Image(); btnStartImg.src = "img/separated/buttons/start.png";

// === Загрузка отдельного изображения для логотипа ===
const mainLogoImg = new Image();
mainLogoImg.src = "img/separated/main_logo_text.png";

// === ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ДЛЯ МАСШТАБА ===
window.gameScale = 1;
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// Функция масштабирования canvas
canvasScale = function() {
    let screenWidth, screenHeight;
    
    if (tg && tg.viewportStableHeight) {
        screenWidth = tg.viewportStableHeight;
        screenHeight = tg.viewportStableHeight;
    } else {
        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
    }
    
    cvs.height = screenHeight;
    cvs.width = screenHeight * 0.72;

    // === ОБНОВЛЕНИЕ ГЛОБАЛЬНОГО МАСШТАБА ===
    window.gameScale = cvs.height / 800;
    console.log('=== ОТЛАДКА МАСШТАБА ===');
    console.log('Высота экрана:', cvs.height);
    console.log('Установленный gameScale:', window.gameScale);
    console.log('========================');
    // === КОНЕЦ ОБНОВЛЕНИЯ ===

    // BACKGROUND
    background.x = 0;
    background.y = foreground.y - background.h;
    background.w = cvs.width;
    background.h = background.w * 0.74;
    background.stars.y = background.y * 0.167;
    background.stars.h = cvs.height - background.h;

    // FOREGROUND
    foreground.x = 0;
    foreground.y = cvs.height * 0.861;
    foreground.w = cvs.width * 0.7;
    foreground.h = foreground.w * 0.46;
    foreground.dx = cvs.width * 0.63;

    // BIRD
    bird.x = cvs.width * 0.290;
    bird.y = cvs.height * 0.395;
    bird.w = cvs.width * 0.16;
    bird.h = cvs.height * 0.059;
    
    // ФИКСИРОВАННЫЕ ПАРАМЕТРЫ НЕ ЗАВИСЯТ ОТ РАЗМЕРА ОКНА
    bird.gravity = 500;
    bird.jump = 1500;
    bird.acceleration = 500;
    bird.enginePower = 1000;
    // Инициализируем базовую горизонтальную скорость для ускорения
    if (typeof baseHorizontalSpeed !== 'undefined') {
        baseHorizontalSpeed = 180;
        speedBoostMultiplier = 1.0;
        lastSpeedBoostScore = 0;
    }
    bird.maxSpeed = 1500;
    bird.minSpeed = -1500;
    bird.rotationSpeed = 0.06;
    bird.maxEngineCooldown = 2;
    bird.maxThrust = 1.0;
    bird.thrustDecay = 0.92;
    bird.autoFlightDelay = 45;
    bird.autoFlightPower = 500;
    bird.minEngineInterval = 2;
    bird.maxRotationInertia = 0.05;
    bird.wobbleSpeed = 0.08;
    bird.wobbleAmount = 2;        // Амплитуда покачивания
    
    bird.radius_x = bird.w * 0.4;
    bird.radius_y = bird.h * 0.4;

    // PIPES
    const pipesDrawW = Math.round(360 / 1.5) * 0.8 * 1.1;
    const pipesDrawH = Math.round(306 / 1.5) * 0.8 * 1.1;
    pipes.w = pipesDrawW * 0.8;
    pipes.h = pipesDrawH * 0.8;
    pipes.gap = 120;
    pipes.maxYPos = -(cvs.height * 0.350); // Оставляем зависимость для генерации препятствий
    pipes.dx = 180;                // было 120

    // HOME
    home.logo.x = cvs.width * 0.098;
    home.logo.y = cvs.height * 0.279;
    home.logo.w = cvs.width * 0.665;
    home.logo.h = cvs.height * 0.109; 
    home.logo.MAXY = cvs.height * 0.279 - home.logo.h/7;
    home.logo.MINY = cvs.height * 0.279 + home.logo.h/7;
    home.logo.dy = cvs.width * 0.0012;
    home.bird.x = cvs.width * 0.803;
    home.bird.y = cvs.height * 0.294;
    home.bird.w = cvs.width * 0.117;
    home.bird.h = cvs.height * 0.059;

    // GET READY
    getReady.get_ready.x = cvs.width * 0.197;
    getReady.get_ready.y = cvs.height * 0.206;
    getReady.get_ready.w = cvs.width * 0.602;
    getReady.get_ready.h = cvs.height * 0.109;  
    getReady.tap.x = cvs.width * 0.433;
    getReady.tap.y = cvs.height * 0.435;
    getReady.tap.w = cvs.width * 0.270;
    getReady.tap.h = cvs.height * 0.244;

    // GAME BUTTONS 
    gameButtons.x = cvs.width * 0.087;
    gameButtons.y = cvs.height * 0.045;
    gameButtons.y_pressed = cvs.height * 0.049;
    gameButtons.w = cvs.width * 0.088;
    gameButtons.h = cvs.height * 0.069;
    gameButtons.night_button.x = cvs.width * 0.189;
    gameButtons.start_button.x = cvs.width * 0.359;
    gameButtons.start_button.y = cvs.height * 0.759;
    gameButtons.start_button.y_pressed = cvs.height * 0.763;
    gameButtons.start_button.w = cvs.width * 0.276;
    gameButtons.start_button.h = cvs.height * 0.068;
    gameButtons.restart_button.x = cvs.width * 0.147;
    gameButtons.restart_button.y = cvs.height * 0.759;
    gameButtons.restart_button.y_pressed = cvs.height * 0.763;
    gameButtons.restart_button.w = cvs.width * 0.276;
    gameButtons.restart_button.h = cvs.height * 0.068;
    gameButtons.home_button.x = cvs.width * 0.576;
    gameButtons.home_button.y = cvs.height * 0.759;
    gameButtons.home_button.y_pressed = cvs.height * 0.763;
    gameButtons.home_button.w = cvs.width * 0.276;
    gameButtons.home_button.h = cvs.height * 0.068;

    // GAME OVER
    gameOver.game_over.x = cvs.width * 0.182;
    gameOver.game_over.y = cvs.height * 0.243;
    gameOver.game_over.w = cvs.width * 0.645;
    gameOver.game_over.h = cvs.height * 0.095; 
    gameOver.scoreboard.x = cvs.width * 0.107;
    gameOver.scoreboard.y = cvs.height * 0.355;
    gameOver.scoreboard.w = cvs.width * 0.782;
    gameOver.scoreboard.h = cvs.height * 0.289;

    // SCORE
    score.new_best.x = cvs.width * 0.577;
    score.new_best.y = cvs.height * 0.500;
    score.new_best.w = cvs.width * 0.112;
    score.new_best.h = cvs.height * 0.035;
    score.w = cvs.width * 0.048;
    score.h = cvs.height * 0.046;
    score.one_w = cvs.width * 0.032;
    score.x = cvs.width * 0.476;
    score.y = cvs.height * 0.045;
    score.score.x = cvs.width * 0.769;
    score.score.y = cvs.height * 0.441;
    score.best.x = cvs.width * 0.769;
    score.best.y = cvs.height * 0.545;
    score.space = cvs.width * 0.016;
    
    // === РАЗМЕРЫ ЗДАНИЙ И МОНЕТ ТЕПЕРЬ ВЫЧИСЛЯЮТСЯ ДИНАМИЧЕСКИ ===
    // см. game-objects.js - используются геттеры для адаптивного масштабирования
} 

// === Обработчики hover для всех главных кнопок ===
cvs.addEventListener('mousemove', function(event) {
    const { x, y } = getCanvasRelativeCoords(event);
    if (state.current === state.home) {
        gameButtons.start_button.hover = (
            x >= gameButtons.start_button.x && x <= gameButtons.start_button.x + gameButtons.start_button.w &&
            y >= gameButtons.start_button.y && y <= gameButtons.start_button.y + gameButtons.start_button.h
        );
        gameButtons.restart_button.hover = false;
        gameButtons.home_button.hover = false;
    } else if (state.current === state.gameOver) {
        gameButtons.start_button.hover = false;
        gameButtons.restart_button.hover = (
            x >= gameButtons.restart_button.x && x <= gameButtons.restart_button.x + gameButtons.restart_button.w &&
            y >= gameButtons.restart_button.y && y <= gameButtons.restart_button.y + gameButtons.restart_button.h
        );
        gameButtons.home_button.hover = (
            x >= gameButtons.home_button.x && x <= gameButtons.home_button.x + gameButtons.home_button.w &&
            y >= gameButtons.home_button.y && y <= gameButtons.home_button.y + gameButtons.home_button.h
        );
    } else {
        gameButtons.start_button.hover = false;
        gameButtons.restart_button.hover = false;
        gameButtons.home_button.hover = false;
    }
});
cvs.addEventListener('mouseleave', function() {
    gameButtons.start_button.hover = false;
    gameButtons.restart_button.hover = false;
    gameButtons.home_button.hover = false;
}); 