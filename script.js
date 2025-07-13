// SELECT CANVAS
const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");

// TELEGRAM INTEGRATION
let tg = null;
let currentUser = null;

// Инициализация Telegram
function initTelegram() {
    // Ждем загрузки Telegram SDK
    setTimeout(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            currentUser = tg.initDataUnsafe?.user;
            
            console.log('Telegram Web App initialized from script.js');
            console.log('User:', currentUser);
            
            // Настраиваем кнопки Telegram
            setupTelegramButtons();
            
            // Применяем тему Telegram
            applyTelegramTheme();
        } else {
            console.log('Telegram Web App not available - running in browser mode');
        }
    }, 200); // Увеличиваем задержку
}

// Настройка кнопок Telegram
function setupTelegramButtons() {
    if (!tg) return;
    
    try {
        // Показываем главную кнопку на домашнем экране
        if (state.current === state.home) {
            tg.MainButton.setText('🎮 ИГРАТЬ');
            tg.MainButton.show();
            tg.MainButton.onClick(() => {
                state.current = state.getReady;
                tg.MainButton.hide();
            });
        }
        
        // Настраиваем кнопку "Назад"
        tg.BackButton.onClick(() => {
            if (state.current === state.gameOver) {
                try {
                    if (tg.showConfirm && typeof tg.showConfirm === 'function' && tg.version && parseFloat(tg.version) >= 6.1) {
                        tg.showConfirm(
                            "Поделиться результатом?",
                            (confirmed) => {
                                if (confirmed) {
                                    tg.shareMessage(`🎮 Я набрал ${score.game_score} очков в Flappy Bird! Попробуй побить мой рекорд!`);
                                }
                            }
                        );
                    } else {
                        tg.shareMessage(`🎮 Я набрал ${score.game_score} очков в Flappy Bird! Попробуй побить мой рекорд!`);
                    }
                } catch (e) {
                    // Если всё равно ошибка — просто делимся результатом
                    tg.shareMessage(`🎮 Я набрал ${score.game_score} очков в Flappy Bird! Попробуй побить мой рекорд!`);
                }
            } else {
                state.current = state.home;
                tg.BackButton.hide();
            }
        });
    } catch (error) {
        console.error('Error setting up Telegram buttons:', error);
    }
}

// Применение темы Telegram
function applyTelegramTheme() {
    if (tg && tg.themeParams) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
    }
}

// API для работы с результатами
const GameAPI = {
    async saveScore(score) {
        if (!currentUser) {
            console.log('No user data available');
            return;
        }
        
        try {
            // Здесь можно добавить сохранение на сервер
            console.log(`Score saved: ${score} for user ${currentUser.id}`);
            
            // Показываем уведомление о результате
            if (tg) {
                tg.showAlert(`🎯 Ваш результат: ${score} очков!`);
            }
            
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    },
    
    showNewRecord() {
        if (tg && tg.showAlert && typeof tg.showAlert === 'function' && tg.version && parseFloat(tg.version) >= 6.1) {
            tg.showAlert('🎉 Новый рекорд! Поздравляем!');
        } else {
            alert('🎉 Новый рекорд! Поздравляем!');
        }
    },
    
    showAchievement(message) {
        if (tg && tg.showAlert && typeof tg.showAlert === 'function' && tg.version && parseFloat(tg.version) >= 6.1) {
            tg.showAlert(message);
        } else {
            alert(message); // или просто return;
        }
    }
};

// GAME VARIABLES AND CONSTANTS
let frames = 0;
let birdFlapped = false;
let gamePaused = false;
let pPressed = false;
let nWasPressed = false;
let mouseDown = false;
let mute = false;
let night = false;
const DEGREE = Math.PI/180;

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

// GAME STATES
const state = 
{
    current  : 0,
    home     : 0,
    getReady : 1,
    game     : 2,
    gameOver : 3
}

// Универсальная функция для получения координат относительно canvas
function getCanvasRelativeCoords(event) {
    const rect = cvs.getBoundingClientRect();
    let x, y;
    if (event.touches && event.touches.length > 0) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
    } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    }
    // Корректируем на случай, если canvas масштабирован
    x *= cvs.width / rect.width;
    y *= cvs.height / rect.height;
    return { x, y };
}

// CONTROL THE GAME
// Control when the player clicks
cvs.addEventListener("click", function(event) 
{ 
    const { x: clickX, y: clickY } = getCanvasRelativeCoords(event);

    switch (state.current) 
    {
        case state.home:
            // Mute or Unmute button
            if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                mute = !mute;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
            }
            // Night or Day button
            else if (clickX >= gameButtons.night_button.x && clickX <= gameButtons.night_button.x + gameButtons.w &&
                     clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                night = !night;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
            }  
            // Start button
            else if(clickX >= gameButtons.start_button.x && clickX <= gameButtons.start_button.x + gameButtons.start_button.w &&
                    clickY >= gameButtons.start_button.y && clickY <= gameButtons.start_button.y + gameButtons.start_button.h)
            {
                state.current = state.getReady;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
                
                // Скрываем кнопку Telegram при начале игры
                if (tg) {
                    tg.MainButton.hide();
                }
            }         
            break;
        case state.getReady:
            bird.flap();
            if(!mute)
            {
                FLAP.play();
            }
            birdFlapped = true;            
            state.current = state.game;
            
            // Скрываем кнопку Telegram при начале игры
            if (tg) {
                tg.MainButton.hide();
            }
            break;
        case state.game:
            // Pause or Resume button
            if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                gamePaused = !gamePaused;
            }
            else if(!gamePaused)
            {
                bird.flap();
                if(!mute)
                {
                    FLAP.currentTime = 0;
                    FLAP.play();
                }
            }
            break;
        case state.gameOver:
            // Restart button
            if(clickX >= gameButtons.restart_button.x && clickX <= gameButtons.restart_button.x + gameButtons.restart_button.w &&
               clickY >= gameButtons.restart_button.y && clickY <= gameButtons.restart_button.y + gameButtons.restart_button.h)
            {
                pipes.pipesReset();
                bird.speedReset();
                score.scoreReset();
                gameButtons.restart_button.isPressed = false;
                gameOver.scoreSaved = false; // Сбрасываем флаг сохранения
                state.current = state.getReady;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
                // Скрываем кнопки Telegram, если поддерживаются
                if (tg && tg.MainButton && typeof tg.MainButton.hide === 'function') {
                    tg.MainButton.hide();
                }
                if (tg && tg.BackButton && tg.version && parseFloat(tg.version) >= 6.1 && typeof tg.BackButton.hide === 'function') {
                    tg.BackButton.hide();
                }
            }
            // Home button
            else if(clickX >= gameButtons.home_button.x && clickX <= gameButtons.home_button.x + gameButtons.home_button.w &&
                    clickY >= gameButtons.home_button.y && clickY <= gameButtons.home_button.y + gameButtons.home_button.h)
            {
                pipes.pipesReset();
                bird.speedReset();
                score.scoreReset();
                gameButtons.home_button.isPressed = false;
                state.current = state.home;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
                // Показываем главную кнопку Telegram, если поддерживается
                if (tg && tg.MainButton && typeof tg.MainButton.setText === 'function') {
                    tg.MainButton.setText('🎮 ИГРАТЬ');
                    tg.MainButton.show();
                }
                if (tg && tg.BackButton && tg.version && parseFloat(tg.version) >= 6.1 && typeof tg.BackButton.hide === 'function') {
                    tg.BackButton.hide();
                }
            }
            break;
    }        
});

