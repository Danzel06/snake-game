// Настройки игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');

canvas.width = 290;
canvas.height = 290;
const gridSize = 20;
const tileCount = canvas.width / gridSize - 1; // Уменьшаем количество клеток на 1

// Начальные значения
let snake = [
    { x: 7, y: 7 }  
];
let food = { 
    x: Math.floor(Math.random() * (tileCount - 2)) + 1,
    y: Math.floor(Math.random() * (tileCount - 2)) + 1
};  
let obstacles = [];
let dx = 0;
let dy = 0;
let score = 0;
let gameSpeed = 200;
let gameLoop;
let obstacleTimer; // Таймер для препятствий
let obstacleGenerationStarted = false;

// Добавляем функцию для создания препятствий
function generateObstacle() {
    const obstacle = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    // Проверяем, чтобы препятствие не появилось на змейке или еде
    const isOnSnake = snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y);
    const isOnFood = food.x === obstacle.x && food.y === obstacle.y;

    if (!isOnSnake && !isOnFood) {
        obstacles = [obstacle]; // Теперь у нас только одно препятствие
        return true;
    }
    return false;
}

// Функция проверки, находится ли позиция в безопасной зоне (не на границах)
function isInSafeZone(x, y) {
    return x > 0 && x < tileCount - 1 && y > 0 && y < tileCount - 1;
}

// Генерация новой еды
function generateFood() {
    if (obstacles.length > 0) {
        // Если есть препятствие, генерируем еду недалеко от него
        const obstacle = obstacles[0];
        const possiblePositions = [];
        
        // Генерируем позиции в радиусе от 3 клеток от препятствия
        for(let dx = -6; dx <= 6; dx++) {
            for(let dy = -6; dy <= 6; dy++) {
                // Берем только позиции на расстоянии не менее 3 клеток
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 3) continue;
                
                const newX = obstacle.x + dx;
                const newY = obstacle.y + dy;
                
                // Проверяем, что позиция в пределах поля и не на границах
                if (isInSafeZone(newX, newY)) {
                    possiblePositions.push({ x: newX, y: newY });
                }
            }
        }

        // Фильтруем позиции, где нет змейки и препятствий
        const availablePositions = possiblePositions.filter(pos => 
            !snake.some(segment => segment.x === pos.x && segment.y === pos.y) &&
            !obstacles.some(obs => obs.x === pos.x && obs.y === pos.y)
        );

        if (availablePositions.length > 0) {
            // Выбираем случайную позицию из доступных
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            food = availablePositions[randomIndex];
            return;
        }
    }

    // Если нет препятствий или нет подходящих позиций, генерируем еду в случайном месте
    let newFood;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        newFood = {
            x: Math.floor(Math.random() * (tileCount - 2)) + 1, // Отступ от краёв
            y: Math.floor(Math.random() * (tileCount - 2)) + 1  // Отступ от краёв
        };
        attempts++;

        if (attempts > maxAttempts) {
            console.log("Не удалось найти место для еды");
            return;
        }
    } while (
        snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        obstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y)
    );

    food = newFood;
}

// Функция для управления циклом препятствий
function startObstacleGeneration() {
    if (obstacleGenerationStarted) return; // Предотвращаем повторный запуск
    
    function obstacleLoop() {
        // Проверяем, достаточно ли очков для появления препятствий
        if (score < 5) { // Препятствия появятся только после 5 очков
            setTimeout(obstacleLoop, 1000); // Проверяем каждую секунду
            return;
        }
        
        // Создаем препятствие, проверяя, что оно не появится на еде
        let obstacleCreated = false;
        while (!obstacleCreated) {
            const newObstacle = {
                x: Math.floor(Math.random() * (tileCount - 2)) + 1, // Отступ от краёв
                y: Math.floor(Math.random() * (tileCount - 2)) + 1  // Отступ от краёв
            };
            
            // Проверяем, что препятствие не появится на змейке или еде
            const isOnSnake = snake.some(segment => 
                segment.x === newObstacle.x && segment.y === newObstacle.y
            );
            const isOnFood = food.x === newObstacle.x && food.y === newObstacle.y;
            
            if (!isOnSnake && !isOnFood) {
                obstacles = [newObstacle];
                obstacleCreated = true;
            }
        }
        
        // Через 10 секунд убираем препятствие
        setTimeout(() => {
            obstacles = [];
            
            // Через 7 секунд начинаем цикл заново
            setTimeout(obstacleLoop, 7000);
        }, 10000);
    }

    // Запускаем первый цикл
    obstacleGenerationStarted = true;
    obstacleLoop();
}

// Обработчики событий для клавиатуры
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) {
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) {
                dx = 1;
                dy = 0;
            }
            break;
    }
});

// Обработчики событий для кнопок
document.getElementById('up').addEventListener('click', function() {
    if (dy !== 1) {
        dx = 0;
        dy = -1;
    }
});

document.getElementById('down').addEventListener('click', function() {
    if (dy !== -1) {
        dx = 0;
        dy = 1;
    }
});

document.getElementById('left').addEventListener('click', function() {
    if (dx !== 1) {
        dx = -1;
        dy = 0;
    }
});

document.getElementById('right').addEventListener('click', function() {
    if (dx !== -1) {
        dx = 1;
        dy = 0;
    }
});

