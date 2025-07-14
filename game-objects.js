// Игровые объекты (оптимизированные)

// Новый дневной фон
const background_day_img = new Image();
background_day_img.src = "img/separated/background_day.png";
background_day_img.hasError = false;
background_day_img.onerror = function() {
    background_day_img.hasError = true;
    console.error('Не удалось загрузить background_day_img');
};

background = {
    // Координаты и размеры для совместимости
    x: 0, y: 0, w: 0, h: 0,
    night_spriteX: 1211,
    spriteY: 392,
    spriteW: 552,
    spriteH: 408,
    stars: {
        spriteX: 1211, spriteY: 0,
        spriteW: 552, spriteH: 392,
        y: 0, h: 0
    },
    offsetX: 0,
    speed: 1, // скорость движения фона (пикселей за кадр)
    draw: function() {
        if (!night) {
            let w = this.w * 2; // растягиваем фон в 2 раза шире canvas
            let h = foreground.y; // высота фона до земли
            let x1 = -this.offsetX % w;
            ctx.drawImage(background_day_img, x1, 0, w, h);
            ctx.drawImage(background_day_img, x1 + w, 0, w, h);
        } else {
            ctx.drawImage(sprite_sheet, this.night_spriteX, this.spriteY, this.spriteW, this.spriteH, this.x, this.y, this.w, this.h);
            ctx.drawImage(sprite_sheet, this.stars.spriteX, this.stars.spriteY, this.stars.spriteW, this.stars.spriteH, this.x, this.stars.y, this.w, this.stars.h);
        }
    },
    update: function() {
        if (!night) {
            this.offsetX += this.speed;
        } else {
            this.offsetX = 0;
        }
    }
};

// Передний план
// Новый рисунок земли
const earth_img = new Image();
earth_img.src = "img/separated/earth.png";
earth_img.hasError = false;
earth_img.onerror = function() {
    earth_img.hasError = true;
    console.error('Не удалось загрузить earth_img');
};
foreground = {
    spriteX: 553, spriteY: 576, spriteW: 447, spriteH: 224,
    x: 0, y: 0, w: 0, h: 0, dx: 0,
    draw: function() {
        // Рисуем землю новой текстурой
        ctx.drawImage(earth_img, this.x, this.y, this.w, this.h);
        ctx.drawImage(earth_img, (this.x + this.w)-0.7, this.y, this.w, this.h);
    },
    update: function(deltaTime) {
        if(state.current != state.gameOver) {
            this.x = (this.x - this.dx * (deltaTime ? deltaTime * 60 : 1)) % (this.w/2);
        }
    }
};

