const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const audio = new Audio('assets/audio.mp3');

const score = document.querySelector(".score--value");
const finalScore = document.querySelector(".final-score + span");

// Telas e Botões
const startScreen = document.querySelector(".start-screen");
const buttonStart = document.querySelector(".btn-start");
const menu = document.querySelector(".menu-screen");
const buttonPlay = document.querySelector(".btn-play");

const size = 30;
const snakeImg = new Image();
snakeImg.src = "img/cobra.png";

const bodyImg = new Image();
bodyImg.src = "img/body.png";

let snake = [
    { x: 270, y: 240 },
    { x: 300, y: 240 },
    { x: 330, y: 240 }
];

const incrementScore = () => {
    score.innerText = +score.innerText + 10;
};

const randomNumber = (min, max) => {
    return Math.round(Math.random() * (max - min) + min);
};

const randomPosition = () => {
    const number = randomNumber(0, canvas.width - size);
    return Math.round(number / 30) * 30;
};

const randomColor = () => {
    const red = randomNumber(0, 255);
    const green = randomNumber(0, 255);
    const blue = randomNumber(0, 255);
    return `rgb(${red}, ${green}, ${blue})`;
};

const foodImages = [
    "img/donut.png",
    "img/barra.png",
    "img/frango.png",
    "img/hamburguer.png",
    "img/pizza.png",
    "img/sorvete.png"
].map((src) => {
    const img = new Image();
    img.src = src;
    return img;
});

const randomFoodImage = () => {
    const index = randomNumber(0, foodImages.length - 1);
    return foodImages[index];
};

let food = {
    x: randomPosition(),
    y: randomPosition(),
    color: randomColor(),
    image: randomFoodImage(),
};

let direction;
let loopID;
let isGameRunning = false; // Controla se o jogo começou

const drawFood = () => {
    const { x, y, image } = food;

    if (image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, x, y, size, size);
    } else {
        ctx.shadowColor = food.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = food.color;
        ctx.fillRect(x, y, size, size);
        ctx.shadowBlur = 0;
    }
};

const drawSnake = () => {
    snake.forEach((position, index) => {
        const isHead = index === snake.length - 1;

        if (isHead) {
            if (snakeImg.complete && snakeImg.naturalWidth > 0) {
                ctx.save();
                ctx.translate(position.x + size / 2, position.y + size / 2);

                if (direction === "right") {
                    ctx.rotate(Math.PI);
                } else if (direction === "down") {
                    ctx.rotate(-Math.PI / 2);
                } else if (direction === "up") {
                    ctx.rotate(Math.PI / 2);
                } else if (direction === "left") {
                    ctx.rotate(0);
                } else {
                    ctx.rotate(Math.PI);
                }

                ctx.drawImage(snakeImg, -size / 2, -size / 2, size, size);
                ctx.restore();
            } else {
                ctx.fillStyle = "white";
                ctx.fillRect(position.x, position.y, size, size);
            }
        } else {
            const next = snake[index + 1];
            let angle = 0;

            if (next) {
                const dx = next.x - position.x;
                const dy = next.y - position.y;

                if (dx > 0) angle = Math.PI;
                else if (dx < 0) angle = 0;
                else if (dy > 0) angle = -Math.PI / 2;
                else if (dy < 0) angle = Math.PI / 2;
            }

            ctx.save();
            ctx.translate(position.x + size / 2, position.y + size / 2);
            ctx.rotate(angle);

            if (bodyImg.complete && bodyImg.naturalWidth > 0) {
                ctx.drawImage(bodyImg, -size / 2, -size / 2, size, size);
            } else {
                ctx.fillStyle = "#2ecc71";
                ctx.fillRect(-size / 2, -size / 2, size, size);
            }

            ctx.restore();
        }
    });
};

const moveSnake = () => {
    if (!direction) return;

    const head = snake[snake.length - 1];

    if (direction == "right") snake.push({ x: head.x + size, y: head.y });
    if (direction == "left") snake.push({ x: head.x - size, y: head.y });
    if (direction == "down") snake.push({ x: head.x, y: head.y + size });
    if (direction == "up") snake.push({ x: head.x, y: head.y - size });

    snake.shift();
};

const drawGrid = () => {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#191919";
    for (let i = 30; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.lineTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineTo(0, i);
        ctx.lineTo(600, i);
        ctx.stroke();
    }
};

const checkEat = () => {
    const head = snake[snake.length - 1];

    if (head.x == food.x && head.y == food.y) {
        snake.push({ x: head.x, y: head.y });
        incrementScore();
        audio.play().catch(() => {});

        let x = randomPosition();
        let y = randomPosition();

        while (snake.find((position) => position.x == x && position.y == y)) {
            x = randomPosition();
            y = randomPosition();
        }

        food.x = x;
        food.y = y;
        food.color = randomColor();
        food.image = randomFoodImage();
    }
};

const checkCollision = () => {
    const head = snake[snake.length - 1];
    const canvasLimit = canvas.width - size;
    const neckIndex = snake.length - 2;

    const wallCollision = head.x > canvasLimit || head.x < 0 || head.y < 0 || head.y > canvasLimit;

    const selfCollision = snake.find((position, index) => {
        return index < neckIndex && position.x == head.x && position.y == head.y;
    });

    if (wallCollision || selfCollision) {
        gameOver();
    }
};

const gameOver = () => {
    isGameRunning = false;
    direction = undefined;
    menu.style.display = "flex";
    finalScore.innerText = score.innerText;
};

const resetGame = () => {
    score.innerText = "00";
    menu.style.display = "none";
    startScreen.style.display = "none";
    snake = [
        { x: 270, y: 240 },
        { x: 300, y: 240 },
        { x: 330, y: 240 }
    ];
    direction = undefined;
    isGameRunning = true;
};

const gameLoop = () => {
    clearInterval(loopID);
    ctx.clearRect(0, 0, 600, 600);
    
    drawGrid();
    drawFood();
    
    if (isGameRunning) {
        moveSnake();
        checkEat();
        checkCollision();
    }
    
    drawSnake();

    loopID = setTimeout(() => {
        gameLoop();
    }, 100);
};

// Eventos de início e reinício
buttonStart.addEventListener("click", resetGame);
buttonPlay.addEventListener("click", resetGame);

// Controles por Teclado
document.addEventListener("keydown", ({ key }) => {
    if (!isGameRunning) return;
    if (key == "ArrowRight" && direction !== "left") direction = "right";
    if (key == "ArrowLeft" && direction !== "right") direction = "left";
    if (key == "ArrowUp" && direction !== "down") direction = "up";
    if (key == "ArrowDown" && direction !== "up") direction = "down";
});

// Controles por Touch (Swipe para Mobile)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
    if (!isGameRunning || !touchStartX || !touchStartY) return;

    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;

    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0 && direction !== "left") direction = "right";
            else if (diffX < 0 && direction !== "right") direction = "left";
        } else {
            if (diffY > 0 && direction !== "up") direction = "down";
            else if (diffY < 0 && direction !== "down") direction = "up";
        }
    }

    touchStartX = 0;
    touchStartY = 0;
}, { passive: true });

gameLoop();