// Основной игровой цикл
function gameUpdate() {
    // Перемещение змейки
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Проверка столкновения с едой
    if (head.x === food.x && head.y === food.y) {
        score += 1;
        scoreElement.textContent = score;
        
        // Сохраняем текущие препятствия
        const currentObstacles = [...obstacles];
        
        // Генерируем новую еду
        generateFood();
        
        // Восстанавливаем препятствия
        obstacles = currentObstacles;
        
        // Запускаем генерацию препятствий, если набрано достаточно очков
        if (score >= 5 && !obstacleGenerationStarted) {
            startObstacleGeneration();
        }
    } else {
        snake.pop();
    }

    // Проверка столкновений
    if (checkCollision()) {
        alert('Игра окончена! Ваш счёт: ' + score);
        resetGame();
        return;
    }

    // Отрисовка
    draw();
}

// Отрисовка игры
function draw() {
    // Очистка canvas
    ctx.fillStyle = '#98FB98';  // Светло-зеленый фон
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Отрисовка змейки
    snake.forEach((segment, index) => {
        // Градиент для тела змейки
        const gradient = ctx.createRadialGradient(
            segment.x * gridSize + gridSize/2, 
            segment.y * gridSize + gridSize/2, 
            0,
            segment.x * gridSize + gridSize/2, 
            segment.y * gridSize + gridSize/2, 
            gridSize/2
        );
        
        if (index === 0) { // Голова змейки
            gradient.addColorStop(0, '#006400');  // Темно-зеленый
            gradient.addColorStop(1, '#008000');  // Зеленый
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize/2,
                segment.y * gridSize + gridSize/2,
                gridSize/2 - 1,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Глаза
            ctx.fillStyle = 'white';
            const eyeSize = gridSize/6;
            const eyeOffset = gridSize/4;
            
            // Определяем положение глаз в зависимости от направления
            let eyeX1 = segment.x * gridSize + gridSize/2;
            let eyeX2 = segment.x * gridSize + gridSize/2;
            let eyeY1 = segment.y * gridSize + gridSize/2;
            let eyeY2 = segment.y * gridSize + gridSize/2;
            
            if (dx === 1) { // движение вправо
                eyeX1 += eyeOffset; eyeX2 += eyeOffset;
                eyeY1 -= eyeOffset; eyeY2 += eyeOffset;
            } else if (dx === -1) { // движение влево
                eyeX1 -= eyeOffset; eyeX2 -= eyeOffset;
                eyeY1 -= eyeOffset; eyeY2 += eyeOffset;
            } else if (dy === 1) { // движение вниз
                eyeY1 += eyeOffset; eyeY2 += eyeOffset;
                eyeX1 -= eyeOffset; eyeX2 += eyeOffset;
            } else if (dy === -1) { // движение вверх
                eyeY1 -= eyeOffset; eyeY2 -= eyeOffset;
                eyeX1 -= eyeOffset; eyeX2 += eyeOffset;
            }
            
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
            ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Зрачки
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize/2, 0, Math.PI * 2);
            ctx.arc(eyeX2, eyeY2, eyeSize/2, 0, Math.PI * 2);
            ctx.fill();
        } else { // Тело змейки
            gradient.addColorStop(0, '#32CD32');  // Лайм
            gradient.addColorStop(1, '#228B22');  // Лесной зеленый
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize/2,
                segment.y * gridSize + gridSize/2,
                gridSize/2 - 1,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });

    // Отрисовка препятствий
    obstacles.forEach(obstacle => {
        const obstacleGradient = ctx.createRadialGradient(
            obstacle.x * gridSize + gridSize/2,
            obstacle.y * gridSize + gridSize/2,
            0,
            obstacle.x * gridSize + gridSize/2,
            obstacle.y * gridSize + gridSize/2,
            gridSize/2
        );
        
        obstacleGradient.addColorStop(0, '#800000');  // Темно-красный
        obstacleGradient.addColorStop(1, '#400000');  // Очень темно-красный
        
        ctx.fillStyle = obstacleGradient;
        
        // Рисуем шипы
        const centerX = obstacle.x * gridSize + gridSize/2;
        const centerY = obstacle.y * gridSize + gridSize/2;
        const spikes = 8;
        const innerRadius = gridSize/4;
        const outerRadius = gridSize/2 - 1;
        
        ctx.beginPath();
        for(let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if(i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    });

    // Отрисовка яблока
    const appleGradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/6,
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2
    );
    
    appleGradient.addColorStop(0, '#ff0000');  // Ярко-красный
    appleGradient.addColorStop(0.7, '#8b0000');  // Темно-красный
    
    ctx.fillStyle = appleGradient;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 1,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Черенок яблока
    ctx.fillStyle = '#654321';
    ctx.fillRect(
        food.x * gridSize + gridSize/2 - 2,
        food.y * gridSize + 2,
        4,
        6
    );
    
    // Листик
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(
        food.x * gridSize + gridSize/2 + 4,
        food.y * gridSize + 4,
        4,
        2,
        Math.PI / 4,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Проверка столкновений
function checkCollision() {
    const head = snake[0];
    
    // Столкновение со стенами
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }

    // Столкновение с собой
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    // Столкновение с препятствиями
    return obstacles.some(obstacle => head.x === obstacle.x && head.y === obstacle.y);
}

// Сброс игры
function resetGame() {
    snake = [{ x: 7, y: 7 }];
    food = { 
        x: Math.floor(Math.random() * (tileCount - 2)) + 1,
        y: Math.floor(Math.random() * (tileCount - 2)) + 1
    };
    obstacles = []; // Очищаем препятствия
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    
    // Очищаем старые таймеры
    clearInterval(gameLoop);
    
    // Запускаем новые циклы
    gameLoop = setInterval(gameUpdate, gameSpeed);
    obstacleGenerationStarted = false;
}

// Запуск игры
resetGame();
gameLoop = setInterval(gameUpdate, gameSpeed);