// Ракета (оптимизированная)
bird = {
    animation: [
        {spriteX: 0, spriteY: 0, spriteW: 180, spriteH: 136},
        {spriteX: 0, spriteY: 174, spriteW: 180, spriteH: 136},
        {spriteX: 0, spriteY: 342, spriteW: 180, spriteH: 136}
    ],
    x: 0, y: 0, w: 0, h: 0,
    frame: 0, gravity: 0, jump: 0, speed: 0, rotation: 0,
    radius_x: 0, radius_y: 0,
    
    // Физика ракеты
    maxSpeed: 0, minSpeed: 0, acceleration: 0, enginePower: 0,
    rotationSpeed: 0, targetRotation: 0, smoothRotation: 0,
    velocityY: 0, engineThrust: 0, maxThrust: 0, thrustDecay: 0,
    engineCooldown: 0, maxEngineCooldown: 0,
    wobbleOffset: 0, wobbleSpeed: 0, wobbleAmount: 0,
    autoFlightTimer: 0, autoFlightDelay: 60, autoFlightPower: 0,
    lastEngineTime: 0, minEngineInterval: 0,
    rotationInertia: 0, maxRotationInertia: 0,
    isReleased: false,

    draw: function() {
        let bird = this.animation[this.frame];
        ctx.save();
        
        let wobbleX = Math.sin(frames * this.wobbleSpeed) * this.wobbleAmount;
        if (this.engineThrust > 0) {
            wobbleX += Math.sin(frames * 0.3) * this.wobbleAmount * 0.5;
        }
        
        ctx.translate(this.x + wobbleX, this.y);
        ctx.rotate(this.rotation);

        if(state.current != state.home) {
            ctx.drawImage(mori_model_sprite, bird.spriteX, bird.spriteY, bird.spriteW, bird.spriteH, -this.w/2, -this.h/2, this.w, this.h * 1.452);
        }
        ctx.restore();
    },

    flap: function(deltaTime) {
        if (!engineHeld) {
            this.engineThrust = 0;
            return;
        }
        if (!engineHeld && this.engineCooldown > 0) return;
        if (!engineHeld && frames - this.lastEngineTime < this.minEngineInterval) return;
        
        if (!engineHeld) {
            this.engineCooldown = this.maxEngineCooldown;
            this.lastEngineTime = frames;
        }
        
        this.autoFlightTimer = 0;
        this.engineThrust = this.maxThrust;
        this.targetRotation = -8 * Math.PI/180;
    },
    
    release: function(deltaTime) {
        this.engineThrust = 0;
        this.targetRotation = 8 * Math.PI/180;
    },

    update: function(deltaTime) {
        if (state.current == state.getReady) {
            this.period = isMobile ? 72 : 56; // Ещё медленнее (ещё на 50%)
        } else if (state.current == state.game) {
            const speedFactor = Math.abs(this.velocityY) / this.maxSpeed;
            const basePeriod = isMobile ? 48 : 32; // Ещё медленнее (ещё на 50%)
            this.period = Math.max(16, Math.min(basePeriod, 72 - speedFactor * 18));
        } else {
            this.period = isMobile ? 48 : 36; // Ещё медленнее (ещё на 50%)
        }
        
        this.frame += frames % this.period == 0 ? 1 : 0;
        this.frame = this.frame % this.animation.length;

        if(state.current == state.getReady) {
            this.y = cvs.height * 0.395;
            this.rotation = 0;
            this.velocityY = 0;
            this.targetRotation = 0;
            this.engineCooldown = 0;
            this.engineThrust = 0;
            this.autoFlightTimer = 0;
            this.lastEngineTime = 0;
            this.rotationInertia = 0;
            engineHeld = false;
        } else {
            if (this.engineCooldown > 0) {
                this.engineCooldown -= (deltaTime ? deltaTime * 60 : 1);
                if (this.engineCooldown < 0) this.engineCooldown = 0;
            }
            
            if (state.current == state.game) {
                this.autoFlightTimer += (deltaTime ? deltaTime * 60 : 1);
                if (this.autoFlightTimer > this.autoFlightDelay && this.velocityY > 0) {
                    this.velocityY -= this.autoFlightPower * (deltaTime ? deltaTime * 60 : 1);
                }
                if (Math.abs(this.velocityY) < this.maxSpeed * 0.3) {
                    this.targetRotation *= 0.95;
                }
            }
            
            if (this.engineThrust > 0) {
                this.velocityY -= this.engineThrust * this.enginePower * (deltaTime ? deltaTime * 60 : 1);
                this.engineThrust *= Math.pow(this.thrustDecay, (deltaTime ? deltaTime * 60 : 1));
            }
            
            this.velocityY += this.acceleration * (deltaTime ? deltaTime * 60 : 1);
            
            if (this.velocityY > this.maxSpeed) {
                this.velocityY = this.maxSpeed;
            }
            if (this.velocityY < this.minSpeed) {
                this.velocityY = this.minSpeed;
            }
            
            this.y += this.velocityY * (deltaTime ? deltaTime * 60 : 1);

            if (engineHeld && state.current == state.game) {
                if (this.velocityY < this.minSpeed * 0.5) {
                    this.targetRotation = -8 * Math.PI/180;
                } else {
                    this.targetRotation = -4 * Math.PI/180;
                }
            } else if (state.current == state.game) {
                if (this.velocityY > this.maxSpeed * 0.3) {
                    this.targetRotation = 8 * Math.PI/180;
                } else {
                    this.targetRotation = 4 * Math.PI/180;
                }
            } else {
                this.targetRotation = 0;
            }
            
            const rotationDiff = this.targetRotation - this.rotation;
            this.rotationInertia += rotationDiff * this.rotationSpeed * (deltaTime ? deltaTime * 60 : 1);
            this.rotationInertia = Math.max(-this.maxRotationInertia, Math.min(this.maxRotationInertia, this.rotationInertia));
            this.rotation += this.rotationInertia * (deltaTime ? deltaTime * 60 : 1);
            this.rotationInertia *= Math.pow(0.95, (deltaTime ? deltaTime * 60 : 1));

            if(this.y + this.h/2 >= foreground.y) {
                this.y = foreground.y - this.h/2;
                if(state.current == state.game) {
                    state.current = state.gameOver;
                    if(!mute) {
                        HIT.play();
                        setTimeout(function() {
                            SWOOSH.currentTime = 0;
                            SWOOSH.play();
                        }, 500)
                    }
                }
            }

            if(this.y - this.h/2 <= 0) {
                this.y = this.h/2;
                if (this.velocityY < 0) {
                    this.velocityY = 0;
                }
            }
        }
    },

    speedReset: function() {
        this.velocityY = 0;
        this.rotation = 0;
        this.targetRotation = 0;
        this.engineCooldown = 0;
        this.engineThrust = 0;
        this.autoFlightTimer = 0;
        this.lastEngineTime = 0;
        this.rotationInertia = 0;
        engineHeld = false;
    }
};