// Добавляем обработку touch событий для мобильных устройств
cvs.addEventListener("touchstart", function(event) 
{ 
    event.preventDefault(); // Предотвращаем зум
    const { x: clickX, y: clickY } = getCanvasRelativeCoords(event);

    switch (state.current) 
    {
        case state.home:
            // Mute or Unmute button
            if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                mute = !mute;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
            }
            // Night or Day button
            else if (clickX >= gameButtons.night_button.x && clickX <= gameButtons.night_button.x + gameButtons.w &&
                     clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                night = !night;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
            }  
            // Start button
            else if(clickX >= gameButtons.start_button.x && clickX <= gameButtons.start_button.x + gameButtons.start_button.w &&
                    clickY >= gameButtons.start_button.y && clickY <= gameButtons.start_button.y + gameButtons.start_button.h)
            {
                state.current = state.getReady;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
                
                // Скрываем кнопку Telegram при начале игры
                if (tg) {
                    tg.MainButton.hide();
                }
            }         
            break;
        case state.getReady:
            bird.flap();
            if(!mute)
            {
                FLAP.play();
            }
            birdFlapped = true;            
            state.current = state.game;
            
            // Скрываем кнопку Telegram при начале игры
            if (tg) {
                tg.MainButton.hide();
            }
            break;
        case state.game:
            // Pause or Resume button
            if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                gamePaused = !gamePaused;
            }
            else if(!gamePaused)
            {
                bird.flap();
                if(!mute)
                {
                    FLAP.currentTime = 0;
                    FLAP.play();
                }
            }
            break;
        case state.gameOver:
            // Restart button
            if(clickX >= gameButtons.restart_button.x && clickX <= gameButtons.restart_button.x + gameButtons.restart_button.w &&
               clickY >= gameButtons.restart_button.y && clickY <= gameButtons.restart_button.y + gameButtons.restart_button.h)
            {
                pipes.pipesReset();
                bird.speedReset();
                score.scoreReset();
                gameButtons.restart_button.isPressed = false;
                gameOver.scoreSaved = false; // Сбрасываем флаг сохранения
                state.current = state.getReady;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
                
                // Скрываем кнопки Telegram
                if (tg) {
                    tg.MainButton.hide();
                    tg.BackButton.hide();
                }
            }
            // Home button
            else if(clickX >= gameButtons.home_button.x && clickX <= gameButtons.home_button.x + gameButtons.home_button.w &&
                    clickY >= gameButtons.home_button.y && clickY <= gameButtons.home_button.y + gameButtons.home_button.h)
            {
                pipes.pipesReset();
                bird.speedReset();
                score.scoreReset();
                gameButtons.home_button.isPressed = false;
                state.current = state.home;
                if(!mute)
                {
                    SWOOSH.currentTime = 0;
                    SWOOSH.play();
                }
                
                // Показываем главную кнопку Telegram
                if (tg) {
                    tg.MainButton.setText('🎮 ИГРАТЬ');
                    tg.MainButton.show();
                    tg.BackButton.hide();
                }
            }
            break;
    }        
});

// Control when the player presses a key
document.addEventListener("keydown", function(event) 
{ 
    if (event.key === " ") 
    {
        switch (state.current) 
        {
            case state.getReady:                
                bird.flap();
                if(!mute)
                {
                    FLAP.play();
                }
                birdFlapped = true;
                state.current = state.game;
                break;
            case state.game:
                if (!birdFlapped && !gamePaused) 
                {
                    bird.flap();
                    if(!mute)
                    {
                        FLAP.currentTime = 0;
                        FLAP.play();
                    }
                    birdFlapped = true;
                }
                break;
        } 
    }
    else if (event.key === "p" || event.key === "P") 
    {
        if (state.current == state.game && !pPressed) 
        {
            gamePaused = !gamePaused;
            gameButtons.isPressed = true;
            pPressed = true;
        }
    } 
    else if (event.key === "n" || event.key === "N") 
    {
        document.body.style.backgroundColor = nWasPressed ?  "#FFF" : "#123";
    }         
});

// Control when the player stops pressing a key
document.addEventListener("keyup", function(event) 
{ 
    if (event.key === " " && state.current == state.game)
    {
        birdFlapped = false;
    } 
    else if (event.key === "p" || event.key === "P" && state.current == state.game)
    {
        gameButtons.isPressed = false;
        pPressed = false;  
    }  
    else if (event.key === "n" || event.key === "N") 
    {
        nWasPressed = !nWasPressed;
        }        
});

// Добавляем обработку touchmove и touchend для мобильных устройств
cvs.addEventListener("touchmove", function(event) 
{ 
    event.preventDefault(); // Предотвращаем скролл
});

cvs.addEventListener("touchend", function(event) 
{ 
    event.preventDefault(); // Предотвращаем дополнительные события
});

// Control when the player clicks the left mouse button
cvs.addEventListener("mousedown", function(event) 
{
    const { x: clickX, y: clickY } = getCanvasRelativeCoords(event);

    switch (state.current) 
    {
        case state.home: 
            mouseDown = true;
            // Mute or Unmute button
            if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                // If player is clicking on Mute or Unmute button
                gameButtons.isPressed = true;
            } 
            // Night or Day button
            else if (clickX >= gameButtons.night_button.x && clickX <= gameButtons.night_button.x + gameButtons.w &&
                     clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                // If player is clicking on Night or Day button
                gameButtons.night_button.isPressed = true;
            } 
            // Start button
            else if(clickX >= gameButtons.start_button.x && clickX <= gameButtons.start_button.x + gameButtons.start_button.w &&
                    clickY >= gameButtons.start_button.y && clickY <= gameButtons.start_button.y + gameButtons.start_button.h)
            {
                // If player is clicking on Start button
                gameButtons.start_button.isPressed = true;
            } 
            break;
        case state.game:
            mouseDown = true;
            // Pause or Resume button
            if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                // If player is clicking on Pause or Resume button
                gameButtons.isPressed = true;
            }
            break;
        case state.gameOver:
            mouseDown = true;
            // Restart button
            if(clickX >= gameButtons.restart_button.x && clickX <= gameButtons.restart_button.x + gameButtons.restart_button.w &&
               clickY >= gameButtons.restart_button.y && clickY <= gameButtons.restart_button.y + gameButtons.restart_button.h)
            {
                // If player is clicking on Restart Button
                gameButtons.restart_button.isPressed = true;
            }
            // Home button
            else if(clickX >= gameButtons.home_button.x && clickX <= gameButtons.home_button.x + gameButtons.home_button.w &&
                    clickY >= gameButtons.home_button.y && clickY <= gameButtons.home_button.y + gameButtons.home_button.h)
            {
                // If player is clicking on Home Button
                gameButtons.home_button.isPressed = true;
            }
            break;
    }
});

