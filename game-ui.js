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
    }
};

// Кнопки игры
gameButtons = {
    mute_button: {spriteX: 171, spriteY: 63, spriteW: 55, spriteH: 62},
    unmute_button: {spriteX: 171, spriteY: 0, spriteW: 55, spriteH: 62},
    start_button: {spriteX: 227, spriteY: 0, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0, y_pressed: 0, isPressed: false},
    pause_button: {spriteX: 280, spriteY: 114, spriteW: 52, spriteH: 56},
    resume_button: {spriteX: 227, spriteY: 114, spriteW: 52, spriteH: 56},
    home_button: {spriteX: 388, spriteY: 171, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0, y_pressed: 0, isPressed: false},
    restart_button: {spriteX: 227, spriteY: 57, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0, y_pressed: 0, isPressed: false},
    night_button: {spriteX: 280, spriteY: 171, spriteW: 56, spriteH: 60, x: 0, isPressed: false},
    day_button: {spriteX: 223, spriteY: 171, spriteW: 56, spriteH: 60, x: 0, isPressed: false},
    x: 0, y: 0, w: 0, h: 0, y_pressed: 0, isPressed: false,

    draw: function() {
        let button_y = this.isPressed ? this.y_pressed : this.y;
        let night_button_y = this.night_button.isPressed ? this.y_pressed : this.y;
        let start_button_y = this.start_button.isPressed ? this.start_button.y_pressed : this.start_button.y;
        let restart_button_y = this.restart_button.isPressed ? this.restart_button.y_pressed : this.restart_button.y;
        let home_button_y = this.home_button.isPressed ? this.home_button.y_pressed : this.home_button.y;

        if(state.current == state.home) {
            if(!mute) {
                ctx.drawImage(sprite_sheet, this.unmute_button.spriteX, this.unmute_button.spriteY, this.unmute_button.spriteW, this.unmute_button.spriteH, this.x, button_y, this.w, this.h);
            } else {
                ctx.drawImage(sprite_sheet, this.mute_button.spriteX, this.mute_button.spriteY, this.mute_button.spriteW, this.mute_button.spriteH, this.x, button_y, this.w, this.h); 
            } 

            if(!night) {
                ctx.drawImage(sprite_sheet, this.day_button.spriteX, this.day_button.spriteY, this.day_button.spriteW, this.day_button.spriteH, this.night_button.x, night_button_y, this.w, this.h);
            } else {
                ctx.drawImage(sprite_sheet, this.night_button.spriteX, this.night_button.spriteY, this.night_button.spriteW, this.night_button.spriteH, this.night_button.x, night_button_y, this.w, this.h);
            }  
                       
            ctx.drawImage(sprite_sheet, this.start_button.spriteX, this.start_button.spriteY, this.start_button.spriteW, this.start_button.spriteH, this.start_button.x, start_button_y, this.start_button.w, this.start_button.h);
        } else if(state.current == state.game) {
            if(!gamePaused) {
                ctx.drawImage(sprite_sheet, this.pause_button.spriteX, this.pause_button.spriteY, this.pause_button.spriteW, this.pause_button.spriteH, this.x, button_y, this.w, this.h);
            } else {
                ctx.drawImage(sprite_sheet, this.resume_button.spriteX, this.resume_button.spriteY, this.resume_button.spriteW, this.resume_button.spriteH, this.x, button_y, this.w, this.h); 
            }
        } else if(state.current == state.gameOver) {
            ctx.drawImage(sprite_sheet, this.restart_button.spriteX, this.restart_button.spriteY, this.restart_button.spriteW, this.restart_button.spriteH, this.restart_button.x, restart_button_y, this.restart_button.w, this.restart_button.h);
            ctx.drawImage(sprite_sheet, this.home_button.spriteX, this.home_button.spriteY, this.home_button.spriteW, this.home_button.spriteH, this.home_button.x, home_button_y, this.home_button.w, this.home_button.h);
        }
    }
};

