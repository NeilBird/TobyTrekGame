// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'ready'; // 'ready', 'playing', 'gameOver'
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let animationId;

// Bird properties
const bird = {
    x: 50,
    y: 300,
    width: 35,
    height: 35,
    velocity: 0,
    gravity: 0.5,
    jump: -8,
    rotation: 0
};

// Obstacle properties
const obstacles = [];
const obstacleWidth = 60;
const obstacleGap = 150;
const obstacleSpeed = 2;
let frameCount = 0;

// DOM elements
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const finalScoreDisplay = document.getElementById('finalScore');

// Update high score display
highScoreDisplay.textContent = highScore;

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
canvas.addEventListener('click', handleFlap);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleFlap();
    }
});

function handleFlap() {
    if (gameState === 'playing') {
        bird.velocity = bird.jump;
    }
}

function startGame() {
    gameState = 'playing';
    startBtn.style.display = 'none';
    score = 0;
    bird.y = 300;
    bird.velocity = 0;
    obstacles.length = 0;
    frameCount = 0;
    gameLoop();
}

function restartGame() {
    gameOverDiv.classList.add('hidden');
    startGame();
}

function gameLoop() {
    if (gameState !== 'playing') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);

    // Generate obstacles
    frameCount++;
    if (frameCount % 90 === 0) {
        const minHeight = 50;
        const maxHeight = canvas.height - obstacleGap - minHeight;
        const height = Math.random() * (maxHeight - minHeight) + minHeight;
        
        obstacles.push({
            x: canvas.width,
            topHeight: height,
            bottomY: height + obstacleGap,
            scored: false
        });
    }

    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= obstacleSpeed;

        // Draw top obstacle (pipe)
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(obs.x, 0, obstacleWidth, obs.topHeight);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.strokeRect(obs.x, 0, obstacleWidth, obs.topHeight);

        // Draw bottom obstacle (pipe)
        ctx.fillRect(obs.x, obs.bottomY, obstacleWidth, canvas.height - obs.bottomY);
        ctx.strokeRect(obs.x, obs.bottomY, obstacleWidth, canvas.height - obs.bottomY);

        // Check scoring
        if (!obs.scored && obs.x + obstacleWidth < bird.x) {
            obs.scored = true;
            score++;
            scoreDisplay.textContent = score;
        }

        // Remove off-screen obstacles
        if (obs.x + obstacleWidth < 0) {
            obstacles.splice(i, 1);
        }

        // Collision detection
        if (
            bird.x + bird.width > obs.x &&
            bird.x < obs.x + obstacleWidth &&
            (bird.y < obs.topHeight || bird.y + bird.height > obs.bottomY)
        ) {
            endGame();
        }
    }

    // Draw bird as a simple emoji-like character
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate((bird.rotation * Math.PI) / 180);
    
    // Bird body (orange circle)
    ctx.fillStyle = '#ff9500';
    ctx.beginPath();
    ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird wing
    ctx.fillStyle = '#ff7b00';
    ctx.beginPath();
    ctx.ellipse(-5, 0, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(8, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird beak
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(22, -3);
    ctx.lineTo(22, 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

    // Check boundaries
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        endGame();
    }

    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState = 'gameOver';
    cancelAnimationFrame(animationId);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
    
    finalScoreDisplay.textContent = score;
    gameOverDiv.classList.remove('hidden');
}

// Draw initial state
ctx.fillStyle = '#87ceeb';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#764ba2';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('Click "Start Game" to begin!', canvas.width / 2, canvas.height / 2);