// Control when the player stops clicking the left mouse button
cvs.addEventListener("mouseup", function(event) 
{
    const { x: clickX, y: clickY } = getCanvasRelativeCoords(event);

    switch (state.current) 
    {
        case state.home: 
            mouseDown = false;
            // Mute or Unmute button
            if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                // If player stops clicking on Mute or Unmute button
                gameButtons.isPressed = false;
            }  
            // Night or Day button
            else if (clickX >= gameButtons.night_button.x && clickX <= gameButtons.night_button.x + gameButtons.w &&
                     clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                // If player stops clicking on Night or Day button
                gameButtons.night_button.isPressed = false;
            } 
            // Start button
            else if(clickX >= gameButtons.start_button.x && clickX <= gameButtons.start_button.x + gameButtons.start_button.w &&
                    clickY >= gameButtons.start_button.y && clickY <= gameButtons.start_button.y + gameButtons.start_button.h)
            {
                // If player stops clicking on Home button
                gameButtons.start_button.isPressed = false;
            }
            break;
        case state.game:
            mouseDown = false;
            // Pause or Resume button
            if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
            {
                // If players stops clicking on Pause or Resume button
                gameButtons.isPressed = false;
            }
            break;
        case state.gameOver:
            mouseDown = false;
            // Restart button
            if(clickX >= gameButtons.restart_button.x && clickX <= gameButtons.restart_button.x + gameButtons.restart_button.w &&
               clickY >= gameButtons.restart_button.y && clickY <= gameButtons.restart_button.y + gameButtons.restart_button.h)
            {
                // If player stops clicking on Restart button
                gameButtons.restart_button.isPressed = false;
            }
            // Home button
            else if(clickX >= gameButtons.home_button.x && clickX <= gameButtons.home_button.x + gameButtons.home_button.w &&
                    clickY >= gameButtons.home_button.y && clickY <= gameButtons.home_button.y + gameButtons.home_button.h)
            {
                // If player stops clicking on Home button
                gameButtons.home_button.isPressed = false;
            }
            break;
    }
});

// Control when the player moves the mouse away from the buttons
cvs.addEventListener("mousemove", function(event) 
{
    const { x: clickX, y: clickY } = getCanvasRelativeCoords(event);

    switch (state.current) 
    {
        case state.home:
            if(mouseDown)
            {
                // Mute or Unmute button
                if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                    clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
                {
                    // If player is clicking and goes to Mute or Unmute button
                    gameButtons.isPressed = true;
                }  
                else
                {
                    // If player is clicking and goes away from Mute or Unmute button
                    gameButtons.isPressed = false;

                }
                // Night or Day button
                if (clickX >= gameButtons.night_button.x && clickX <= gameButtons.night_button.x + gameButtons.w &&
                    clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
                {
                    // If player is clicking and goes to Night or Day button
                    gameButtons.night_button.isPressed = true;
                } 
                else
                {
                    // If player is clicking and goes away from Night or Day button
                    gameButtons.night_button.isPressed = false;

                }
                // Start button
                if(clickX >= gameButtons.start_button.x && clickX <= gameButtons.start_button.x + gameButtons.start_button.w &&
                   clickY >= gameButtons.start_button.y && clickY <= gameButtons.start_button.y + gameButtons.start_button.h)
                {
                    // If player is clicking and goes to Start button
                    gameButtons.start_button.isPressed = true;
                }
                else
                {
                    // If player is clicking and goes away from Start button
                    gameButtons.start_button.isPressed = false;
                }
            }
            break;
        case state.game:
            if(mouseDown)
            {
                // Pause or Resume button
                if (clickX >= gameButtons.x && clickX <= gameButtons.x + gameButtons.w &&
                    clickY >= gameButtons.y && clickY <= gameButtons.y + gameButtons.h) 
                {
                    // If player is clicking and goes to Pause or Resume button
                    gameButtons.isPressed = true;
                }
                else
                {
                    // If players is clicking and goes away from Pause or Resume button
                    gameButtons.isPressed = false;
                }
            }
            break;
        case state.gameOver:
            // Restart button
            if(mouseDown)
            {
                if(clickX >= gameButtons.restart_button.x && clickX <= gameButtons.restart_button.x + gameButtons.restart_button.w &&
                   clickY >= gameButtons.restart_button.y && clickY <= gameButtons.restart_button.y + gameButtons.restart_button.h)
                {
                    // If player is clicking and goes to Restart button
                    gameButtons.restart_button.isPressed = true;
                }
                else
                {
                    // If player is clicking and goes away from Restart button
                    gameButtons.restart_button.isPressed = false;
                }
            }
            // Home button
            if(mouseDown)
            {
                if(clickX >= gameButtons.home_button.x && clickX <= gameButtons.home_button.x + gameButtons.home_button.w &&
                   clickY >= gameButtons.home_button.y && clickY <= gameButtons.home_button.y + gameButtons.home_button.h)
                {
                    // If player is clicking and goes to Home button
                    gameButtons.home_button.isPressed = true;
                }
                else
                {
                    // If player is clicking and goes away from Home button
                    gameButtons.home_button.isPressed = false;
                }
            }
            break;
    }
});

// BACKGROUND
const background = 
{
    day_spriteX   : 0,
    night_spriteX : 1211,
    spriteY : 392,
    spriteW : 552,
    spriteH : 408,
    x : 0,
    y : 0,
    w : 0,
    h : 0,

    stars : 
    {
        spriteX : 1211,
        spriteY : 0,
        spriteW : 552,
        spriteH : 392,
        y: 0,
        h : 0
    },

    draw : function() 
    {
        let spriteX = night ? this.night_spriteX : this.day_spriteX;

        ctx.drawImage(
                        sprite_sheet, 
                        spriteX, this.spriteY, 
                        this.spriteW, this.spriteH, 
                        this.x, this.y, 
                        this.w, this.h
                     );
        if(night)
        {
            ctx.drawImage(
                            sprite_sheet, 
                            this.stars.spriteX, this.stars.spriteY, 
                            this.stars.spriteW, this.stars.spriteH, 
                            this.x, this.stars.y, 
                            this.w, this.stars.h
                         );
        }
    }
}

// FOREGROUND
const foreground = 
{
    spriteX : 553,
    spriteY : 576,
    spriteW : 447,
    spriteH : 224,
    x : 0,
    y : 0,
    w : 0,
    h : 0,

    dx : 0,

    draw : function() 
    {
        // Drawing 2 foregroung images because the sprite's width is lower than canvas width
        ctx.drawImage(
                        sprite_sheet, 
                        this.spriteX, this.spriteY, 
                        this.spriteW, this.spriteH, 
                        this.x, this.y, 
                        this.w, this.h
                     );
        ctx.drawImage(
                        sprite_sheet, 
                        this.spriteX, this.spriteY, 
                        this.spriteW, this.spriteH, 
                        (this.x + this.w)-0.7, this.y, 
                        this.w, this.h
                     );
    },

    update : function() 
    {
        if(state.current != state.gameOver) 
        {
            // Keeps decrementing x by dx until the foreground be moved by its width / 2
            this.x = (this.x - this.dx) % (this.w/2);
        }
    }
}

// BIRD
const bird = 
{
    animation : 
    [
        {spriteX: 0, spriteY: 0, spriteW: 180, spriteH: 136},
        {spriteX: 0, spriteY: 174, spriteW: 180, spriteH: 136},
        {spriteX: 0, spriteY: 342, spriteW: 180, spriteH: 136}
    ],
    x : 0, 
    y : 0, 
    w : 0, 
    h : 0,

    frame    : 0,
    gravity  : 0,
    jump     : 0,
    speed    : 0,
    rotation : 0,
    radius_x : 0,
    radius_y : 0,

    draw : function() 
    {
        let bird = this.animation[this.frame];

        ctx.save();
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation);

        if(state.current != state.home)
        {
            ctx.drawImage(
                mori_model_sprite, 
                bird.spriteX, bird.spriteY, 
                bird.spriteW, bird.spriteH, 
                -this.w/2, -this.h/2, 
                this.w, this.h
            );
        }

        ctx.restore();
    },

    flap : function() 
    {
        this.speed = -this.jump;
    },

    update: function() 
    {
        // The bird must flap slowly on get ready state
        this.period = (state.current == state.getReady) ? 9 : 6;
        // Incrementing the frame by 1, each period
        this.frame += frames % this.period == 0 ? 1 : 0;
        // Frame goes from 0 to 3, then again to 0
        this.frame = this.frame % this.animation.length; 

        if(state.current == state.getReady)
        {
            // Reset bird's position after game over
            this.y = cvs.height * 0.395;
            this.rotation = 0 * DEGREE;
        } 
        else
        {
            this.speed += this.gravity;
            this.y += this.speed;

            if(this.y + this.h/2 >= foreground.y)
            {
                // Bird position when it collides with the foreground
                this.y = foreground.y - this.h/2;
                if(state.current == state.game)
                {
                    state.current = state.gameOver;
                    if(!mute)
                    {
                        HIT.play();
                        setTimeout(function()
                        {
                            SWOOSH.currentTime = 0;
                            SWOOSH.play();
                        }, 500)
                    }
                }
            }

            // If the speed is greater than the jump, means the bird is falling down
            if(this.speed >= this.jump)
            {
                this.rotation = 90 * DEGREE;
                // When bird dies, stop flapping animation
                this.frame = 0;
            }
            else
            {
                this.rotation = -25 * DEGREE;
            }
        }  
    },

    speedReset : function()
    {
        this.speed = 0;
    }
}

