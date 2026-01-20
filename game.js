// 游戏常量
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TANK_SIZE = 30;
const TANK_SPEED = 3;
const BULLET_SIZE = 5;
const BULLET_SPEED = 8;
const ENEMY_SPAWN_INTERVAL = 3000; // 3秒生成一个敌人
const MAX_ENEMIES = 5;

// 方向常量
const DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

// 坦克类
class Tank {
    constructor(x, y, direction, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.color = color;
        this.isPlayer = isPlayer;
        this.width = TANK_SIZE;
        this.height = TANK_SIZE;
        this.speed = TANK_SPEED;
        this.health = isPlayer ? 3 : 1;
        this.lastShotTime = 0;
        this.shootCooldown = 500; // 射击冷却时间（毫秒）
    }

    update(keys, walls) {
        if (this.isPlayer) {
            this.handlePlayerInput(keys);
        } else {
            this.handleAI();
        }
        this.checkWallCollision(walls);
    }

    handlePlayerInput(keys) {
        let moved = false;
        const oldX = this.x;
        const oldY = this.y;

        if (keys['w'] || keys['W']) {
            this.direction = DIRECTIONS.UP;
            this.y -= this.speed;
            moved = true;
        }
        if (keys['s'] || keys['S']) {
            this.direction = DIRECTIONS.DOWN;
            this.y += this.speed;
            moved = true;
        }
        if (keys['a'] || keys['A']) {
            this.direction = DIRECTIONS.LEFT;
            this.x -= this.speed;
            moved = true;
        }
        if (keys['d'] || keys['D']) {
            this.direction = DIRECTIONS.RIGHT;
            this.x += this.speed;
            moved = true;
        }

        // 边界检测
        if (this.x < 0) this.x = 0;
        if (this.x > CANVAS_WIDTH - this.width) this.x = CANVAS_WIDTH - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > CANVAS_HEIGHT - this.height) this.y = CANVAS_HEIGHT - this.height;

        // 如果碰撞到墙壁，恢复位置
        if (moved && this.checkWallCollision(walls)) {
            this.x = oldX;
            this.y = oldY;
        }
    }

    handleAI() {
        // 简单的AI：随机移动和射击
        if (Math.random() < 0.02) {
            this.direction = Math.floor(Math.random() * 4);
        }

        const oldX = this.x;
        const oldY = this.y;

        switch (this.direction) {
            case DIRECTIONS.UP:
                this.y -= this.speed;
                break;
            case DIRECTIONS.DOWN:
                this.y += this.speed;
                break;
            case DIRECTIONS.LEFT:
                this.x -= this.speed;
                break;
            case DIRECTIONS.RIGHT:
                this.x += this.speed;
                break;
        }

        // 边界检测和反弹
        if (this.x < 0 || this.x > CANVAS_WIDTH - this.width) {
            this.direction = this.direction === DIRECTIONS.LEFT ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
            this.x = Math.max(0, Math.min(CANVAS_WIDTH - this.width, this.x));
        }
        if (this.y < 0 || this.y > CANVAS_HEIGHT - this.height) {
            this.direction = this.direction === DIRECTIONS.UP ? DIRECTIONS.DOWN : DIRECTIONS.UP;
            this.y = Math.max(0, Math.min(CANVAS_HEIGHT - this.height, this.y));
        }

        // 如果碰撞到墙壁，恢复位置并改变方向
        if (this.checkWallCollision(walls)) {
            this.x = oldX;
            this.y = oldY;
            this.direction = Math.floor(Math.random() * 4);
        }
    }

    checkWallCollision(walls) {
        for (let wall of walls) {
            if (this.x < wall.x + wall.width &&
                this.x + this.width > wall.x &&
                this.y < wall.y + wall.height &&
                this.y + this.height > wall.y) {
                return true;
            }
        }
        return false;
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime < this.shootCooldown) {
            return null;
        }

        this.lastShotTime = currentTime;
        let bulletX = this.x + this.width / 2;
        let bulletY = this.y + this.height / 2;

        switch (this.direction) {
            case DIRECTIONS.UP:
                bulletY = this.y;
                break;
            case DIRECTIONS.DOWN:
                bulletY = this.y + this.height;
                break;
            case DIRECTIONS.LEFT:
                bulletX = this.x;
                break;
            case DIRECTIONS.RIGHT:
                bulletX = this.x + this.width;
                break;
        }

        return new Bullet(bulletX, bulletY, this.direction, !this.isPlayer);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.direction * Math.PI / 2);

        // 绘制坦克主体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // 绘制坦克炮管
        ctx.fillStyle = '#333';
        ctx.fillRect(-2, -this.height / 2 - 10, 4, 15);

        // 绘制坦克细节
        ctx.fillStyle = '#555';
        ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, this.height - 10);

        ctx.restore();

        // 如果是玩家，绘制生命值指示器
        if (this.isPlayer && this.health > 1) {
            ctx.fillStyle = '#ff0000';
            for (let i = 0; i < this.health; i++) {
                ctx.fillRect(this.x + i * 8, this.y - 10, 6, 6);
            }
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// 子弹类
class Bullet {
    constructor(x, y, direction, isEnemyBullet = false) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.width = BULLET_SIZE;
        this.height = BULLET_SIZE;
        this.speed = BULLET_SPEED;
        this.isEnemyBullet = isEnemyBullet;
        this.active = true;
    }

    update() {
        switch (this.direction) {
            case DIRECTIONS.UP:
                this.y -= this.speed;
                break;
            case DIRECTIONS.DOWN:
                this.y += this.speed;
                break;
            case DIRECTIONS.LEFT:
                this.x -= this.speed;
                break;
            case DIRECTIONS.RIGHT:
                this.x += this.speed;
                break;
        }

        // 检查是否超出边界
        if (this.x < 0 || this.x > CANVAS_WIDTH || 
            this.y < 0 || this.y > CANVAS_HEIGHT) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.isEnemyBullet ? '#ff0000' : '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    checkCollision(rect) {
        const bounds = this.getBounds();
        return bounds.x < rect.x + rect.width &&
               bounds.x + bounds.width > rect.x &&
               bounds.y < rect.y + rect.height &&
               bounds.y + bounds.height > rect.y;
    }
}

