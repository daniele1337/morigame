// Игровые объекты (оптимизированные)

// === ПЕРЕМЕННЫЕ ДЛЯ УСКОРЕНИЯ РАКЕТЫ ===
let baseHorizontalSpeed = 0; // Базовая горизонтальная скорость
let speedBoostMultiplier = 1.0; // Множитель ускорения
let lastSpeedBoostScore = 0; // Последний счет, при котором было ускорение
// === КОНЕЦ ПЕРЕМЕННЫХ УСКОРЕНИЯ ===

// === ФУНКЦИЯ ДЛЯ ПРОВЕРКИ И ПРИМЕНЕНИЯ УСКОРЕНИЯ ===
function checkAndApplySpeedBoost() {
    if (typeof score !== 'undefined' && typeof score.game_score !== 'undefined') {
        const currentScore = score.game_score;
        
        // Проверяем, достигли ли мы нового кратного 5 счета
        if (currentScore > 0 && currentScore % 5 === 0 && currentScore > lastSpeedBoostScore) {
            // Устанавливаем множитель ускорения на 70% от базовой скорости
            speedBoostMultiplier = 1.0 + (currentScore / 5) * 0.70;
            lastSpeedBoostScore = currentScore;
            
            // Применяем ускорение к горизонтальной скорости
            if (typeof pipes !== 'undefined' && typeof pipes.dx !== 'undefined' && typeof baseHorizontalSpeed !== 'undefined') {
                pipes.dx = baseHorizontalSpeed * speedBoostMultiplier;
            }
            
            console.log(`🚀 Ускорение активировано! Счет: ${currentScore}, Множитель: ${speedBoostMultiplier.toFixed(2)}, Скорость: ${pipes.dx.toFixed(1)}`);
        }
    }
}
// === КОНЕЦ ФУНКЦИИ УСКОРЕНИЯ ===

// === ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ МАСШТАБА ===
function getGameScale() {
    if (window.gameScale !== undefined) {
        return window.gameScale;
    }
    // Если gameScale ещё не установлен, вычисляем его
    if (cvs && cvs.height) {
        return Math.min(1, cvs.height / 800);
    }
    return 1; // По умолчанию
}
// === КОНЕЦ ДОБАВЛЕНИЯ ===

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
    spawnInterval: 3.31, // увеличено на 30% для уменьшения количества вертолётов на 15%

    draw: function() {
        if (state.current != state.game) return;
        this.helicopterFrameTime += (typeof window !== 'undefined' && window.lastDelta) ? window.lastDelta : 0.016;
        let framePeriod = 0.24; // было 0.12 сек, теперь в 2 раза медленнее
        if (this.helicopterFrameTime > framePeriod) {
            this.helicopterFrame = (this.helicopterFrame + 1) % this.helicopterFrameCount;
            this.helicopterFrameTime = 0;
        }

        const frameHeight = 394;
        const spriteW = 360;
        const spriteH = 306;
        const drawW = Math.round(spriteW / 1.5) * 0.8 * 1.1 * 0.8;
        const drawH = Math.round(spriteH / 1.5) * 0.8 * 1.1 * 0.8;
        this.w = drawW;
        this.h = drawH;
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            // === КОРРЕКТНОЕ ОБЪЯВЛЕНИЕ ПЕРЕМЕННЫХ ДЛЯ КАЖДОГО ВЕРТОЛЁТА ===
            const frame = this.helicopterFrame || 0;
            const f = helicopterFrames[frame];
            if (!f || !f.sw || !f.sh) continue; // защита от ошибок
            const localDrawW = Math.round(f.sw / 1.5) * 0.8 * 1.1 * 0.8;
            const localDrawH = localDrawW * (f.sh / f.sw);
            const topYPos = p.y;
            // === Удаление вертолёта, если он улетел за верх экрана ===
            if (p.flyAway && (p.y + this.h < 0)) {
                this.position.splice(i, 1);
                continue;
            }
            let foundCollision = false;
            // === КОЛЛИЗИЯ С ВЕРТОЛЁТОМ (две зоны) ===
            if (p.x > 0 && p.x < cvs.width) {
                for (let heliZone of helicopterCollisionZones) {
                    let scaleX = localDrawW / f.sw;
                    let scaleY = localDrawH / f.sh;
                    let heliAbsX = p.x + heliZone.x * scaleX;
                    let heliAbsY = p.y + heliZone.y * scaleY;
                    let heliZoneW = heliZone.w * scaleX;
                    let heliZoneH = heliZone.h * scaleY;
                    for (let birdZone of bird.collisionZones) {
                        let scaleXb = bird.w / birdSpriteW;
                        let scaleYb = (bird.h * 1.452) / birdSpriteH;
                        let birdAbsX = bird.x - bird.w/2 + birdZone.x * scaleXb;
                        let birdAbsY = bird.y - (bird.h * 1.452)/2 + birdZone.y * scaleYb;
                        let birdZoneW = birdZone.w * scaleXb;
                        let birdZoneH = birdZone.h * scaleYb;
                        let xOverlap = birdAbsX < heliAbsX + heliZoneW && birdAbsX + birdZoneW > heliAbsX;
                        let yOverlap = birdAbsY < heliAbsY + heliZoneH && birdAbsY + birdZoneH > heliAbsY;
                        if (xOverlap && yOverlap) {
                            console.log('СТОЛКНОВЕНИЕ С ВЕРТОЛЁТОМ!');
                            console.log('Птица:', {x: bird.x, y: bird.y, w: bird.w, h: bird.h});
                            console.log('Вертолёт:', {x: p.x, y: p.y, w: localDrawW, h: localDrawH});
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
                            // === ЛОГ ДЛЯ ВЗРЫВА ===
                            console.log('ВЗРЫВ: столкновение с ВЕРТОЛЁТОМ');
                            break;
                        }
                    }
                    if (foundCollision) break;
                }
            }
            if (foundCollision) continue;
            
            // Нарисовать спрайт вертолёта (если есть изображение)
            if (typeof helicopter_sprite !== 'undefined' && helicopter_sprite.complete) {
                ctx.drawImage(
                    helicopter_sprite,
                    f.sx, f.sy, f.sw, f.sh,
                    p.x, p.y, localDrawW, localDrawH
                );
            }

            // Нарисовать красную рамку для отладки
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.strokeRect(p.x, p.y, localDrawW, localDrawH);
            ctx.restore();

            // Визуализация зон коллизии вертолёта
            if (window.showCollisionTest) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = 'orange';
                for (let heliZone of helicopterCollisionZones) {
                    let scaleX = localDrawW / f.sw;
                    let scaleY = localDrawH / f.sh;
                    ctx.fillRect(
                        p.x + heliZone.x * scaleX,
                        p.y + heliZone.y * scaleY,
                        heliZone.w * scaleX,
                        heliZone.h * scaleY
                    );
                }
                ctx.restore();
            }
        }
    },

    update: function(delta) {
        if(state.current != state.game) return;

        const spriteW = 360;
        const drawW = Math.round(spriteW / 1.5) * 0.8 * 1.1 * 0.8;
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
            const drawH = Math.round(spriteW / 1.5) * 0.8 * 1.1 * 0.8;
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
                circleCenterY: circleCenterY,
                flyAway: false // флаг улёта
            });
            this.spawnTimer = 0;
        }
        // === ДВИЖЕНИЕ ВЕРТОЛЁТОВ ===
        for(let i = this.position.length - 1; i >= 0; i--) {
            let p = this.position[i];
            if (p.flyAway) {
                p.y -= (p.flyAwaySpeed || 400) * delta;
            } else {
                p.x -= this.dx * delta;
                // Вертикальное движение для 40% вертолётов
                if (p.moveY) {
                    p.y += p.moveDir * p.moveSpeed * delta;
                    if (p.y < 0) {
                        p.y = 0;
                        p.moveDir = 1;
                    }
                    if (p.y + this.h > cvs.height) {
                        p.y = cvs.height - this.h;
                        p.moveDir = -1;
                    }
                }
            }
        }
        // === Проверка близости к Останкино ===
        const spriteW2 = 256;
        const drawW2 = Math.round(spriteW2 / 1.5) * 0.8 * 1.1 * 0.8;
        if (Array.isArray(ostankinoObstacles)) {
            for(let i = this.position.length - 1; i >= 0; i--) {
                let p = this.position[i];
                if (!p.flyAway) {
                    for (let j = 0; j < ostankinoObstacles.length; j++) {
                        let ost = ostankinoObstacles[j];
                        let heliCenterX = p.x + drawW2 / 2;
                        let heliCenterY = p.y + this.h / 2;
                        let ostTopX = ost.x + ost.width / 2;
                        let ostTopY = ost.y;
                        // Проверка попадания в квадрат 300х300 вокруг вершины Останкино
                        if (Math.abs(heliCenterX - ostTopX) < 300 && Math.abs(heliCenterY - ostTopY) < 300) {
                            p.flyAway = true;
                            p.flyAwaySpeed = 400 + Math.random() * 100; // px/sec
                            break;
                        }
                    }
                }
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
    get width() { return cvs.width * 0.605; }, // 0.55 * 1.1
    get height() { return cvs.height * 0.6798; } // 0.618 * 1.1
};
let mguObstacles = [];
let mguSpawnTimer = 0;
let mguSpawnInterval = 4 + Math.random() * 3; // 4-7 секунд
let lubyankaSpawnTimer = 0;
let lubyankaSpawnInterval = 4 + Math.random() * 3; // 4-7 секунд
// === ЗОНЫ КОЛЛИЗИИ ДЛЯ МГУ ===
// Относительные значения (от 0 до 1)
const mguCollisionZones = [
  { x: 0.481, y: 0.113, w: 0.052, h: 0.163 },
  { x: 0.448, y: 0.275, w: 0.125, h: 0.086 },
  { x: 0.410, y: 0.363, w: 0.201, h: 0.185 },
  { x: 0.366, y: 0.550, w: 0.292, h: 0.138 },
  { x: 0.066, y: 0.688, w: 0.882, h: 0.275 }
];

// Функция для получения абсолютных координат коллизий МГУ
function getMguCollisionRects(mgu) {
  // mgu: {x, y, width, height}
  return mguCollisionZones.map(zone => ({
    x: mgu.x + zone.x * mgu.width,
    y: mgu.y + zone.y * mgu.height,
    w: zone.w * mgu.width,
    h: zone.h * mgu.height
  }));
}
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// === МАССИВ ДИНАМИЧЕСКИХ ЛУБЯНОК ===
const lubyanka_img = new Image();
lubyanka_img.src = "img/separated/Lubyanka.png";
const lubyankaObstacleTemplate = {
    get width() { return cvs.width * 1.28; },
    get height() { return cvs.height * 0.52; }
};
let lubyankaObstacles = [];
// === ЗОНЫ КОЛЛИЗИИ ДЛЯ ЛУБЯНКИ ===
// Теперь все зоны рассчитываются по исходной ширине текстуры 1381px и высоте 768px
const lubyankaSpriteWidth = 1381;
const lubyankaSpriteHeight = 768;
const lubyankaCollisionZones = [
  { x: 0, y: 203/lubyankaSpriteHeight, w: 124/lubyankaSpriteWidth, h: 774/lubyankaSpriteHeight },   // 1 — у левого края
  // 2-й фрагмент: растягиваем вверх до верхней границы 4-го
  { x: 144/lubyankaSpriteWidth, y: 243/lubyankaSpriteHeight, w: 1190/lubyankaSpriteWidth, h: (329-243+439)/lubyankaSpriteHeight }, // 2
  { x: 1 - 88/lubyankaSpriteWidth, y: 206/lubyankaSpriteHeight, w: 88/lubyankaSpriteWidth, h: 562/lubyankaSpriteHeight },  // 3 — у правого края
  // Сдвинутые фрагменты:
  { x: (lubyankaSpriteWidth/2 - 247/2)/lubyankaSpriteWidth, y: 243/lubyankaSpriteHeight, w: 247/lubyankaSpriteWidth, h: 90/lubyankaSpriteHeight },   // 4
  { x: (lubyankaSpriteWidth/2 - 155/2)/lubyankaSpriteWidth, y: 181/lubyankaSpriteHeight, w: 155/lubyankaSpriteWidth, h: 62/lubyankaSpriteHeight },   // 5
  { x: (lubyankaSpriteWidth/2 - 114/2)/lubyankaSpriteWidth, y: 165/lubyankaSpriteHeight, w: 114/lubyankaSpriteWidth, h: 18/lubyankaSpriteHeight },   // 6
  { x: (lubyankaSpriteWidth/2 - 92/2)/lubyankaSpriteWidth, y: 155/lubyankaSpriteHeight, w: 92/lubyankaSpriteWidth, h: 10/lubyankaSpriteHeight },    // 7
  { x: (lubyankaSpriteWidth/2 - 78/2)/lubyankaSpriteWidth, y: 144/lubyankaSpriteHeight, w: 78/lubyankaSpriteWidth, h: 11/lubyankaSpriteHeight },    // 8
  { x: (lubyankaSpriteWidth/2 - 60/2)/lubyankaSpriteWidth, y: 132/lubyankaSpriteHeight, w: 60/lubyankaSpriteWidth, h: 12/lubyankaSpriteHeight },    // 9
  { x: (lubyankaSpriteWidth/2 - 51/2)/lubyankaSpriteWidth, y: 113/lubyankaSpriteHeight, w: 51/lubyankaSpriteWidth, h: 19/lubyankaSpriteHeight },    // 10
  { x: (lubyankaSpriteWidth/2 - 38/2)/lubyankaSpriteWidth, y: 98/lubyankaSpriteHeight, w: 38/lubyankaSpriteWidth, h: 15/lubyankaSpriteHeight },     // 11
  { x: (lubyankaSpriteWidth/2 - 6/2)/lubyankaSpriteWidth, y: 51/lubyankaSpriteHeight, w: 6/lubyankaSpriteWidth, h: 47/lubyankaSpriteHeight }        // 12
];
// Функция для получения абсолютных координат коллизий Лубянки
function getLubyankaCollisionRects(lubyanka) {
  return lubyankaCollisionZones.map(zone => ({
    x: lubyanka.x + zone.x * lubyanka.width,
    y: lubyanka.y + zone.y * lubyanka.height,
    w: zone.w * lubyanka.width,
    h: zone.h * lubyanka.height
  }));
}
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// === ОСТАНКИНСКАЯ БАШНЯ ===
const ostankino_img = new Image();
ostankino_img.src = "img/separated/OstankinoTowe1r.png";
const ostankinoObstacleTemplate = {
    get width() { return cvs.width * 0.24; },
    get height() { return cvs.height * 0.96; }
};
let ostankinoObstacles = [];
let ostankinoSpawnTimer = 0;
let ostankinoSpawnInterval = 4 + Math.random() * 3;
// Переведённые в относительные координаты (от 0 до 1)
const ostankinoCollisionZones = [
    { x: 121/256, y: 332/878, w: 44/256, h: 436/878 },
    { x: 131/256, y: 142/878, w: 17/256, h: 189/878 }
];
// Функция для получения абсолютных координат коллизий Останкино
function getOstankinoCollisionRects(ostankino) {
  return ostankinoCollisionZones.map(zone => ({
    x: ostankino.x + zone.x * ostankino.width,
    y: ostankino.y + zone.y * ostankino.height,
    w: zone.w * ostankino.width,
    h: zone.h * ostankino.height
  }));
}
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// === ЗОНЫ КОЛЛИЗИИ ДЛЯ ГЛАВНОГО ГЕРОЯ ===
bird.collisionZones = [
  { 
    get x() { return 94 * getGameScale(); },
    get y() { return 0 * getGameScale(); },
    get w() { return 61 * getGameScale(); },
    get h() { return 70 * getGameScale(); }
  },
  { 
    get x() { return 25 * getGameScale(); },
    get y() { return 69 * getGameScale(); },
    get w() { return 154 * getGameScale(); },
    get h() { return 66 * getGameScale(); }
  }
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
    {
        get x() { return 0 * getHelicopterScaleX(); },
        get y() { return 0 * getHelicopterScaleY(); },
        get w() { return 360 * getHelicopterScaleX(); },
        get h() { return 134 * getHelicopterScaleY(); }
    },
    {
        get x() { return 43 * getHelicopterScaleX(); },
        get y() { return 135 * getHelicopterScaleY(); },
        get w() { return 114 * getHelicopterScaleX(); },
        get h() { return 169 * getHelicopterScaleY(); }
    }
];
// Функции масштабирования для вертолёта
function getHelicopterScaleX() {
    // Оригинальная ширина спрайта: 360
    // Текущая ширина drawW (используется в движении и отрисовке)
    const spriteW = 360;
    // drawW вычисляется как: Math.round(spriteW / 1.5) * 0.8 * 1.1;
    // Но для универсальности берём текущий drawW из кода, если есть
    if (typeof getCurrentHelicopterDrawW === 'function') {
        return getCurrentHelicopterDrawW() / spriteW;
    }
    return 1;
}
function getHelicopterScaleY() {
    // Оригинальная высота спрайта: 320 (по изображению), но для коллизии берём максимальную Y+H
    // drawH вычисляется аналогично drawW, но с учётом пропорций
    // Для универсальности возвращаем тот же коэффициент, что и по X (если пропорции не меняются)
    if (typeof getCurrentHelicopterDrawH === 'function') {
        return getCurrentHelicopterDrawH() / 320;
    }
    return 1;
}
// Для совместимости: если drawW/drawH вычисляются динамически, можно добавить функции getCurrentHelicopterDrawW/H
// === КОНЕЦ ДОБАВЛЕНИЯ ===

// === Функция для отрисовки взрыва ===
function drawExplosion() {
    if (explosionActive) {
        // Используем старый фрагмент: sx=659, sy=177, sw=459, sh=442
        const sx = 659, sy = 177, sw = 459, sh = 442;
        // Смещение взрыва назад с той же скоростью, что и препятствие
        let dx = -explosion_dx * explosionTimer;
        // === АНИМАЦИЯ ИСЧЕЗНОВЕНИЯ ===
        let alpha = 0.8 * (1 - explosionTimer / EXPLOSION_DURATION);
        if (alpha < 0) alpha = 0;
        ctx.save();
        ctx.globalAlpha = alpha;
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

function checkCollisionZones(newX, newY, newW, newH, newZones, existingObstacles, existingTemplate, existingZones, zonesAreAbsolute = false) {
    for (let obj of existingObstacles) {
        for (let ez of existingZones) {
            // Если зоны абсолютные (МГУ) — не прибавляем obj.x/obj.y
            let ezX = zonesAreAbsolute ? ez.x : obj.x + ez.x;
            let ezY = zonesAreAbsolute ? ez.y : obj.y + ez.y;
            let ezW = ez.w;
            let ezH = ez.h;
            for (let nz of newZones) {
                // Масштабируем зоны птицы относительно её размера
                let birdScaleX = newW / birdSpriteW;
                let birdScaleY = (newH * 1.452) / birdSpriteH;
                let nzX = newX + nz.x * birdScaleX;
                let nzY = newY + nz.y * birdScaleY;
                let nzW = nz.w * birdScaleX;
                let nzH = nz.h * birdScaleY;
                if (
                    nzX < ezX + ezW &&
                    nzX + nzW > ezX &&
                    nzY < ezY + ezH &&
                    nzY + nzH > ezY
                ) {
                    // Детальный лог для диагностики
                    console.log('=== ДЕТАЛЬНАЯ ДИАГНОСТИКА КОЛЛИЗИИ ===');
                    console.log('Координаты объекта:', obj.x, obj.y, obj.width, obj.height);
                    console.log('Координаты зоны объекта:', ezX, ezY, ezW, ezH);
                    console.log('Координаты птицы:', newX, newY, newW, newH);
                    console.log('Координаты зоны птицы:', nzX, nzY, nzW, nzH);
                    console.log('Масштаб птицы:', birdScaleX, birdScaleY);
                    console.log('==========================================');
                    return true;
                }
            }
        }
    }
    return false;
}

// === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОБЪЕДИНЕНИЯ ВСЕХ ЗДАНИЙ ===
function getAllObstacles() {
    return [...mguObstacles, ...lubyankaObstacles, ...ostankinoObstacles];
}

// Функции обновления и отрисовки
function update(delta) {
    // Проверяем паузу
    if (typeof gamePaused !== 'undefined' && gamePaused) {
        return; // Выходим из функции, если игра на паузе
    }
    
    if (explosionActive) {
        updateExplosion(delta);
        return;
    }
    coins.update(delta); // монеты не трогаем
    bird.update(delta);
    foreground.update(delta);
    // === ДВИЖЕНИЕ И СПАВН МГУ ===
    for (let i = mguObstacles.length - 1; i >= 0; i--) {
        let mgu = mguObstacles[i];
        mgu.x -= pipes.dx * (delta || 1);
        // Проверка на пересечение с другими зданиями
        let otherBuildings = [...lubyankaObstacles, ...ostankinoObstacles];
        let collision = false;
        for (let other of otherBuildings) {
            if (
                mgu.x < other.x + other.width &&
                mgu.x + mgu.width > other.x &&
                mgu.y < other.y + other.height &&
                mgu.y + mgu.height > other.y
            ) {
                collision = true;
                break;
            }
        }
        if (collision) {
            mguObstacles.splice(i, 1);
            continue;
        }
        if (mgu.x < -mgu.width) {
            mguObstacles.splice(i, 1);
            continue;
        }
        if (mgu.x < cvs.width && mgu.x + mgu.width > 0) {
            if (state.current == state.game &&
                checkCollisionZones(
                    bird.x - bird.w/2, bird.y - bird.h/2, bird.w, bird.h, bird.collisionZones,
                    [mgu], mguObstacleTemplate, getMguCollisionRects(mgu), true // <--- передаём true для абсолютных зон
                )
            ) {
                console.log('Коллизия с МГУ! Птица:', bird.x, bird.y, 'размеры:', bird.w, bird.h, 'МГУ:', mgu.x, mgu.y, 'размеры:', mgu.width, mgu.height);
                console.log('Масштаб игры:', getGameScale());
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
                // === ЛОГ ДЛЯ ВЗРЫВА ===
                console.log('ВЗРЫВ: столкновение с МГУ');
            }
        }
    }
    mguSpawnTimer += delta;
    if (mguSpawnTimer >= mguSpawnInterval) {
        let x = cvs.width;
        let y = cvs.height - mguObstacleTemplate.height;
        let onlyBuildings = [...mguObstacles, ...lubyankaObstacles, ...ostankinoObstacles];
        // Проверка минимального расстояния между зданиями
        let canSpawn = true;
        for (let other of onlyBuildings) {
            let centerNew = x + mguObstacleTemplate.width / 2;
            let centerOther = other.x + other.width / 2;
            let minDist = (mguObstacleTemplate.width / 2) + (other.width / 2);
            if (Math.abs(centerNew - centerOther) < minDist) {
                canSpawn = false;
                break;
            }
        }
        let overlaps = checkCollisionZones(
            x, y, mguObstacleTemplate.width, mguObstacleTemplate.height, getMguCollisionRects({x, y, width: mguObstacleTemplate.width, height: mguObstacleTemplate.height}),
            onlyBuildings, mguObstacleTemplate, getMguCollisionRects({x, y, width: mguObstacleTemplate.width, height: mguObstacleTemplate.height})
        );
        if (!overlaps && canSpawn) {
            mguObstacles.push({
                x: x,
                y: y,
                width: mguObstacleTemplate.width,
                height: mguObstacleTemplate.height
            });
        }
        mguSpawnTimer = 0;
        mguSpawnInterval = 4 + Math.random() * 3;
    }

    // === ДВИЖЕНИЕ И СПАВН ЛУБЯНКИ ===
    for (let i = lubyankaObstacles.length - 1; i >= 0; i--) {
        let lubyanka = lubyankaObstacles[i];
        lubyanka.x -= pipes.dx * (delta || 1);
        // Проверка на пересечение с другими зданиями
        let otherBuildings = [...mguObstacles, ...ostankinoObstacles];
        let collision = false;
        for (let other of otherBuildings) {
            if (
                lubyanka.x < other.x + other.width &&
                lubyanka.x + lubyanka.width > other.x &&
                lubyanka.y < other.y + other.height &&
                lubyanka.y + lubyanka.height > other.y
            ) {
                collision = true;
                break;
            }
        }
        if (collision) {
            lubyankaObstacles.splice(i, 1);
            continue;
        }
        if (lubyanka.x < -lubyanka.width) {
            lubyankaObstacles.splice(i, 1);
            continue;
        }
        if (lubyanka.x < cvs.width && lubyanka.x + lubyanka.width > 0) {
            if (state.current == state.game &&
                checkCollisionZones(
                    bird.x - bird.w/2, bird.y - bird.h/2, bird.w, bird.h, bird.collisionZones,
                    [lubyanka], lubyankaObstacleTemplate, getLubyankaCollisionRects(lubyanka), true // абсолютные зоны
                )
            ) {
                console.log('Коллизия с Лубянкой! Птица:', bird.x, bird.y, 'размеры:', bird.w, bird.h, 'Лубянка:', lubyanka.x, lubyanka.y, 'размеры:', lubyanka.width, lubyanka.height);
                console.log('Масштаб игры:', getGameScale());
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
                // === ЛОГ ДЛЯ ВЗРЫВА ===
                console.log('ВЗРЫВ: столкновение с ЛУБЯНКОЙ');
            }
        }
    }
    lubyankaSpawnTimer += delta;
    if (lubyankaSpawnTimer >= lubyankaSpawnInterval) {
        let x = cvs.width;
        let y = cvs.height - lubyankaObstacleTemplate.height;
        let onlyBuildings = [...mguObstacles, ...lubyankaObstacles, ...ostankinoObstacles];
        // Проверка минимального расстояния между зданиями
        let canSpawn = true;
        for (let other of onlyBuildings) {
            let centerNew = x + lubyankaObstacleTemplate.width / 2;
            let centerOther = other.x + other.width / 2;
            let minDist = (lubyankaObstacleTemplate.width / 2) + (other.width / 2);
            if (Math.abs(centerNew - centerOther) < minDist) {
                canSpawn = false;
                break;
            }
        }
        let overlaps = checkCollisionZones(
            x, y, lubyankaObstacleTemplate.width, lubyankaObstacleTemplate.height, lubyankaCollisionZones,
            onlyBuildings, lubyankaObstacleTemplate, lubyankaCollisionZones
        );
        if (!overlaps && canSpawn) {
            lubyankaObstacles.push({
                x: x,
                y: y,
                width: lubyankaObstacleTemplate.width,
                height: lubyankaObstacleTemplate.height
            });
        }
        lubyankaSpawnTimer = 0;
        lubyankaSpawnInterval = 4 + Math.random() * 3;
    }

    // === ДВИЖЕНИЕ И СПАВН ОСТАНКИНО ===
    for (let i = ostankinoObstacles.length - 1; i >= 0; i--) {
        let ostankino = ostankinoObstacles[i];
        ostankino.x -= pipes.dx * (delta || 1);
        // Проверка на пересечение с другими зданиями
        let otherBuildings = [...mguObstacles, ...lubyankaObstacles];
        let collision = false;
        for (let other of otherBuildings) {
            if (
                ostankino.x < other.x + other.width &&
                ostankino.x + ostankino.width > other.x &&
                ostankino.y < other.y + other.height &&
                ostankino.y + ostankino.height > other.y
            ) {
                collision = true;
                break;
            }
        }
        if (collision) {
            ostankinoObstacles.splice(i, 1);
            continue;
        }
        if (ostankino.x < -ostankino.width) {
            ostankinoObstacles.splice(i, 1);
            continue;
        }
        if (ostankino.x < cvs.width && ostankino.x + ostankino.width > 0) {
            if (state.current == state.game &&
                checkCollisionZones(
                    bird.x - bird.w/2, bird.y - bird.h/2, bird.w, bird.h, bird.collisionZones,
                    [ostankino], ostankinoObstacleTemplate, getOstankinoCollisionRects(ostankino), true // абсолютные зоны
                )
            ) {
                console.log('Коллизия с Останкино! Птица:', bird.x, bird.y, 'размеры:', bird.w, bird.h, 'Останкино:', ostankino.x, ostankino.y, 'размеры:', ostankino.width, ostankino.height);
                console.log('Масштаб игры:', getGameScale());
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
                // === ЛОГ ДЛЯ ВЗРЫВА ===
                console.log('ВЗРЫВ: столкновение с ОСТАНКИНО');
            }
        }
    }
    ostankinoSpawnTimer += delta;
    if (ostankinoSpawnTimer >= ostankinoSpawnInterval) {
        let x = cvs.width;
        let y = cvs.height - ostankinoObstacleTemplate.height;
        let onlyBuildings = [...mguObstacles, ...lubyankaObstacles, ...ostankinoObstacles];
        // Проверка минимального расстояния между зданиями
        let canSpawn = true;
        for (let other of onlyBuildings) {
            let centerNew = x + ostankinoObstacleTemplate.width / 2;
            let centerOther = other.x + other.width / 2;
            let minDist = (ostankinoObstacleTemplate.width / 2) + (other.width / 2);
            if (Math.abs(centerNew - centerOther) < minDist) {
                canSpawn = false;
                break;
            }
        }
        let overlaps = checkCollisionZones(
            x, y, ostankinoObstacleTemplate.width, ostankinoObstacleTemplate.height, ostankinoCollisionZones,
            onlyBuildings, ostankinoObstacleTemplate, ostankinoCollisionZones
        );
        if (!overlaps && canSpawn) {
            ostankinoObstacles.push({
                x: x,
                y: y,
                width: ostankinoObstacleTemplate.width,
                height: ostankinoObstacleTemplate.height
            });
        }
        ostankinoSpawnTimer = 0;
        ostankinoSpawnInterval = 4 + Math.random() * 3;
    }
    background.update(delta); // Обновляем фон
    home.update(delta);
    pipes.update(delta); // Обновляем вертолёты ПОСЛЕ зданий
    coins.trySpawnCoinAfterObstacles();
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
    coins.draw(); // <--- добавлено
    pipes.draw();
    // === ОТРИСОВКА ВСЕХ МГУ ===
    for (let i = 0; i < mguObstacles.length; i++) {
        ctx.drawImage(mgu_img, mguObstacles[i].x, mguObstacles[i].y, mguObstacles[i].width, mguObstacles[i].height);
    }
    // === ОТРИСОВКА ВСЕХ ЛУБЯНОК ===
    for (let i = 0; i < lubyankaObstacles.length; i++) {
        ctx.drawImage(lubyanka_img, lubyankaObstacles[i].x, lubyankaObstacles[i].y, lubyankaObstacles[i].width, lubyankaObstacles[i].height);
    }
    // === ОТРИСОВКА ВСЕХ ОСТАНКИНСКИХ БАШЕН ===
    for (let i = 0; i < ostankinoObstacles.length; i++) {
        ctx.drawImage(ostankino_img, ostankinoObstacles[i].x, ostankinoObstacles[i].y, ostankinoObstacles[i].width, ostankinoObstacles[i].height);
    }
    // === КОНЕЦ ===
    foreground.draw();
    // === НЕ РИСУЕМ ПЕРСОНАЖА, ЕСЛИ ВЗРЫВ ===
    if (!explosionActive) {
        bird.draw();
    }
    // === ОТРИСОВКА ВЗРЫВА ===
    if (explosionActive && state.current !== state.gameOver) {
        drawExplosion();
    }
    // === КОНЕЦ ===
    home.draw();
    getReady.draw();
    gameButtons.draw();
    gameOver.draw();
    score.draw();
    // === Чекбокс только в главном меню ===
    if (typeof state !== 'undefined' && state.current === state.home) {
        drawCollisionCheckbox(ctx);
    }
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
            for (let rect of getMguCollisionRects(mgu)) {
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
        }
        ctx.restore();
    }
    // === ВИЗУАЛИЗАЦИЯ ЗОН КОЛЛИЗИИ ЛУБЯНКИ ===
    if (showCollisionTest && typeof lubyankaObstacles !== 'undefined' && lubyankaObstacles.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'orange';
        for (let lubyanka of lubyankaObstacles) {
            for (let rect of getLubyankaCollisionRects(lubyanka)) {
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
        }
        ctx.restore();
    }
    // === ВИЗУАЛИЗАЦИЯ ЗОН КОЛЛИЗИИ ОСТАНКИНО ===
    if (showCollisionTest && typeof ostankinoObstacles !== 'undefined' && ostankinoObstacles.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'orange';
        for (let ostankino of ostankinoObstacles) {
            for (let rect of getOstankinoCollisionRects(ostankino)) {
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
        }
        ctx.restore();
    }
    // === Чекбокс только в главном меню ===
    if (typeof state !== 'undefined' && state.current === state.home) {
        drawCollisionCheckbox(ctx);
    }
    // === КОНЕЦ draw ===
}

// === ПРОВЕРКА КОЛЛИЗИЙ ПТИЦЫ СО ВСЕМИ ЗДАНИЯМИ ===
// Удаляю функцию checkAllCollisions и её вызов из gameLoop в game-core.js вручную.

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

// === МОНЕТЫ ===
const coin_img = new Image();
coin_img.src = "img/separated/coins.png";

const coins = {
    position: [],
    get w() { return Math.round(32 * getGameScale()); },
    get h() { return Math.round(32 * getGameScale()); },
    spawnTimer: 0,
    spawnInterval: 2 + Math.random() * 2, // 2-4 секунды
    dx: 2, // скорость движения монеты
    
    draw: function() {
        for (let i = 0; i < this.position.length; i++) {
            let c = this.position[i];
            ctx.drawImage(coin_img, c.x, c.y, this.w, this.h);
        }
    },
    
    update: function(delta) {
        if (state.current != state.game) return;
        this.spawnTimer += delta;
        // Спавн монеты теперь происходит после спавна препятствий, см. coins.trySpawnCoinAfterObstacles()
        for (let i = this.position.length - 1; i >= 0; i--) {
            let c = this.position[i];
            c.x -= pipes.dx * (delta || 1); // теперь монеты двигаются как трубы/вертолёты
            // Проверка коллизии с птицей
            if (!c.collected &&
                bird.x + bird.w/2 > c.x &&
                bird.x - bird.w/2 < c.x + this.w &&
                bird.y + bird.h/2 > c.y &&
                bird.y - bird.h/2 < c.y + this.h
            ) {
                c.collected = true;
                score.game_score++;
                if(!mute && typeof POINT !== 'undefined') POINT.play();
                checkAndApplySpeedBoost();
                if(score.game_score > score.best_score) {
                    score.best_score = score.game_score;
                    score.new_best_score = true;
                }
                localStorage.setItem("best_score", score.best_score);
            }
            // Удаляем монету, если она собрана или ушла за экран
            if (c.collected || c.x + this.w < 0) {
                this.position.splice(i, 1);
            }
        }
    },
    trySpawnCoinAfterObstacles: function() {
        if (state.current != state.game) return;
        if (this.spawnTimer < this.spawnInterval) return;
        // Появление монеты на случайной высоте
        let y = Math.random() * (cvs.height - this.h * 2) + this.h;
        let x = cvs.width;
        // Проверяем радиус 300px от всех препятствий
        let minDist = Math.max(300, cvs.width * 0.15) * getGameScale(); // минимум 300px или 15% от ширины экрана, масштабируется
        let allObstacles = getAllObstacles();
        // Добавим вертолёты
        if (Array.isArray(pipes.position)) {
            for (let p of pipes.position) {
                let heliW = Math.round(360 / 1.5) * 0.8 * 1.1; // drawW из pipes.update
                let heliH = heliW * (305 / 360); // приблизительно
                allObstacles.push({x: p.x, y: p.y, width: heliW, height: heliH});
            }
        }
        let coinCenter = {x: x + this.w/2, y: y + this.h/2};
        let tooClose = allObstacles.some(obj => {
            let objCenter = {x: obj.x + obj.width/2, y: obj.y + obj.height/2};
            let dx = coinCenter.x - objCenter.x;
            let dy = coinCenter.y - objCenter.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            return dist < minDist;
        });
        if (!tooClose) {
            this.position.push({ x: x, y: y, collected: false });
            this.spawnTimer = 0;
            this.spawnInterval = 2 + Math.random() * 2;
        } // иначе — попробуем на следующем тике
    },
    reset: function() {
        this.position = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2 + Math.random() * 2;
    }
}; 