// PIPES (заменяем на вертолёт)
const pipes =
{
    position : [],
    
    // Оставляем для коллизий, но не используем для отрисовки
    top :
    {
        spriteX: 1001, spriteY: 0, 
        spriteW: 104, spriteH: 800,
        x: 0, y: 0, 
        w: 0, h: 0
    },
    bottom : 
    {
        spriteX: 1105, spriteY: 0, 
        spriteW: 104, spriteH: 800,
        x: 0, y: 0, 
        w: 0, h: 0
    },

    // === ДОБАВЛЯЕМ: параметры анимации вертолёта ===
    helicopterFrame: 0,
    helicopterFrameCount: 3,
    helicopterFrameTick: 0,
    helicopterFrameTickMax: 6, // чуть менее быстрая анимация
    helicopterSpriteW: 256, // ширина одного кадра
    helicopterSpriteH: 320, // высота одного кадра (исправлено)
    
    // Исправлено: пропорциональное уменьшение (128x64)
    helicopterDrawW: 96,
    helicopterDrawH: 48,

    dx      : 0,
    gap     : 0,
    maxYPos : 0,
    scored  : false,

    draw : function()
    {
        // Анимация вертолёта (циклическая)
        this.helicopterFrameTick++;
        if (this.helicopterFrameTick >= this.helicopterFrameTickMax) {
            this.helicopterFrame = (this.helicopterFrame + 1) % this.helicopterFrameCount;
            this.helicopterFrameTick = 0;
        }

        const frameHeight = 394; // 306 (кадр) + 88 (пустота)
        const spriteW = 360;
        const spriteH = 306;
        const drawW = Math.round(spriteW / 1.5); // 240
        const drawH = Math.round(spriteH / 1.5); // 204

        for(let i = 0; i < this.position.length; i++)
        {
            let p = this.position[i];
            let topYPos = p.y;

            ctx.drawImage(
                helicopter_sprite,
                0, this.helicopterFrame * frameHeight, // x, y в спрайте
                spriteW, spriteH,                      // w, h кадра
                p.x, topYPos,
                drawW, drawH
            );
        }
    },

    update : function()
    {
        // Only create pipes in the game state
        if(state.current != state.game) 
        {
            return;
        }

        // Every 80 frames add a new position to our position array
        if(frames%80 == 0) 
        {
            // Вертолёт появляется только в верхней части карты (до 30% высоты)
            this.position.push(
            {
                x : cvs.width,
                y : Math.random() * (cvs.height * 0.3), // только верхняя часть
                scored : false
            });
        }
        
        for(let i = 0; i < this.position.length; i++)
        {
            let p = this.position[i];

            // COLLISION DETECTION (оставляем только для одного вертолёта)
            if(bird.x + bird.radius_x > p.x && bird.x - bird.radius_x < p.x + this.w &&
               bird.y + bird.radius_y > p.y && bird.y - bird.radius_y < p.y + this.h)
            {
                state.current = state.gameOver;
                if(!mute)
                {
                    HIT.play();
                    setTimeout(function() 
                    {
                        if (state.current == state.gameOver) 
                        {
                            DIE.currentTime = 0;
                            DIE.play();
                        }
                    }, 500)
                }
            }
            // Top pipe if bird is out of canvas
            if(bird.x + bird.radius_x > p.x && bird.x - bird.radius_x < p.x + this.w &&
               bird.y <= 0)
            {
                state.current = state.gameOver;
                if(!mute)
                {
                    HIT.play();
                    setTimeout(function() 
                    {
                        if (state.current == state.gameOver) 
                        {
                            DIE.currentTime = 0;
                            DIE.play();
                        }
                    }, 500)   
                }   
            }

            // Moving the pipes
            p.x -= this.dx;

            // Deleting 1/3 of the pipes every 6 pipes
            if (this.position.length == 6) 
            {
                this.position.splice(0, 2);
            }
            
            // Update score when the bird passes a pipe
            if (p.x + this.w < bird.x - bird.radius_x && !p.scored) 
            {
                score.game_score++;
                if(!mute)
                {
                    POINT.play();
                }
                
                if(score.game_score > score.best_score)
                {
                    score.best_score = score.game_score;
                    score.new_best_score = true;
                }

                localStorage.setItem("best_score", score.best_score);
                p.scored = true;
            }
        }
    },

    pipesReset : function()
    {
        this.position = [];
    }
}