// Вертолеты (оптимизированные)
pipes = {
    position: [],
    top: {spriteX: 1001, spriteY: 0, spriteW: 104, spriteH: 800, x: 0, y: 0, w: 0, h: 0},
    bottom: {spriteX: 1105, spriteY: 0, spriteW: 104, spriteH: 800, x: 0, y: 0, w: 0, h: 0},
    helicopterFrame: 0, helicopterFrameCount: 3, helicopterFrameTick: 0,
    // Понижаем скорость смены кадров вертолёта на 50%
    helicopterFrameTickMax: isMobile ? 84 : 44,
    helicopterSpriteW: 256, helicopterSpriteH: 320,
    helicopterDrawW: 96, helicopterDrawH: 48,
    dx: 0, gap: 0, maxYPos: 0, scored: false,
    nextHelicopterFrame: 80,

    draw: function() {
        this.helicopterFrameTick++;
        if (this.helicopterFrameTick >= this.helicopterFrameTickMax) {
            this.helicopterFrame = (this.helicopterFrame + 1) % this.helicopterFrameCount;
            this.helicopterFrameTick = 0;
        }

        const frameHeight = 394;
        const spriteW = 360;
        const spriteH = 306;
        const drawW = Math.round(spriteW / 1.5) * 0.8 * 1.1;
        const drawH = Math.round(spriteH / 1.5) * 0.8 * 1.1;

        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topYPos = p.y;
            ctx.drawImage(helicopter_sprite, 0, this.helicopterFrame * frameHeight, spriteW, spriteH, p.x, topYPos, drawW, drawH);
        }
    },

    update: function(deltaTime) {
        if(state.current != state.game) return;
        this._pipeTimer = this._pipeTimer || 0;
        this._pipeTimer += (deltaTime ? deltaTime * 60 : 1);
        if(this._pipeTimer >= 80) {
            this.position.push({
                x: cvs.width,
                y: Math.random() * (cvs.height * 0.3),
                scored: false
            });
            this._pipeTimer = 0;
        }
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx * (deltaTime ? deltaTime * 60 : 1);
            if (this.position.length == 6) {
                this.position.splice(0, 2);
            }
            if (p.x + this.w < bird.x - bird.radius_x && !p.scored) {
                score.game_score++;
                if(!mute) POINT.play();
                if(score.game_score > score.best_score) {
                    score.best_score = score.game_score;
                    score.new_best_score = true;
                }
                localStorage.setItem("best_score", score.best_score);
                p.scored = true;
            }
        }
    },

    pipesReset: function() {
        this.position = [];
        this.nextHelicopterFrame = frames + 400;
    }
};

// Функции обновления и отрисовки
function update(deltaTime) {
    if (state.current == state.game) {
        if (engineHeld) {
            bird.flap(deltaTime);
            bird.isReleased = false;
        } else if (!bird.isReleased) {
            bird.release(deltaTime);
            bird.isReleased = true;
        }
    }
    if(!gamePaused) {
        bird.update(deltaTime);
        foreground.update(deltaTime);
        pipes.update(deltaTime);
        background.update(); // Обновляем фон
    }
    home.update(deltaTime);
}

function draw() {
    if (!cvs) return;
    // Проверяем загрузку всех ключевых спрайтов
    if (!sprite_sheet.complete || !mori_model_sprite.complete || background_day_img.hasError || earth_img.hasError) {
        ctx.fillStyle = "#7BC5CD";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        if (background_day_img.hasError) {
            ctx.fillText("Ошибка загрузки background_day_img", cvs.width / 2, cvs.height / 2);
        } else if (earth_img.hasError) {
            ctx.fillText("Ошибка загрузки earth_img", cvs.width / 2, cvs.height / 2);
        } else {
            ctx.fillText("Loading...", cvs.width / 2, cvs.height / 2);
        }
        return;
    }
    
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
    score.draw();
} 
window.draw = draw; 