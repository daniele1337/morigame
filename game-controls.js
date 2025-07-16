// CONTROL THE GAME

// Универсальная функция для получения координат относительно canvas
getCanvasRelativeCoords = function(event) {
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

// Обработчик нажатия ЛКМ (mousedown)
cvs.addEventListener("mousedown", function(event) 
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
            if(clickX >= gameButtons.start_button.x && clickX <= gameButtons.start_button.x + gameButtons.start_button.w &&
                clickY >= gameButtons.start_button.y && clickY <= gameButtons.start_button.y + gameButtons.start_button.h)
            {
                gameButtons.start_button.pressTime = performance.now();
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
            // Управление ракетой - включаем двигатель при нажатии ЛКМ
            else if (!gamePaused) {
                engineHeld = true;
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
                gameButtons.restart_button.pressTime = performance.now();
                pipes.pipesReset();
                coins.reset();
                bird.speedReset();
                score.scoreReset();
                coins.reset();
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
                mguObstacles = [];
                lubyankaObstacles = [];
                ostankinoObstacles = [];
            }
            // Home button
            else if(clickX >= gameButtons.home_button.x && clickX <= gameButtons.home_button.x + gameButtons.home_button.w &&
                    clickY >= gameButtons.home_button.y && clickY <= gameButtons.home_button.y + gameButtons.home_button.h)
            {
                gameButtons.home_button.pressTime = performance.now();
                pipes.pipesReset();
                coins.reset();
                bird.speedReset();
                score.scoreReset();
                coins.reset();
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
                mguObstacles = [];
                lubyankaObstacles = [];
                ostankinoObstacles = [];
            }
            break;
    }        
});

// Обработчик отпускания ЛКМ (mouseup)
cvs.addEventListener("mouseup", function(event) 
{ 
    if (state.current === state.game && !gamePaused) {
        engineHeld = false;
        bird.release(); // Вызываем функцию спуска при отпускании
    }
});