// HOME
const home = 
{
    logo : 
    {
        spriteX: 552, spriteY: 233, 
        spriteW: 384, spriteH: 87,
        x: 0, y: 0,
        w: 0, h: 0,
        MAXY: 0, MINY: 0, dy: 0
    },

    animation : 
    [
        {spriteX: 931, spriteY: 429, spriteW: 68, spriteH: 48},
        {spriteX: 931, spriteY: 478, spriteW: 68, spriteH: 48},
        {spriteX: 931, spriteY: 527, spriteW: 68, spriteH: 48}
    ],

    bird : 
    {
        x: 0, y: 0, 
        w: 0, h: 0
    },

    studio_name : 
    {
        spriteX: 172, spriteY: 284, 
        spriteW: 380, spriteH: 28,
        x: 0, y: 0, 
        w: 0, h: 0
    },

    frame    : 0,
    logoGoUp : true,

    draw : function() 
    {
        let bird = this.animation[this.frame];

        if(state.current == state.home)
        {
            ctx.drawImage(
                            sprite_sheet,
                            this.logo.spriteX, this.logo.spriteY, 
                            this.logo.spriteW, this.logo.spriteH, 
                            this.logo.x, this.logo.y, 
                            this.logo.w, this.logo.h
                         );
            ctx.drawImage(
                            sprite_sheet, 
                            bird.spriteX, bird.spriteY, 
                            bird.spriteW, bird.spriteH, 
                            this.bird.x, this.bird.y,
                            this.bird.w, this.bird.h
                         );
            ctx.drawImage(
                            sprite_sheet, 
                            this.studio_name.spriteX, this.studio_name.spriteY, 
                            this.studio_name.spriteW, this.studio_name.spriteH, 
                            this.studio_name.x, this.studio_name.y, 
                            this.studio_name.w, this.studio_name.h
                         );
        }
    },

    update: function() 
    {
        if (state.current == state.home) 
        {
            if (this.logoGoUp) 
            {
                this.logo.y -= this.logo.dy;
                this.bird.y -= this.logo.dy;
                if(this.logo.y <= this.logo.MAXY) 
                {
                    this.logoGoUp = false;
                }
            }
            if (!this.logoGoUp) 
            {
                this.logo.y += this.logo.dy;
                this.bird.y += this.logo.dy;
                if(this.logo.y >= this.logo.MINY) 
                {
                    this.logoGoUp = true;
                }
            }
        }

        this.period = 6;
        // Incrementing the frame by 1, each period
        this.frame += frames % this.period == 0 ? 1 : 0;
        // Frame goes from 0 to 3, then again to 0
        this.frame = this.frame % this.animation.length; 
    }
}

// GET READY MESSAGE
const getReady = 
{
    get_ready : 
    {
        spriteX: 552, spriteY: 321, 
        spriteW: 349, spriteH: 87,
        x: 0, y: 0, 
        w: 0, h: 0
    },

    tap : 
    {
        spriteX: 0, spriteY: 0, 
        spriteW: 155, spriteH: 196,
        x: 0, y: 0, 
        w: 0, h: 0
    },

    draw : function() 
    {
        if(state.current == state.getReady)
        {
                ctx.drawImage(
                                sprite_sheet, 
                                this.get_ready.spriteX, this.get_ready.spriteY, 
                                this.get_ready.spriteW, this.get_ready.spriteH, 
                                this.get_ready.x, this.get_ready.y,
                                this.get_ready.w, this.get_ready.h
                             );
                ctx.drawImage(
                                sprite_sheet, 
                                this.tap.spriteX, this.tap.spriteY, 
                                this.tap.spriteW, this.tap.spriteH, 
                                this.tap.x, this.tap.y,
                                this.tap.w, this.tap.h
                             );
        }
    }
}

// GAME BUTTONS
const gameButtons = 
{
    mute_button : 
    {
        spriteX: 171, spriteY: 63, 
        spriteW: 55, spriteH: 62,
    },

    unmute_button : 
    {
        spriteX: 171, spriteY: 0, 
        spriteW: 55, spriteH: 62,
    },

    start_button : 
    {
        spriteX: 227, spriteY: 0, 
        spriteW: 160, spriteH: 56,
        x: 0, y: 0, 
        w: 0, h: 0,
        y_pressed : 0,
        isPressed : false
    },

    pause_button : 
    {
        spriteX: 280, spriteY: 114, 
        spriteW: 52, spriteH: 56,
    },

    resume_button : 
    {
        spriteX: 227, spriteY: 114, 
        spriteW: 52, spriteH: 56,
    },

    home_button : 
    {
        spriteX: 388, spriteY: 171, 
        spriteW: 160, spriteH: 56,
        x: 0, y: 0, 
        w: 0, h: 0,
        y_pressed : 0,
        isPressed : false
    },

    restart_button : 
    {
        spriteX: 227, spriteY: 57, 
        spriteW: 160, spriteH: 56,
        x: 0, y: 0, 
        w: 0, h: 0,
        y_pressed : 0,
        isPressed : false
    },

    night_button :
    {
        spriteX: 280, spriteY: 171, 
        spriteW: 56, spriteH: 60,
        x: 0,
        isPressed : false
    },

    day_button :
    {
        spriteX: 223, spriteY: 171, 
        spriteW: 56, spriteH: 60,
        x: 0,
        isPressed : false
    },

    // Variables common to Pause, Resume, Mute, Unmute, Night and Day buttons as they have the same dimensions and positions
    x: 0, 
    y: 0, 
    w: 0, 
    h: 0,
    y_pressed : 0,
    isPressed : false,

    draw : function() 
    {
        // Pause, Resume, Mute or Unmute button
        let button_y = this.isPressed ? this.y_pressed : this.y;
        // Night or Day button
        let night_button_y = this.night_button.isPressed ? this.y_pressed : this.y;
        // Start Button
        let start_button_y = this.start_button.isPressed ? this.start_button.y_pressed : this.start_button.y;
        // Restart button
        let restart_button_y = this.restart_button.isPressed ? this.restart_button.y_pressed : this.restart_button.y;
        // Home button
        let home_button_y = this.home_button.isPressed ? this.home_button.y_pressed : this.home_button.y;

        if(state.current == state.home)
        {
            if(!mute)
            {
                ctx.drawImage(
                                sprite_sheet, 
                                this.unmute_button.spriteX, this.unmute_button.spriteY, 
                                this.unmute_button.spriteW, this.unmute_button.spriteH, 
                                this.x, button_y, 
                                this.w, this.h
                             );
            }
            else if(mute)
            {
                ctx.drawImage(
                                sprite_sheet, 
                                this.mute_button.spriteX, this.mute_button.spriteY, 
                                this.mute_button.spriteW, this.mute_button.spriteH, 
                                this.x, button_y, 
                                this.w, this.h
                             ); 
            } 

            if(!night)
            {
                ctx.drawImage(
                                sprite_sheet, 
                                this.day_button.spriteX, this.day_button.spriteY, 
                                this.day_button.spriteW, this.day_button.spriteH, 
                                this.night_button.x, night_button_y, 
                                this.w, this.h
                             );
            }
            else if(night)
            {
                ctx.drawImage(
                                sprite_sheet, 
                                this.night_button.spriteX, this.night_button.spriteY, 
                                this.night_button.spriteW, this.night_button.spriteH, 
                                this.night_button.x, night_button_y, 
                                this.w, this.h
                             );
            }  
                       
            ctx.drawImage(
                            sprite_sheet, 
                            this.start_button.spriteX, this.start_button.spriteY, 
                            this.start_button.spriteW, this.start_button.spriteH, 
                            this.start_button.x, start_button_y, 
                            this.start_button.w, this.start_button.h
                         );
        }
        else if(state.current == state.game)
        {
            if(!gamePaused)
            {
                ctx.drawImage(
                                sprite_sheet, 
                                this.pause_button.spriteX, this.pause_button.spriteY, 
                                this.pause_button.spriteW, this.pause_button.spriteH, 
                                this.x, button_y, 
                                this.w, this.h
                             );
            }
            else if(gamePaused)
            {
                ctx.drawImage(
                                sprite_sheet, 
                                this.resume_button.spriteX, this.resume_button.spriteY, 
                                this.resume_button.spriteW, this.resume_button.spriteH, 
                                this.x, button_y, 
                                this.w, this.h
                             ); 
            }
        }
        else if(state.current == state.gameOver)
        {
            ctx.drawImage(
                            sprite_sheet, 
                            this.restart_button.spriteX, this.restart_button.spriteY, 
                            this.restart_button.spriteW, this.restart_button.spriteH, 
                            this.restart_button.x, restart_button_y, 
                            this.restart_button.w, this.restart_button.h
                         );
            ctx.drawImage(
                            sprite_sheet, 
                            this.home_button.spriteX, this.home_button.spriteY, 
                            this.home_button.spriteW, this.home_button.spriteH, 
                            this.home_button.x, home_button_y, 
                            this.home_button.w, this.home_button.h
                         );
        }
    }
}