// Главный экран
home = {
    logo: {spriteX: 552, spriteY: 233, spriteW: 384, spriteH: 87, x: 0, y: 0, w: 0, h: 0, MAXY: 0, MINY: 0, dy: 0},
    animation: [
        {spriteX: 0, spriteY: 0, spriteW: 180, spriteH: 136},
        {spriteX: 0, spriteY: 174, spriteW: 180, spriteH: 136},
        {spriteX: 0, spriteY: 342, spriteW: 180, spriteH: 136}
    ],
    bird: {x: 0, y: 0, w: 0, h: 0},
    studio_name: {spriteX: 172, spriteY: 284, spriteW: 380, spriteH: 28, x: 0, y: 0, w: 0, h: 0},
    frame: 0, logoGoUp: true,

    draw: function() {
        let bird = this.animation[this.frame];

        if(state.current == state.home) {
            ctx.drawImage(sprite_sheet, this.logo.spriteX, this.logo.spriteY, this.logo.spriteW, this.logo.spriteH, this.logo.x, this.logo.y, this.logo.w, this.logo.h);
            ctx.drawImage(mori_model_sprite, bird.spriteX, bird.spriteY, bird.spriteW, bird.spriteH, this.bird.x, this.bird.y, this.bird.w, this.bird.h);
            ctx.drawImage(sprite_sheet, this.studio_name.spriteX, this.studio_name.spriteY, this.studio_name.spriteW, this.studio_name.spriteH, this.studio_name.x, this.studio_name.y, this.studio_name.w, this.studio_name.h);
        }
    },

    update: function(deltaTime) {
        if (state.current == state.home) {
            let move = this.logo.dy * (deltaTime ? deltaTime * 60 : 1);
            if (this.logoGoUp) {
                this.logo.y -= move;
                this.bird.y -= move;
                if(this.logo.y <= this.logo.MAXY) {
                    this.logoGoUp = false;
                }
            }
            if (!this.logoGoUp) {
                this.logo.y += move;
                this.bird.y += move;
                if(this.logo.y >= this.logo.MINY) {
                    this.logoGoUp = true;
                }
            }
        }

        this.period = isMobile ? 4 : 6;
        this._frameTimer = this._frameTimer || 0;
        this._frameTimer += (deltaTime ? deltaTime * 60 : 1);
        if (this._frameTimer >= this.period) {
            this.frame = (this.frame + 1) % this.animation.length;
            this._frameTimer = 0;
        }
    }
};

// Экран готовности
getReady = {
    get_ready: {spriteX: 552, spriteY: 321, spriteW: 349, spriteH: 87, x: 0, y: 0, w: 0, h: 0},
    tap: {spriteX: 0, spriteY: 0, spriteW: 155, spriteH: 196, x: 0, y: 0, w: 0, h: 0},

    draw: function() {
        if(state.current == state.getReady) {
            ctx.drawImage(sprite_sheet, this.get_ready.spriteX, this.get_ready.spriteY, this.get_ready.spriteW, this.get_ready.spriteH, this.get_ready.x, this.get_ready.y, this.get_ready.w, this.get_ready.h);
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
            ctx.drawImage(sprite_sheet, this.game_over.spriteX, this.game_over.spriteY, this.game_over.spriteW, this.game_over.spriteH, this.game_over.x, this.game_over.y, this.game_over.w, this.game_over.h);
            ctx.drawImage(sprite_sheet, this.scoreboard.spriteX, this.scoreboard.spriteY, this.scoreboard.spriteW, this.scoreboard.spriteH, this.scoreboard.x, this.scoreboard.y, this.scoreboard.w, this.scoreboard.h);
        }
    }
};

// Функция масштабирования canvas
canvasScale = function() {
    let screenWidth, screenHeight;
    // Для Telegram Mini App используем viewport, если доступен
    if (tg && tg.viewportStableHeight) {
        screenHeight = tg.viewportStableHeight;
        screenWidth = tg.viewportStableWidth || screenHeight * 9/16;
    } else {
        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
    }
    // Соотношение сторон 9:16 (портрет)
    let aspect = 9/16;
    if (screenWidth / screenHeight > aspect) {
        // Слишком широкий экран — ограничиваем по высоте
        cvs.height = screenHeight;
        cvs.width = Math.floor(screenHeight * aspect);
    } else {
        // Слишком высокий экран — ограничиваем по ширине
        cvs.width = screenWidth;
        cvs.height = Math.floor(screenWidth / aspect);
    }

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
    foreground.dx = cvs.width * 0.007;

    // BIRD
    bird.x = cvs.width * 0.290;
    bird.y = cvs.height * 0.395;
    bird.w = cvs.width * 0.16;
    bird.h = cvs.height * 0.059;
    
    // ФИКСИРОВАННЫЕ ПАРАМЕТРЫ НЕ ЗАВИСЯТ ОТ РАЗМЕРА ОКНА
    bird.gravity = 0.3;           // Гравитация
    bird.jump = 5.5;              // Сила прыжка
    bird.acceleration = 0.2;      // Ускорение падения
    bird.enginePower = 0.4;       // Сила реактивного двигателя
    bird.maxSpeed = 6;            // Максимальная скорость падения
    bird.minSpeed = -5;           // Минимальная скорость (максимальная скорость подъема)
    bird.rotationSpeed = 0.06;
    bird.maxEngineCooldown = 2;
    bird.maxThrust = 1.0;
    bird.thrustDecay = 0.92;
    bird.autoFlightDelay = 45;
    bird.autoFlightPower = 0.1;   // Сила автополета
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
    pipes.dx = 2;                // Скорость движения препятствий

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
    home.studio_name.x = cvs.width * 0.171;
    home.studio_name.y = cvs.height * 0.897;
    home.studio_name.w = cvs.width * 0.659;
    home.studio_name.h = cvs.height * 0.034; 

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
} 