// Обработчик выхода мыши за пределы canvas (mouseleave)
cvs.addEventListener("mouseleave", function(event) 
{ 
    if (state.current === state.game && !gamePaused) {
        engineHeld = false;
        bird.release(); // Вызываем функцию спуска при выходе мыши
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
            if(clickX >= gameButtons.start_button.x && clickX <= gameButtons.start_button.x + gameButtons.start_button.w &&
                clickY >= gameButtons.start_button.y && clickY <= gameButtons.start_button.y + gameButtons.start_button.h)
            {
                gameButtons.start_button.pressTime = performance.now();
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
            // Управление ракетой - включаем двигатель при нажатии пальца
            else if (!gamePaused) {
                engineHeld = true;
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
                gameButtons.restart_button.pressTime = performance.now();
                pipes.pipesReset();
                coins.reset();
                bird.speedReset();
                score.scoreReset();
                coins.reset();
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
                mguObstacles = [];
                lubyankaObstacles = [];
                ostankinoObstacles = [];
            }
            // Home button
            else if(clickX >= gameButtons.home_button.x && clickX <= gameButtons.home_button.x + gameButtons.home_button.w &&
                    clickY >= gameButtons.home_button.y && clickY <= gameButtons.home_button.y + gameButtons.home_button.h)
            {
                gameButtons.home_button.pressTime = performance.now();
                pipes.pipesReset();
                coins.reset();
                bird.speedReset();
                score.scoreReset();
                coins.reset();
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
                mguObstacles = [];
                lubyankaObstacles = [];
                ostankinoObstacles = [];
            }
            break;
    }        
});

// Добавляем обработку touchmove и touchend для мобильных устройств
cvs.addEventListener("touchmove", function(event) 
{ 
    event.preventDefault(); // Предотвращаем скролл
});

cvs.addEventListener("touchend", function(event) 
{ 
    if (state.current === state.game && !gamePaused) {
        engineHeld = false;
        bird.release(); // Вызываем функцию спуска при отпускании
    }
    event.preventDefault(); // Предотвращаем дополнительные события
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
                if (!gamePaused) 
                {
                    engineHeld = true;
                    bird.flap();
                    if(!mute)
                    {
                        FLAP.currentTime = 0;
                        FLAP.play();
                    }
                }
                break;
        } 
    }
    else if (event.key === "ArrowUp" && state.current == state.game)
    {
        if (!gamePaused) 
        {
            engineHeld = true;
            bird.flap();
            if(!mute)
            {
                FLAP.currentTime = 0;
                FLAP.play();
            }
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
    if ((event.key === " " || event.key === "ArrowUp") && state.current == state.game)
    {
        engineHeld = false;
        bird.release(); // Вызываем функцию спуска при отпускании
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

// === Управление кастомным ползунком громкости на canvas ===
let volumeSliderDragging = false;

cvs.addEventListener('mousedown', function(event) {
    if (state.current === state.home) {
        const rect = cvs.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        // Параметры ползунка должны совпадать с drawVolumeSlider
        const sliderWidth = gameButtons.w * 2.2;
        const sliderHeight = gameButtons.h * 0.28;
        const sliderX = gameButtons.x;
        const sliderY = gameButtons.y + gameButtons.h + 20;
        const knobRadius = sliderHeight * 0.55;
        // Увеличенная область попадания
        const hitZone = Math.max(knobRadius * 2, sliderHeight * 3);
        if (
            mouseX >= sliderX && mouseX <= sliderX + sliderWidth &&
            mouseY >= sliderY - hitZone && mouseY <= sliderY + sliderHeight + hitZone
        ) {
            volumeSliderDragging = true;
            // Сразу обновить значение
            let newValue = (mouseX - sliderX) / sliderWidth;
            newValue = Math.max(0, Math.min(1, newValue));
            // Чувствительность: минимальное значение 0.01
            newValue = 0.01 + (1 - 0.01) * newValue;
            volumeSliderValue = newValue;
            if (typeof setAllSoundsVolume === 'function') setAllSoundsVolume(volumeSliderValue);
        }
    }
});

cvs.addEventListener('mousemove', function(event) {
    if (volumeSliderDragging) {
        const rect = cvs.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        // Параметры ползунка должны совпадать с drawVolumeSlider
        const sliderWidth = gameButtons.w * 2.2;
        const sliderX = gameButtons.x;
        let newValue = (mouseX - sliderX) / sliderWidth;
        newValue = Math.max(0, Math.min(1, newValue));
        // Чувствительность: минимальное значение 0.01
        newValue = 0.01 + (1 - 0.01) * newValue;
        volumeSliderValue = newValue;
        if (typeof setAllSoundsVolume === 'function') setAllSoundsVolume(volumeSliderValue);
    }
});

cvs.addEventListener('mouseup', function(event) {
    if (volumeSliderDragging) {
        volumeSliderDragging = false;
    }
});

cvs.addEventListener('mouseleave', function(event) {
    if (volumeSliderDragging) {
        volumeSliderDragging = false;
    }
}); 

// === Touch-события для мобильных устройств ===
cvs.addEventListener('touchstart', function(event) {
    if (state.current === state.home && event.touches.length === 1) {
        const rect = cvs.getBoundingClientRect();
        const touch = event.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        const sliderWidth = gameButtons.w * 2.2;
        const sliderHeight = gameButtons.h * 0.28;
        const sliderX = gameButtons.x;
        const sliderY = gameButtons.y + gameButtons.h + 20;
        const knobRadius = sliderHeight * 0.55;
        // Увеличенная область попадания
        const hitZone = Math.max(knobRadius * 2, sliderHeight * 3);
        if (
            touchX >= sliderX && touchX <= sliderX + sliderWidth &&
            touchY >= sliderY - hitZone && touchY <= sliderY + sliderHeight + hitZone
        ) {
            volumeSliderDragging = true;
            let newValue = (touchX - sliderX) / sliderWidth;
            newValue = Math.max(0, Math.min(1, newValue));
            newValue = 0.01 + (1 - 0.01) * newValue;
            volumeSliderValue = newValue;
            if (typeof setAllSoundsVolume === 'function') setAllSoundsVolume(volumeSliderValue);
            event.preventDefault();
        }
    }
}, {passive: false});

cvs.addEventListener('touchmove', function(event) {
    if (volumeSliderDragging && event.touches.length === 1) {
        const rect = cvs.getBoundingClientRect();
        const touch = event.touches[0];
        const touchX = touch.clientX - rect.left;
        const sliderWidth = gameButtons.w * 2.2;
        const sliderX = gameButtons.x;
        let newValue = (touchX - sliderX) / sliderWidth;
        newValue = Math.max(0, Math.min(1, newValue));
        newValue = 0.01 + (1 - 0.01) * newValue;
        volumeSliderValue = newValue;
        if (typeof setAllSoundsVolume === 'function') setAllSoundsVolume(volumeSliderValue);
        event.preventDefault();
    }
}, {passive: false});

cvs.addEventListener('touchend', function(event) {
    if (volumeSliderDragging) {
        volumeSliderDragging = false;
        event.preventDefault();
    }
}, {passive: false});

cvs.addEventListener('touchcancel', function(event) {
    if (volumeSliderDragging) {
        volumeSliderDragging = false;
        event.preventDefault();
    }
}, {passive: false}); 