// GAME OVER
const gameOver = 
{
    game_over : 
    {
        spriteX: 553, spriteY: 410, 
        spriteW: 376, spriteH: 75,
        x: 0, y: 0, 
        w: 0, h: 0
    },

    scoreboard : 
    {
        spriteX: 548, spriteY: 0, 
        spriteW: 452, spriteH: 232,
        x: 0, y: 0, 
        w: 0, h: 0
    },

    scoreSaved: false, // Добавляем свойство для отслеживания сохранения

    draw : function() 
    {
        if(state.current == state.gameOver)
        {
            ctx.drawImage(
                            sprite_sheet, 
                            this.game_over.spriteX, this.game_over.spriteY, 
                            this.game_over.spriteW, this.game_over.spriteH, 
                            this.game_over.x, this.game_over.y, 
                            this.game_over.w, this.game_over.h
                         );
            ctx.drawImage(
                            sprite_sheet, 
                            this.scoreboard.spriteX, this.scoreboard.spriteY, 
                            this.scoreboard.spriteW, this.scoreboard.spriteH, 
                            this.scoreboard.x, this.scoreboard.y, 
                            this.scoreboard.w, this.scoreboard.h
                         );
            
            // Сохраняем результат при первом отображении game over
            if (!this.scoreSaved) {
                GameAPI.saveScore(score.game_score);
                this.scoreSaved = true;
                
                // Проверяем на новый рекорд
                if (score.game_score > score.best_score) {
                    GameAPI.showNewRecord();
                }
                
                // Показываем достижения
                if (score.game_score >= 10) {
                    GameAPI.showAchievement('🎉 Отличный результат!');
                }
                if (score.game_score >= 20) {
                    GameAPI.showAchievement('🏆 Мастер игры!');
                }
                
                // Показываем кнопки Telegram
                if (tg && tg.MainButton) {
                    tg.MainButton.setText('🔄 ИГРАТЬ СНОВА');
                    tg.MainButton.show();
                    // Сначала снять старый обработчик, если поддерживается
                    if (typeof tg.MainButton.offClick === 'function') tg.MainButton.offClick();
                    tg.MainButton.onClick(() => {
                        pipes.pipesReset();
                        bird.speedReset();
                        score.scoreReset();
                        gameButtons.restart_button.isPressed = false;
                        gameButtons.home_button.isPressed = false;
                        state.current = state.getReady;
                        if (tg && tg.MainButton) tg.MainButton.hide();
                    });
                    // Показываем кнопку "Назад" только если поддерживается
                    if (tg.BackButton && tg.version && parseFloat(tg.version) >= 6.1 && typeof tg.BackButton.show === 'function') {
                        tg.BackButton.show();
                    }
                }
            }
        }
    }
}

