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
            let w = Math.round(this.w * 2);
            let h = Math.round(cvs.height);
            let x1 = Math.round(-this.offsetX % w);
            ctx.drawImage(background_day_img, x1, 0, w, h);
            ctx.drawImage(background_day_img, x1 + w, 0, w + 1, h); // +1 к ширине для перекрытия шва
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
            
            // В update: увеличиваем ускорение на 15%
            if (this.engineThrust > 0) {
                this.velocityY -= this.engineThrust * this.enginePower * 1.15 * (delta || 1);
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
                    console.log('GAME OVER: столкновение с землёй');
                    state.current = state.gameOver;
                    // === ВЗРЫВ ===
                    explosion_dx = pipes.dx;
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
    dx: 2, gap: 0, maxYPos: 0, scored: false,
    nextHelicopterFrame: 80,
    helicopterFrameTime: 0, // для анимации по времени
    spawnTimer: 0, // таймер появления
    spawnInterval: 2.5, // базовый интервал появления в секундах (эквивалентно 400 кадров при 160 FPS)

    draw: function() {
        this.helicopterFrameTime += (typeof window !== 'undefined' && window.lastDelta) ? window.lastDelta : 0.016;
        let framePeriod = 0.24; // было 0.12 сек, теперь в 2 раза медленнее
        if (this.helicopterFrameTime > framePeriod) {
            this.helicopterFrame = (this.helicopterFrame + 1) % this.helicopterFrameCount;
            this.helicopterFrameTime = 0;
        }

        const frameHeight = 394;
        const spriteW = 360;
        const spriteH = 306;
        const drawW = Math.round(spriteW / 1.5) * 0.8 * 1.1;
        const drawH = Math.round(spriteH / 1.5) * 0.8 * 1.1;
        this.w = drawW;
        this.h = drawH;
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            const frame = this.helicopterFrame || 0;
            const f = helicopterFrames[frame];
            const localDrawW = drawW;
            const localDrawH = drawW * (f.sh / f.sw);
            const topYPos = p.y;
            // === Актуальные размеры кадра ===
            // drawW оставляем прежним, drawH рассчитываем пропорционально кадру
            // === ОТРИСОВКА ВЕРТОЛЁТА ===
            if (typeof helicopter_sprite !== 'undefined' && helicopter_sprite.complete && helicopter_sprite.naturalWidth > 0) {
                ctx.drawImage(
                    helicopter_sprite,
                    f.sx, f.sy, f.sw, f.sh,
                    p.x, topYPos, localDrawW, localDrawH
                );
                // === ВИЗУАЛИЗАЦИЯ ЗОН КОЛЛИЗИИ ВЕРТОЛЁТА ===
                if (showCollisionTest) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = 'orange';
                    for (let zone of helicopterCollisionZones) {
                        let scaleX = localDrawW / f.sw;
                        let scaleY = localDrawH / f.sh;
                        ctx.fillRect(
                            p.x + zone.x * scaleX,
                            topYPos + zone.y * scaleY,
                            zone.w * scaleX,
                            zone.h * scaleY
                        );
                    }
                    ctx.restore();
                }
            }
        }
        // Удаляю тестовые прямоугольники:
        // ctx.fillStyle = 'lime';
        // ctx.fillRect(100, 100, 100, 100);
        // if (this.position.length > 0) {
        //     let p = this.position[0];
        //     ctx.fillStyle = 'blue';
        //     ctx.fillRect(p.x, p.y, drawW, drawH);
        // }
        // console.log('Размеры canvas:', cvs.width, cvs.height);
    },

    update: function(delta) {
        if(state.current != state.game) return;

        const spriteW = 360;
        const drawW = Math.round(spriteW / 1.5) * 0.8 * 1.1;
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
                // 10% шанс на ускоренный вертикальный вертолёт
                if (Math.random() < 0.1) {
                    moveSpeed *= 1.3;
                }
                y = Math.random() * (cvs.height - pipes.h);
            }
            const frameHeight = 394;
            const spriteH = 306;
            const drawH = Math.round(spriteH / 1.5) * 0.8 * 1.1;
            this.position.push({
                x: cvs.width + drawW, // появление заранее, за пределами экрана
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
            console.log('Вертолёт добавлен:', {x: cvs.width - drawW, y});
            console.log('Всего вертолётов:', this.position.length);
            this.spawnTimer = 0;
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            // === ДВИЖЕНИЕ ВЕРТОЛЁТА ===
            p.x -= this.dx * delta;

            // Вертикальное движение для 40% вертолётов
            if (p.moveY) {
                p.y += p.moveDir * p.moveSpeed * delta;
                // Отскок от границ (например, верх и низ экрана)
                if (p.y < 0) {
                    p.y = 0;
                    p.moveDir = 1;
                }
                if (p.y + this.h > cvs.height) {
                    p.y = cvs.height - this.h;
                    p.moveDir = -1;
                }
            }
            let foundCollision = false;
            // === В pipes.update: масштабируем зоны коллизии героя с учётом реального масштаба по высоте ===
            let scaleX = bird.w / birdSpriteW;
            let scaleY = (bird.h * 1.452) / birdSpriteH;
            for (let zone of bird.collisionZones) {
                let birdAbsX = bird.x - bird.w/2 + zone.x * scaleX;
                let birdAbsY = bird.y - (bird.h * 1.452)/2 + zone.y * scaleY;
                let zoneW = zone.w * scaleX;
                let zoneH = zone.h * scaleY;
               
            }
            if (foundCollision) continue;
            
            // === КОЛЛИЗИЯ С ВЕРТОЛЁТОМ (сложные зоны) ===
            const frame = this.helicopterFrame || 0;
            const f = helicopterFrames[frame];
            const localDrawW = drawW;
            const localDrawH = drawW * (f.sh / f.sw);
            const topYPos = p.y;
            for (let heliZone of helicopterCollisionZones) {
                let heliScaleX = localDrawW / f.sw;
                let heliScaleY = localDrawH / f.sh;
                let heliAbsX = p.x + heliZone.x * heliScaleX;
                let heliAbsY = topYPos + heliZone.y * heliScaleY;
                let heliZoneW = heliZone.w * heliScaleX;
                let heliZoneH = heliZone.h * heliScaleY;
                for (let birdZone of bird.collisionZones) {
                    let birdScaleX = bird.w / birdSpriteW;
                    let birdScaleY = (bird.h * 1.452) / birdSpriteH;
                    let birdAbsX = bird.x - bird.w/2 + birdZone.x * birdScaleX;
                    let birdAbsY = bird.y - (bird.h * 1.452)/2 + birdZone.y * birdScaleY;
                    let birdZoneW = birdZone.w * birdScaleX;
                    let birdZoneH = birdZone.h * birdScaleY;
                    if (
                        birdAbsX < heliAbsX + heliZoneW &&
                        birdAbsX + birdZoneW > heliAbsX &&
                        birdAbsY < heliAbsY + heliZoneH &&
                        birdAbsY + birdZoneH > heliAbsY
                    ) {
                        console.log('GAME OVER: столкновение с вертолётом (сложная зона)');
                        state.current = state.gameOver;
                        explosion_dx = this.dx;
                        explosionActive = true;
                        explosionX = bird.x;
                        explosionY = bird.y;
                        explosionTimer = 0;
                        birdVisible = false;
                        if(!mute) {
                            HIT.play();
                            setTimeout(function() {
                                if (state.current == state.gameOver) {
                                    DIE.currentTime = 0;
                                    DIE.play();
                                }
                            }, 500)
                        }
                        foundCollision = true;
                        break;
                    }
                }
                if (foundCollision) break;
            }
            
            if (p.x + this.w < bird.x - bird.radius_x && !p.scored) {
                console.log('Удаляем вертолёт:', {x: p.x, w: this.w, birdX: bird.x, birdRadiusX: bird.radius_x});
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
// === Размеры исходного спрайта главного героя ===
const birdSpriteW = 180, birdSpriteH = 136;
// === Для движения взрыва с фоном назад ===
let explosion_dx = 0;
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

// === ЗОНЫ КОЛЛИЗИИ ДЛЯ ГЛАВНОГО ГЕРОЯ ===
bird.collisionZones = [
  { x: 94, y: 0, w: 61, h: 70 },
  { x: 25, y: 69, w: 154, h: 66 }
];
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// === ПАРАМЕТРЫ КАДРОВ ВЕРТОЛЁТА ===
const helicopterFrames = [
    { sx: 0, sy: 0, sw: 360, sh: 305 },    // 1 кадр
    { sx: 0, sy: 390, sw: 360, sh: 306 },  // 2 кадр
    { sx: 0, sy: 785, sw: 360, sh: 319 }   // 3 кадр
];
// === ЗОНЫ КОЛЛИЗИИ ДЛЯ ВЕРТОЛЁТА ===
const helicopterCollisionZones = [
    { x: 0, y: 0, w: 360, h: 140 },
    { x: 44, y: 141, w: 112, h: 167 }
];
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// === Функция для отрисовки взрыва ===
function drawExplosion() {
    if (explosionActive) {
        // Используем старый фрагмент: sx=659, sy=177, sw=459, sh=442
        const sx = 659, sy = 177, sw = 459, sh = 442;
        // Смещение взрыва назад с той же скоростью, что и препятствие
        let dx = -explosion_dx * explosionTimer;
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(
            explosion_img,
            sx, sy, sw, sh,
            explosionX - sw/2 + dx, explosionY - sh/2,
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
                // === В pipes.update: масштабируем зоны коллизии героя с учётом реального масштаба по высоте ===
                let scaleX = bird.w / birdSpriteW;
                let scaleY = (bird.h * 1.452) / birdSpriteH;
                for (let zone of mguObstacles[i].collisionZones) {
                    let mguScaleX = mguObstacles[i].width / 403;
                    let mguScaleY = mguObstacles[i].height / 514;
                    let mguZoneAbsX = mguObstacles[i].x + zone.x * mguScaleX;
                    let mguZoneAbsY = mguObstacles[i].y + zone.y * mguScaleY;
                    let mguZoneW = zone.w * mguScaleX;
                    let mguZoneH = zone.h * mguScaleY;
                    for (let birdZone of bird.collisionZones) {
                        let scaleX = bird.w / birdSpriteW;
                        let scaleY = (bird.h * 1.452) / birdSpriteH;
                        let birdAbsX = bird.x - bird.w/2 + birdZone.x * scaleX;
                        let birdAbsY = bird.y - (bird.h * 1.452)/2 + birdZone.y * scaleY;
                        let zoneW = birdZone.w * scaleX;
                        let zoneH = birdZone.h * scaleY;
                        if (
                            birdAbsX < mguZoneAbsX + mguZoneW &&
                            birdAbsX + zoneW > mguZoneAbsX &&
                            birdAbsY < mguZoneAbsY + mguZoneH &&
                            birdAbsY + zoneH > mguZoneAbsY
                        ) {
                            console.log('GAME OVER: столкновение с МГУ');
                            state.current = state.gameOver;
                            explosionActive = true;
                            explosion_dx = pipes.dx;
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
    // === ВИЗУАЛИЗАЦИЯ ЗОН КОЛЛИЗИИ ГЕРОЯ ===
    if (showCollisionTest && typeof bird !== 'undefined' && birdVisible) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'cyan';
        for (let zone of bird.collisionZones) {
            let birdScaleX = bird.w / birdSpriteW;
            let birdScaleY = (bird.h * 1.452) / birdSpriteH;
            ctx.fillRect(
                bird.x - bird.w/2 + zone.x * birdScaleX,
                bird.y - (bird.h * 1.452)/2 + zone.y * birdScaleY,
                zone.w * birdScaleX,
                zone.h * birdScaleY
            );
        }
        ctx.restore();
    }
    // === ВИЗУАЛИЗАЦИЯ ЗОН КОЛЛИЗИИ МГУ ===
    if (showCollisionTest && typeof mguObstacles !== 'undefined' && mguObstacles.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'orange';
        for (let mgu of mguObstacles) {
            for (let zone of mguCollisionZones) {
                let scaleX = mgu.width ? mgu.width / mguObstacleTemplate.width : 1;
                let scaleY = mgu.height ? mgu.height / mguObstacleTemplate.height : 1;
                ctx.fillRect(
                    mgu.x + zone.x * scaleX,
                    mgu.y + zone.y * scaleY,
                    zone.w * scaleX,
                    zone.h * scaleY
                );
            }
        }
        ctx.restore();
    }
    // === Чекбокс только в главном меню ===
    if (typeof state !== 'undefined' && state.current === state.home) {
        drawCollisionCheckbox(ctx);
    }
} 

// === Глобальная переменная для теста коллизий ===
window.showCollisionTest = false;

// === Координаты чекбокса ===
const checkboxX = 60, checkboxY = 220, checkboxSize = 28;

// === Функция для отрисовки чекбокса ===
function drawCollisionCheckbox(ctx) {
    ctx.save();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(checkboxX, checkboxY, checkboxSize, checkboxSize);
    if (window.showCollisionTest) {
        ctx.beginPath();
        ctx.moveTo(checkboxX + 6, checkboxY + 14);
        ctx.lineTo(checkboxX + 12, checkboxY + 22);
        ctx.lineTo(checkboxX + 22, checkboxY + 6);
        ctx.stroke();
    }
    ctx.font = "20px Arial";
    ctx.fillStyle = "#222";
    ctx.fillText("Тест коллизий", checkboxX + 38, checkboxY + 22);
    ctx.restore();
}

// === Обработка клика по canvas для чекбокса ===
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    if (canvas) {
        canvas.addEventListener('click', function(e) {
            if (typeof state !== 'undefined' && state.current === state.home) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                if (
                    mouseX >= checkboxX && mouseX <= checkboxX + checkboxSize &&
                    mouseY >= checkboxY && mouseY <= checkboxY + checkboxSize
                ) {
                    window.showCollisionTest = !window.showCollisionTest;
                }
            }
        });
    }
}); 