// 墙壁类
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.keys = {};
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.walls = [];
        this.score = 0;
        this.gameOver = false;
        this.lastEnemySpawn = 0;

        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    init() {
        // 创建玩家坦克
        this.player = new Tank(
            CANVAS_WIDTH / 2 - TANK_SIZE / 2,
            CANVAS_HEIGHT - TANK_SIZE - 20,
            DIRECTIONS.UP,
            '#4CAF50',
            true
        );

        // 创建墙壁
        this.createWalls();

        // 创建初始敌人
        this.spawnEnemy();
    }

    createWalls() {
        // 创建一些随机墙壁作为障碍物
        const wallCount = 8;
        for (let i = 0; i < wallCount; i++) {
            const x = Math.random() * (CANVAS_WIDTH - 60);
            const y = Math.random() * (CANVAS_HEIGHT - 60);
            const width = 40 + Math.random() * 40;
            const height = 40 + Math.random() * 40;
            
            // 确保墙壁不生成在玩家初始位置
            if (Math.abs(x - this.player.x) > 100 || Math.abs(y - this.player.y) > 100) {
                this.walls.push(new Wall(x, y, width, height));
            }
        }
    }

    spawnEnemy() {
        if (this.enemies.length >= MAX_ENEMIES) return;

        // 在画布上方随机位置生成敌人
        const x = Math.random() * (CANVAS_WIDTH - TANK_SIZE);
        const y = Math.random() * 100;
        
        const enemy = new Tank(x, y, DIRECTIONS.DOWN, '#e74c3c', false);
        this.enemies.push(enemy);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ' && !this.gameOver) {
                e.preventDefault();
                const bullet = this.player.shoot();
                if (bullet) {
                    this.bullets.push(bullet);
                }
            }

            if (e.key === 'r' || e.key === 'R') {
                this.restart();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    update() {
        if (this.gameOver) return;

        // 更新玩家
        this.player.update(this.keys, this.walls);

        // 更新敌人
        for (let enemy of this.enemies) {
            enemy.update(this.keys, this.walls);
            
            // 敌人随机射击
            if (Math.random() < 0.01) {
                const bullet = enemy.shoot();
                if (bullet) {
                    this.bullets.push(bullet);
                }
            }
        }

        // 更新子弹
        for (let bullet of this.bullets) {
            bullet.update();
        }

        // 移除无效子弹
        this.bullets = this.bullets.filter(bullet => bullet.active);

        // 碰撞检测：玩家子弹 vs 敌人
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.isEnemyBullet) continue;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (bullet.checkCollision(enemy.getBounds())) {
                    bullet.active = false;
                    this.enemies.splice(j, 1);
                    this.score += 10;
                    this.updateScore();
                    break;
                }
            }
        }

        // 碰撞检测：敌人子弹 vs 玩家
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet.isEnemyBullet) continue;

            if (bullet.checkCollision(this.player.getBounds())) {
                bullet.active = false;
                this.player.health--;
                this.updateLives();
                
                if (this.player.health <= 0) {
                    this.endGame();
                }
                break;
            }
        }

        // 碰撞检测：子弹 vs 墙壁
        for (let bullet of this.bullets) {
            for (let wall of this.walls) {
                if (bullet.checkCollision(wall.getBounds())) {
                    bullet.active = false;
                    break;
                }
            }
        }

        // 生成新敌人
        const currentTime = Date.now();
        if (currentTime - this.lastEnemySpawn > ENEMY_SPAWN_INTERVAL) {
            this.spawnEnemy();
            this.lastEnemySpawn = currentTime;
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 绘制网格背景
        this.drawGrid();

        // 绘制墙壁
        for (let wall of this.walls) {
            wall.draw(this.ctx);
        }

        // 绘制玩家
        this.player.draw(this.ctx);

        // 绘制敌人
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // 绘制子弹
        for (let bullet of this.bullets) {
            bullet.draw(this.ctx);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < CANVAS_WIDTH; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CANVAS_HEIGHT);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    updateLives() {
        document.getElementById('lives').textContent = this.player.health;
    }

    endGame() {
        this.gameOver = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }

    restart() {
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.walls = [];
        this.score = 0;
        this.gameOver = false;
        this.lastEnemySpawn = 0;
        this.keys = {};

        document.getElementById('gameOver').classList.add('hidden');
        this.init();
        this.updateScore();
        this.updateLives();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 启动游戏
let game;
window.addEventListener('load', () => {
    game = new Game();
});