// SCORE
const score = 
{
    new_best :
    {
        spriteX: 921, spriteY: 349, 
        spriteW: 64, spriteH: 28,
        x: 0, y: 0, 
        w: 0, h: 0
    },

    number : 
    [
        {spriteX :  98}, // 0
        {spriteX : 127}, // 1
        {spriteX : 156}, // 2
        {spriteX : 185}, // 3
        {spriteX : 214}, // 4
        {spriteX : 243}, // 5
        {spriteX : 272}, // 6 
        {spriteX : 301}, // 7
        {spriteX : 330}, // 8
        {spriteX : 359}  // 9
    ],
    spriteY : 243, 
    spriteW : 28, 
    spriteH : 40,
    x : 0,
    y : 0,
    w : 0,
    y : 0,
    one_w : 0,
    space : 0,
    score : {x: 0, y: 0, w: 0, h: 0},
    best  : {x: 0, y: 0, w: 0, h: 0},

    // If local storage is empty for best_score, best_score is 0
    best_score : parseInt(localStorage.getItem("best_score")) || 0,
    game_score : 0,
    new_best_score : false,

    draw : function()
    {
        let game_score_s = this.game_score.toString();
        let best_score_s = this.best_score.toString();

        if(state.current == state.game)
        {
            let total_width = 0;
            for (let i = 0; i < game_score_s.length; i++) 
            {
                if (game_score_s[i] == 1) 
                {
                    total_width += this.one_w + this.space;
                } 
                else 
                {
                    total_width += this.w + this.space;
                }
            }
            // Subtracts the extra space at the end
            total_width -= this.space;

            // Offset for the game score to center it horizontally
            let offset = this.x - total_width / 2 + (this.w / 2);
            
            for(let i = 0; i < game_score_s.length; i++)
            {
                // If i isn't last digit and next digit is 1, use one_width for current digit to create space between digits
                if (i < game_score_s.length - 1 && game_score_s[i+1] == 1) 
                {
                    ctx.drawImage(
                                    sprite_sheet, 
                                    this.number[parseInt(game_score_s[i])].spriteX, this.spriteY, 
                                    this.spriteW, this.spriteH, 
                                    offset, this.y,
                                    this.w, this.h
                                 );
                    offset = offset + this.one_w + this.space;
                } 
                // If i is last digit or next digit isn't 1, use full width for current digit
                else 
                {
                    ctx.drawImage(
                                    sprite_sheet, 
                                    this.number[parseInt(game_score_s[i])].spriteX, this.spriteY, 
                                    this.spriteW, this.spriteH, 
                                    offset, this.y,
                                    this.w, this.h
                                 );
                    offset = offset + this.w + this.space;
                }
            }            
        }
        else if(state.current == state.gameOver)
        {
            let offset_1 = 0;
            // Game score on Game Over screen
            for(let i = game_score_s.length - 1; i >= 0; i--)
            {
                ctx.drawImage(
                                sprite_sheet, 
                                this.number[parseInt(game_score_s[i])].spriteX, this.spriteY, 
                                this.spriteW, this.spriteH, 
                                this.score.x + offset_1, this.score.y, 
                                this.w, this.h
                            );
                if(parseInt(game_score_s[i]) == 1)
                {
                    offset_1 = offset_1 - this.one_w - this.space;
                }
                else
                {
                    offset_1 = offset_1 - this.w - this.space;
                }
            }

            let offset_2 = 0;
            // Best score on Game Over screen
            for(let i = best_score_s.length - 1; i >= 0; i--)
            {     
                ctx.drawImage(
                                sprite_sheet, 
                                this.number[parseInt(best_score_s[i])].spriteX, this.spriteY, 
                                this.spriteW, this.spriteH, 
                                this.best.x + offset_2, this.best.y, 
                                this.w, this.h
                            );
                if(parseInt(best_score_s[i]) == 1)
                {
                    offset_2 = offset_2 - this.one_w - this.space;
                }
                else
                {
                    offset_2 = offset_2 - this.w - this.space;
                }
            }
            
            if(this.new_best_score)
            {
                ctx.drawImage(
                                sprite_sheet, 
                                this.new_best.spriteX, this.new_best.spriteY, 
                                this.new_best.spriteW, this.new_best.spriteH, 
                                this.new_best.x, this.new_best.y, 
                                this.new_best.w, this.new_best.h
                             ); 
            }            
        }
    },

    scoreReset : function()
    {
        this.game_score = 0;
        this.new_best_score = false;
    }
}

// SCORE MEDALS
const medal = 
{
    // Medal's variables
    bronze   : {spriteX: 554},
    silver   : {spriteX: 642},
    gold     : {spriteX: 731},
    platinum : {spriteX: 820},
    spriteY: 487,
    spriteW: 88, 
    spriteH: 87,
    x : 0,
    y : 0,
    w : 0,
    h : 0,

    medal: "",

    // Shine animation's variables
    animation : 
    [
        {spriteX: 922, spriteY: 386, spriteW: 20, spriteH: 20},
        {spriteX: 943, spriteY: 386, spriteW: 20, spriteH: 20},
        {spriteX: 964, spriteY: 386, spriteW: 20, spriteH: 20},
        {spriteX: 943, spriteY: 386, spriteW: 20, spriteH: 20},
        {spriteX: 922, spriteY: 386, spriteW: 20, spriteH: 20}
    ],
    animation_w : 0,
    animation_h : 0,
    shine_position : [],
    frame  : 0,
    radius : 0,      

    draw: function () 
    {
        let medalSpriteX;
        
        if (score.game_score >= 10 && score.game_score < 20) 
        {
            this.medal = "bronze";
            medalSpriteX = this.bronze;
        } 
        else if (score.game_score >= 20 && score.game_score < 30) 
        {
            this.medal = "silver";
            medalSpriteX = this.silver;
        }
        else if (score.game_score >= 30 && score.game_score < 40) 
        {
            this.medal = "gold";
            medalSpriteX = this.gold;
        } 
        else if (score.game_score >= 40) 
        {
            this.medal = "platinum";
            medalSpriteX = this.platinum;
        }

        if (state.current == state.gameOver && score.game_score >= 10) 
        {
            ctx.drawImage(
                            sprite_sheet,
                            medalSpriteX.spriteX, this.spriteY, 
                            this.spriteW, this.spriteH, 
                            this.x, this.y, 
                            this.w, this.h
                         ); 

            let shine = this.animation[this.frame];
            for (let i = 0; i < this.shine_position.length; i++) 
            {
                let position = this.shine_position[i];

                ctx.drawImage(
                                sprite_sheet,
                                shine.spriteX, shine.spriteY,
                                shine.spriteW, shine.spriteH,
                                position.x, position.y,
                                this.animation_w, this.animation_h
                             );  
            }
        }
    },
    
    update: function() 
    {
        // How often the shine effect should be updated, in frames
        this.period = 7;
        // Incrementing the frame by 1, each period
        this.frame += frames % this.period == 0 ? 1 : 0;
        // Frame goes from 0 to 5, then again to 0
        this.frame = this.frame % this.animation.length; 

        // Resetting shine_position array after last frame so only 1 animation is drawn at a time
        if (this.frame == this.animation.length - 1)
            this.shine_position = [];

        if (frames % (this.period * this.animation.length) == 0) 
        {
            // How far from the circle's center the shine animation can appear
            const limit = 0.9 * this.radius;
            // Direction the shine animation will appear in
            const angle = Math.random() * Math.PI * 2;
            // How far from the center the shine animation will appear 
            const distance = Math.random() * limit;
    
            this.shine_position.push(
            {
                x: this.centerX + Math.cos(angle) * distance,
                y: this.centerY + Math.sin(angle) * distance
            });
        }
    }
}

