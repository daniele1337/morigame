// Игровые объекты (оптимизированные)

// Новый дневной фон
const background_day_img = new Image();
background_day_img.src = "img/separated/background_day.png";

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
    speed: 90, // было 60 — скорость движения фона (пикселей в секунду)
    draw: function() {
        if (!night) {
            let w = this.w * 2; // растягиваем фон в 2 раза шире canvas
            let h = cvs.height; // высота фона до земли
            let x1 = -this.offsetX % w;
            ctx.drawImage(background_day_img, x1, 0, w, h);
            ctx.drawImage(background_day_img, x1 + w, 0, w, h);
        } else {
            ctx.drawImage(sprite_sheet, this.night_spriteX, this.spriteY, this.spriteW, this.spriteH, this.x, this.y, this.w, this.h);
            ctx.drawImage(sprite_sheet, this.stars.spriteX, this.stars.spriteY, this.stars.spriteW, this.stars.spriteH, this.x, this.stars.y, this.w, this.stars.h);
        }
    },
    update: function(delta) {
        if (!night) {
            this.offsetX += this.speed * (delta || 1);
        } else {
            this.offsetX = 0;
        }
    }
};

// Передний план
// Удаляем загрузку earth_img и все упоминания earth.png
// foreground теперь просто объект для совместимости, не рисует землю
foreground = {
    spriteX: 553, spriteY: 576, spriteW: 447, spriteH: 224,
    x: 0, y: 0, w: 0, h: 0, dx: 0,
    draw: function() {
        // Больше ничего не рисуем
    },
    update: function(delta) {
        if(state.current != state.gameOver) {
            this.x = (this.x - this.dx * (delta || 1)) % (this.w/2);
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
    frameTime: 0, // для анимации по времени

    draw: function() {
        if (!birdVisible) return;
        if (typeof explosionActive !== 'undefined' && explosionActive) return;
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

    update: function(delta) {
        if (state.current == state.getReady) {
            this.period = isMobile ? 72 : 56; // Ещё медленнее (ещё на 50%)
        } else if (state.current == state.game) {
            const speedFactor = Math.abs(this.velocityY) / this.maxSpeed;
            const basePeriod = isMobile ? 48 : 32; // Ещё медленнее (ещё на 50%)
            this.period = Math.max(16, Math.min(basePeriod, 72 - speedFactor * 18));
        } else {
            this.period = isMobile ? 48 : 36; // Ещё медленнее (ещё на 50%)
        }
        
        // Анимация кадров птицы по времени
        this.frameTime += delta;
        let framePeriod = 0.08; // 0.08 сек = 12.5 кадров/сек (подберите под нужную скорость)
        if (this.frameTime > framePeriod) {
            this.frame = (this.frame + 1) % this.animation.length;
            this.frameTime = 0;
        }

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
                this.engineCooldown -= (delta || 1);
                if (this.engineCooldown < 0) this.engineCooldown = 0;
            }
            
            if (state.current == state.game) {
                this.autoFlightTimer += (delta || 1);
                if (this.autoFlightTimer > this.autoFlightDelay && this.velocityY > 0) {
                    this.velocityY -= this.autoFlightPower * (delta || 1);
                }
                if (Math.abs(this.velocityY) < this.maxSpeed * 0.3) {
                    this.targetRotation *= 0.95;
                }
            }
            
            if (this.engineThrust > 0) {
                this.velocityY -= this.engineThrust * this.enginePower * (delta || 1);
                this.engineThrust *= Math.pow(this.thrustDecay, (delta || 1));
            }
            
            this.velocityY += this.acceleration * (delta || 1);
            
            if (this.velocityY > this.maxSpeed) {
                this.velocityY = this.maxSpeed;
            }
            if (this.velocityY < this.minSpeed) {
                this.velocityY = this.minSpeed;
            }
            
            this.y += this.velocityY * (delta || 1);

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

            if(this.y + this.h/2 >= cvs.height) {
                this.y = cvs.height - this.h/2;
                if(state.current == state.game) {
                    state.current = state.gameOver;
                    // === ВЗРЫВ ===
                    explosionActive = true;
                    explosionX = this.x;
                    explosionY = this.y;
                    explosionTimer = 0;
                    birdVisible = true; // Сброс видимости птицы при взрыве
                    // === КОНЕЦ ===
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
        birdVisible = true;         // сброс видимости птицы
        explosionActive = false;    // сброс взрыва
        explosionTimer = 0;         // сброс таймера взрыва
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
    helicopterFrameTime: 0, // для анимации по времени
    spawnTimer: 0, // таймер появления
    spawnInterval: 2.5, // базовый интервал появления в секундах (эквивалентно 400 кадров при 160 FPS)

    draw: function() {
        this.helicopterFrameTime += (typeof window !== 'undefined' && window.lastDelta) ? window.lastDelta : 0.016;
        let framePeriod = 0.12; // было 0.08 сек = 8.3 кадров/сек (замедлено на 50%)
        if (this.helicopterFrameTime > framePeriod) {
            this.helicopterFrame = (this.helicopterFrame + 1) % this.helicopterFrameCount;
            this.helicopterFrameTime = 0;
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

    update: function(delta) {
        if(state.current != state.game) return;

        this.spawnTimer += delta;
        let interval = this.spawnInterval + (Math.random() - 0.5) * 0.4; // небольшой разброс
        if (this.spawnTimer >= interval) {
            // 40% шанс на движущийся по вертикали вертолёт
            let moveY = false, moveDir = 1, moveSpeed = 0;
            let moveCircle = false, circleAngle = 0, circleSpeed = 0, circleRadius = 0, circleCenterY = 0;
            let y = Math.random() * (cvs.height * 0.3);
            if (Math.random() < 0.1) {
                // 10% — круговая траектория
                moveCircle = true;
                circleAngle = Math.random() * Math.PI * 2;
                circleSpeed = 1.2 + Math.random() * 0.8; // радиан/сек
                circleRadius = (cvs.height - pipes.h) / 2;
                circleCenterY = circleRadius;
                y = circleCenterY + Math.sin(circleAngle) * circleRadius;
            } else if (Math.random() < 0.4/0.9) {
                // 40% от оставшихся — вертикальная траектория
                moveY = true;
                moveDir = Math.random() < 0.5 ? 1 : -1;
                moveSpeed = 60 + Math.random() * 60; // 60-120 пикселей/сек
                y = Math.random() * (cvs.height - pipes.h);
            }
            this.position.push({
                x: cvs.width,
                y: y,
                scored: false,
                moveY: moveY,
                moveDir: moveDir,
                moveSpeed: moveSpeed,
                moveCircle: moveCircle,
                circleAngle: circleAngle,
                circleSpeed: circleSpeed,
                circleRadius: circleRadius,
                circleCenterY: circleCenterY
            });
            this.spawnTimer = 0;
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            if(bird.x + bird.radius_x > p.x && bird.x - bird.radius_x < p.x + this.w &&
               bird.y + bird.radius_y > p.y && bird.y - bird.radius_y < p.y + this.h) {
                state.current = state.gameOver;
                // === ВЗРЫВ ===
                explosionActive = true;
                explosionX = bird.x;
                explosionY = bird.y;
                explosionTimer = 0;
                birdVisible = true; // Сброс видимости птицы при взрыве
                // === КОНЕЦ ===
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
                // === ВЗРЫВ ===
                explosionActive = true;
                explosionX = bird.x;
                explosionY = bird.y;
                explosionTimer = 0;
                birdVisible = true; // Сброс видимости птицы при взрыве
                // === КОНЕЦ ===
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

            p.x -= this.dx * (delta || 1);
            // Движение по вертикали для некоторых вертолётов
            if (p.moveY) {
                p.y += p.moveDir * p.moveSpeed * (delta || 1);
                // Границы: от 0 до foreground.y - this.h
                if (p.y < 0) { p.y = 0; p.moveDir = 1; }
                if (p.y > cvs.height - this.h) { p.y = cvs.height - this.h; p.moveDir = -1; }
            }
            // Движение по круговой траектории
            if (p.moveCircle) {
                p.circleAngle += p.circleSpeed * (delta || 1);
                if (p.circleAngle > Math.PI * 2) p.circleAngle -= Math.PI * 2;
                p.y = p.circleCenterY + Math.sin(p.circleAngle) * p.circleRadius;
            }

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

// === ДОБАВЛЯЕМ В НАЧАЛО ФАЙЛА ===
const explosion_img = new Image();
explosion_img.src = "img/separated/explosion.png";

// Переменная для хранения состояния взрыва
let explosionActive = false;
let explosionX = 0;
let explosionY = 0;
let explosionTimer = 0;
// === ВРЕМЯ ОТОБРАЖЕНИЯ ВЗРЫВА ===
const EXPLOSION_DURATION = 1.5; // секунды
// === Глобальные переменные для взрыва и видимости птицы ===
var birdVisible = true;
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// === МАССИВ ДИНАМИЧЕСКИХ МГУ ===
const mgu_img = new Image();
mgu_img.src = "img/separated/MGU.png";
const mguObstacleTemplate = {
    width: 403,
    height: 514
};
let mguObstacles = [];
let mguSpawnTimer = 0;
const mguSpawnInterval = 5; // секунд
// === ЗОНЫ КОЛЛИЗИИ ДЛЯ МГУ ===
const mguCollisionZones = [
  { x: 204, y: 65, w: 22, h: 94 },
  { x: 190.5, y: 159, w: 53, h: 50 },
  { x: 174, y: 210, w: 85, h: 107 },
  { x: 155, y: 318, w: 124, h: 80 },
  { x: 28, y: 398, w: 374, h: 159 }
];
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// === Функция для отрисовки взрыва ===
function drawExplosion() {
    if (explosionActive) {
        // Используем старый фрагмент: sx=659, sy=177, sw=459, sh=442
        const sx = 659, sy = 177, sw = 459, sh = 442;
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(
            explosion_img,
            sx, sy, sw, sh,
            explosionX - sw/2, explosionY - sh/2,
            sw, sh
        );
        ctx.restore();
    }
}

// === В update-цикле ===
function updateExplosion(delta) {
    if (explosionActive) {
        explosionTimer += delta;
        if (explosionTimer > 0.7) { // 0.7 сек — длительность взрыва
            birdVisible = false;
        }
    }
}

// Функции обновления и отрисовки
function update(delta) {
    if (explosionActive) {
        explosionTimer += delta;
        if (explosionTimer > EXPLOSION_DURATION) { // 3 секунды
            explosionActive = false;
        }
    }
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
        bird.update(delta);
        foreground.update(delta);
        pipes.update(delta);
        background.update(delta); // Обновляем фон
        // === СПАВН МГУ ===
        mguSpawnTimer += delta;
        if (mguSpawnTimer >= mguSpawnInterval) {
            if (Math.random() < 0.8) {
                mguObstacles.push({
                    x: cvs.width,
                    y: cvs.height - mguObstacleTemplate.height,
                    width: mguObstacleTemplate.width,
                    height: mguObstacleTemplate.height,
                    collisionZones: mguCollisionZones
                });
            }
            mguSpawnTimer = 0;
        }
        // === ДВИЖЕНИЕ МГУ ===
        for (let i = mguObstacles.length - 1; i >= 0; i--) {
            mguObstacles[i].x -= pipes.dx * (delta || 1);
            if (mguObstacles[i].x + mguObstacles[i].width < 0) {
                mguObstacles.splice(i, 1);
                continue;
            }
            // === ПРОВЕРКА КОЛЛИЗИИ С ПТИЦЕЙ ===
            if (state.current === state.game) {
                for (let zone of mguObstacles[i].collisionZones) {
                    let absX = mguObstacles[i].x + zone.x;
                    let absY = mguObstacles[i].y + zone.y;
                    // Прямоугольная коллизия: центр птицы внутри зоны
                    if (
                        bird.x + bird.radius_x > absX &&
                        bird.x - bird.radius_x < absX + zone.w &&
                        bird.y + bird.radius_y > absY &&
                        bird.y - bird.radius_y < absY + zone.h
                    ) {
                        state.current = state.gameOver;
                        explosionActive = true;
                        explosionX = bird.x;
                        explosionY = bird.y;
                        explosionTimer = 0;
                        if(!mute) {
                            HIT.play();
                            setTimeout(function() {
                                if (state.current == state.gameOver) {
                                    DIE.currentTime = 0;
                                    DIE.play();
                                }
                            }, 500)
                        }
                        break;
                    }
                }
            }
        }
    }
    home.update(delta);
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
    // === ОТРИСОВКА ВСЕХ МГУ ===
    for (let i = 0; i < mguObstacles.length; i++) {
        ctx.drawImage(mgu_img, mguObstacles[i].x, mguObstacles[i].y, mguObstacles[i].width, mguObstacles[i].height);
    }
    // === КОНЕЦ ===
    foreground.draw();
    // === НЕ РИСУЕМ ПЕРСОНАЖА, ЕСЛИ ВЗРЫВ ===
    if (!explosionActive) {
        bird.draw();
    }
    // === ОТРИСОВКА ВЗРЫВА ===
    if (explosionActive) {
        drawExplosion();
    }
    // === КОНЕЦ ===
    home.draw();
    getReady.draw();
    gameButtons.draw();
    gameOver.draw();
    score.draw();
} 