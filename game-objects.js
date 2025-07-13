// Игровые объекты (оптимизированные)

// Фон
const background = {
    day_spriteX: 0,
    night_spriteX: 1211,
    spriteY: 392,
    spriteW: 552,
    spriteH: 408,
    x: 0, y: 0, w: 0, h: 0,
    stars: {
        spriteX: 1211, spriteY: 0,
        spriteW: 552, spriteH: 392,
        y: 0, h: 0
    },
    draw: function() {
        let spriteX = night ? this.night_spriteX : this.day_spriteX;
        ctx.drawImage(sprite_sheet, spriteX, this.spriteY, this.spriteW, this.spriteH, this.x, this.y, this.w, this.h);
        if(night) {
            ctx.drawImage(sprite_sheet, this.stars.spriteX, this.stars.spriteY, this.stars.spriteW, this.stars.spriteH, this.x, this.stars.y, this.w, this.stars.h);
        }
    }
};

// Передний план
const foreground = {
    spriteX: 553, spriteY: 576, spriteW: 447, spriteH: 224,
    x: 0, y: 0, w: 0, h: 0, dx: 0,
    draw: function() {
        ctx.drawImage(sprite_sheet, this.spriteX, this.spriteY, this.spriteW, this.spriteH, this.x, this.y, this.w, this.h);
        ctx.drawImage(sprite_sheet, this.spriteX, this.spriteY, this.spriteW, this.spriteH, (this.x + this.w)-0.7, this.y, this.w, this.h);
    },
    update: function() {
        if(state.current != state.gameOver) {
            this.x = (this.x - this.dx) % (this.w/2);
        }
    }
};

// Ракета (оптимизированная)
const bird = {
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

    flap: function() {
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
    
    release: function() {
        this.engineThrust = 0;
        this.targetRotation = 8 * Math.PI/180;
    },

    update: function() {
        if (state.current == state.getReady) {
            this.period = isMobile ? 6 : 9;
        } else if (state.current == state.game) {
            const speedFactor = Math.abs(this.velocityY) / this.maxSpeed;
            const basePeriod = isMobile ? 3 : 5;
            this.period = Math.max(1, Math.min(basePeriod, 6 - speedFactor * 3));
        } else {
            this.period = isMobile ? 4 : 6;
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
                this.engineCooldown--;
            }
            
            if (state.current == state.game) {
                this.autoFlightTimer++;
                if (this.autoFlightTimer > this.autoFlightDelay && this.velocityY > 0) {
                    this.velocityY -= this.autoFlightPower;
                }
                if (Math.abs(this.velocityY) < this.maxSpeed * 0.3) {
                    this.targetRotation *= 0.95;
                }
            }
            
            if (this.engineThrust > 0) {
                this.velocityY -= this.engineThrust * this.enginePower;
                this.engineThrust *= this.thrustDecay;
            }
            
            this.velocityY += this.acceleration;
            
            if (this.velocityY > this.maxSpeed) {
                this.velocityY = this.maxSpeed;
            }
            if (this.velocityY < this.minSpeed) {
                this.velocityY = this.minSpeed;
            }
            
            this.y += this.velocityY;

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
            this.rotationInertia += rotationDiff * this.rotationSpeed;
            this.rotationInertia = Math.max(-this.maxRotationInertia, Math.min(this.maxRotationInertia, this.rotationInertia));
            this.rotation += this.rotationInertia;
            this.rotationInertia *= 0.95;

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
const pipes = {
    position: [],
    top: {spriteX: 1001, spriteY: 0, spriteW: 104, spriteH: 800, x: 0, y: 0, w: 0, h: 0},
    bottom: {spriteX: 1105, spriteY: 0, spriteW: 104, spriteH: 800, x: 0, y: 0, w: 0, h: 0},
    helicopterFrame: 0, helicopterFrameCount: 3, helicopterFrameTick: 0,
    helicopterFrameTickMax: isMobile ? 5 : 7,
    helicopterSpriteW: 256, helicopterSpriteH: 320,
    helicopterDrawW: 96, helicopterDrawH: 48,
    dx: 0, gap: 0, maxYPos: 0, scored: false,

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

    update: function() {
        if(state.current != state.game) return;

        if(frames%80 == 0) {
            this.position.push({
                x: cvs.width,
                y: Math.random() * (cvs.height * 0.3),
                scored: false
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            if(bird.x + bird.radius_x > p.x && bird.x - bird.radius_x < p.x + this.w &&
               bird.y + bird.radius_y > p.y && bird.y - bird.radius_y < p.y + this.h) {
                state.current = state.gameOver;
                if(!mute) {
                    HIT.play();
                    setTimeout(function() {
                        if (state.current == state.gameOver) {
                            DIE.currentTime = 0;
                            DIE.play();
                        }
                    }, 500)
                }
            }
            
            if(bird.x + bird.radius_x > p.x && bird.x - bird.radius_x < p.x + this.w && bird.y <= 0) {
                state.current = state.gameOver;
                if(!mute) {
                    HIT.play();
                    setTimeout(function() {
                        if (state.current == state.gameOver) {
                            DIE.currentTime = 0;
                            DIE.play();
                        }
                    }, 500)   
                }   
            }

            p.x -= this.dx;

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
    }
};

// Функции обновления и отрисовки
function update() {
    if (state.current == state.game) {
        if (engineHeld) {
            bird.flap();
            bird.isReleased = false;
        } else if (!bird.isReleased) {
            bird.release();
            bird.isReleased = true;
        }
    }
    if(!gamePaused) {
        bird.update();
        foreground.update();
        pipes.update();
    }
    home.update();
}

function draw() {
    if (!cvs) return;
    if (!sprite_sheet.complete) {
        ctx.fillStyle = "#7BC5CD";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Loading...", cvs.width / 2, cvs.height / 2);
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