// CANVAS SCALE
function canvasScale() 
{
    // Получаем размеры экрана
    let screenWidth, screenHeight;
    
    if (tg && tg.viewportStableHeight) {
        screenWidth = tg.viewportStableHeight;
        screenHeight = tg.viewportStableHeight;
    } else {
        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
    }
    
    // CANVAS HEIGHT & WIDTH
    cvs.height = screenHeight;
    cvs.width = screenHeight * 0.72;

    // BACKGROUND
    background.x = 0;
    background.y = cvs.height * 0.631;
    background.w = cvs.width;
    background.h = background.w * 0.74;
    //Stars for night mode
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
    bird.gravity = cvs.height * 0.0006;
    bird.jump = cvs.height * 0.01;
    bird.radius_x = bird.w * 0.4;
    bird.radius_y = bird.h * 0.4;

    // PIPES (helicopter)
    // drawW и drawH должны совпадать с draw() в pipes
    const pipesDrawW = Math.round(360 / 1.5); // 240
    const pipesDrawH = Math.round(306 / 1.5); // 204
    pipes.w = pipesDrawW * 0.8;
    pipes.h = pipesDrawH * 0.8;
    pipes.gap = 120; // или другое подходящее значение
    pipes.maxYPos = -(cvs.height * 0.350);
    pipes.dx = cvs.width * 0.007;

    // HOME
    // Logo
    home.logo.x = cvs.width * 0.098;
    home.logo.y = cvs.height * 0.279;
    home.logo.w = cvs.width * 0.665;
    home.logo.h = cvs.height * 0.109; 
    home.logo.MAXY = cvs.height * 0.279 - home.logo.h/7;
    home.logo.MINY = cvs.height * 0.279 + home.logo.h/7;
    home.logo.dy = cvs.width * 0.0012;
    // Bird
    home.bird.x = cvs.width * 0.803;
    home.bird.y = cvs.height * 0.294;
    home.bird.w = cvs.width * 0.117;
    home.bird.h = cvs.height * 0.059;
    // Studio Name
    home.studio_name.x = cvs.width * 0.171;
    home.studio_name.y = cvs.height * 0.897;
    home.studio_name.w = cvs.width * 0.659;
    home.studio_name.h = cvs.height * 0.034; 

    // GET READY
    // "Get Ready" message
    getReady.get_ready.x = cvs.width * 0.197;
    getReady.get_ready.y = cvs.height * 0.206;
    getReady.get_ready.w = cvs.width * 0.602;
    getReady.get_ready.h = cvs.height * 0.109;  
    // Tap
    getReady.tap.x = cvs.width * 0.433;
    getReady.tap.y = cvs.height * 0.435;
    getReady.tap.w = cvs.width * 0.270;
    getReady.tap.h = cvs.height * 0.244;

    // GAME BUTTONS 
    // Pause, Resume, Mute, Unmute, Night and Day buttons
    gameButtons.x = cvs.width * 0.087;
    gameButtons.y = cvs.height * 0.045;
    gameButtons.y_pressed = cvs.height * 0.049;
    gameButtons.w = cvs.width * 0.088;
    gameButtons.h = cvs.height * 0.069;
    // Night or Day button's x
    gameButtons.night_button.x = cvs.width * 0.189;
    // Start Button
    gameButtons.start_button.x = cvs.width * 0.359;
    gameButtons.start_button.y = cvs.height * 0.759;
    gameButtons.start_button.y_pressed = cvs.height * 0.763;
    gameButtons.start_button.w = cvs.width * 0.276;
    gameButtons.start_button.h = cvs.height * 0.068;
    // Restart button
    gameButtons.restart_button.x = cvs.width * 0.147;
    gameButtons.restart_button.y = cvs.height * 0.759;
    gameButtons.restart_button.y_pressed = cvs.height * 0.763;
    gameButtons.restart_button.w = cvs.width * 0.276;
    gameButtons.restart_button.h = cvs.height * 0.068;
    // Home button
    gameButtons.home_button.x = cvs.width * 0.576;
    gameButtons.home_button.y = cvs.height * 0.759;
    gameButtons.home_button.y_pressed = cvs.height * 0.763;
    gameButtons.home_button.w = cvs.width * 0.276;
    gameButtons.home_button.h = cvs.height * 0.068;

    // GAME OVER
    // "Game Over" message
    gameOver.game_over.x = cvs.width * 0.182;
    gameOver.game_over.y = cvs.height * 0.243;
    gameOver.game_over.w = cvs.width * 0.645;
    gameOver.game_over.h = cvs.height * 0.095; 
    // Scoreboard
    gameOver.scoreboard.x = cvs.width * 0.107;
    gameOver.scoreboard.y = cvs.height * 0.355;
    gameOver.scoreboard.w = cvs.width * 0.782;
    gameOver.scoreboard.h = cvs.height * 0.289;

    // SCORE
    // New best score label
    score.new_best.x = cvs.width * 0.577;
    score.new_best.y = cvs.height * 0.500;
    score.new_best.w = cvs.width * 0.112;
    score.new_best.h = cvs.height * 0.035;
    // Width & height for every number
    score.w = cvs.width * 0.048;
    score.h = cvs.height * 0.046;
    score.one_w = cvs.width * 0.032
    // Score on game screen
    score.x = cvs.width * 0.476;
    score.y = cvs.height * 0.045;
    // Score on game over screen
    score.score.x = cvs.width * 0.769;
    score.score.y = cvs.height * 0.441;
    // Best score on game screen
    score.best.x = cvs.width * 0.769;
    score.best.y = cvs.height * 0.545;
    // Space between numbers
    score.space = cvs.width * 0.016;

    // SCORE MEDALS
    // Medals
    medal.x = cvs.width * 0.197;
    medal.y = cvs.height * 0.461;
    medal.w = cvs.width * 0.152;
    medal.h = cvs.height * 0.108;
    // Shine Animation
    for(let i = 0; i < medal.shine_position.length; i++)
    {
        let w = medal.animation_w / 0.034;
        let h = medal.animation_w / 0.023;
        let position = medal.shine_position[i];

        medal.shine_position[i] = 
        {
            x : position.x * cvs.width / w,
            y : position.y * cvs.height / h
        }
    }
    medal.radius = cvs.width * 0.061;
    medal.centerX = cvs.width * 0.257;
    medal.centerY = cvs.height * 0.506;
    medal.animation_w = cvs.width * 0.034;
    medal.animation_h = cvs.height * 0.023;
}



// When window loads or resizes
window.addEventListener("load", () => {
    console.log('Window loaded, initializing game...');
    
    // Проверяем canvas
    if (!cvs) {
        console.error('Canvas not found!');
        return;
    }
    
    console.log('Canvas found, scaling...');
    canvasScale();
    window.addEventListener("resize", canvasScale);
    
    // Инициализируем Telegram
    console.log('Initializing Telegram...');
    initTelegram();
    
    console.log('Game initialization complete');
});

// DRAW
function draw() 
{
    // Проверяем, что canvas и изображения загружены
    if (!cvs) {
        console.error('Canvas not found!');
        return;
    }
    
    if (!sprite_sheet.complete) {
        console.log('Waiting for sprite sheet to load...');
        // Показываем загрузочный экран
        ctx.fillStyle = "#7BC5CD";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Loading...", cvs.width / 2, cvs.height / 2);
        return;
    }
    
    // Background color of canvas 
    ctx.fillStyle = !night ? "#7BC5CD" : "#12284C"; 
    ctx.fillRect(0, 0, cvs.width, cvs.height); 

    background.draw();
    pipes.draw();
    foreground.draw();
    bird.draw();
    home.draw();
    getReady.draw();
    gameButtons.draw();
    gameOver.draw();
    medal.draw();
    score.draw();
}

// UPDATE
function update() 
{
    // Update position and state of bird, foreground and pipes only if game isn't paused
    if(!gamePaused)
    {
        bird.update();
        foreground.update();
        pipes.update();
    }
    home.update();
    medal.update();
}

// LOOP
function loop() 
{
    // Update rate: 75FPS
    setTimeout(function() 
    {
        update();
        draw();
        // Increment frames only if game isn't paused
        if(!gamePaused)
        {
            frames++;
        }
        requestAnimationFrame(loop);
    }, (1 / 75) * 1000);
}

loop();