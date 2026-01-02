// Game Version
const GAME_VERSION = '0.3.0';

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TOBY_WIDTH = 80;
const TOBY_HEIGHT = 80;
const TOBY_SPEED = 6;
const INITIAL_APPROACH_SPEED = 0.008;
const MAX_APPROACH_SPEED = 0.018;
const SPAWN_INTERVAL_BASE = 1200;
const ENERGY_DECAY_RATE = 0.12;
const ENERGY_GAIN = 15;
const ENERGY_LOSS = 20;
const LEVEL_DURATION = 30000;
const SPEED_UP_THRESHOLD = 0.5;
const LEVELS_PER_WORLD = 2; // Complete 2 levels before changing world
const SHIELD_DURATION = 5000; // 5 seconds of protection

// Tunnel perspective constants
const HORIZON_Y = 150; // Where the tunnel vanishes
const TUNNEL_WIDTH_AT_HORIZON = 50;
const TUNNEL_WIDTH_AT_BOTTOM = CANVAS_WIDTH;
const PLAYER_ZONE_Y = CANVAS_HEIGHT - 120; // Where objects reach the player

// World themes
const WORLDS = {
    GARDEN: 'garden',
    PARK: 'park', 
    SPACE: 'space',
    SNOW: 'snow'
};

// Game Objects Types - 2 good (treats), 2 bad (hazards), 1 shield
const OBJECT_TYPES = {
    // Good items - Toby's treats!
    CHICKEN: { emoji: '🍗', type: 'treat', points: 15, color: '#FFB347' },
    NICE_FISH: { emoji: 'nicefish', type: 'treat', points: 20, color: '#4FC3F7' },
    // Bad items - things Toby hates!
    FISH_SKELETON: { emoji: 'fishskeleton', type: 'bad', points: -10, color: '#BDBDBD' },
    PUDDLE: { emoji: '💧', type: 'bad', points: -10, color: '#87CEEB' },
    // Shield power-up!
    SHIELD: { emoji: '🛡️', type: 'shield', points: 5, color: '#00BFFF' }
};

// Game State
let canvas, ctx;
let gameState = 'start';
let score = 0;
let energy = 100;
let level = 1;
let currentWorld = WORLDS.GARDEN;
let levelProgress = 0;
let levelStartTime = 0;
let gameStartTime = 0;
let playTime = 0;
let isSpeedUp = false;
let currentApproachSpeed = INITIAL_APPROACH_SPEED;
let spawnInterval = SPAWN_INTERVAL_BASE;
let levelCompleted = false;
let levelCompleteTime = 0;

// Shield state
let shieldActive = false;
let shieldEndTime = 0;
let shieldBubblePhase = 0;

// Audio
let audioContext;
let musicPlaying = false;
let musicGain;

// Toby (Player)
let toby = {
    x: CANVAS_WIDTH / 2,
    y: PLAYER_ZONE_Y,
    width: TOBY_WIDTH,
    height: TOBY_HEIGHT,
    speed: TOBY_SPEED,
    direction: 0,
    targetX: CANVAS_WIDTH / 2
};

// Approaching objects (3D perspective)
let approachingObjects = [];
let lastSpawnTime = 0;

// Tunnel animation
let tunnelOffset = 0;

// Input
let keys = { left: false, right: false };

// DOM Elements
let startScreen, gameScreen, gameOverScreen;
let scoreDisplay, energyFill, levelDisplay, speedIndicator, timerDisplay;
let finalScore, finalLevel, finalTime;

// Initialize game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    startScreen = document.getElementById('start-screen');
    gameScreen = document.getElementById('game-screen');
    gameOverScreen = document.getElementById('game-over-screen');
    scoreDisplay = document.getElementById('score');
    energyFill = document.getElementById('energy-fill');
    levelDisplay = document.getElementById('level');
    speedIndicator = document.getElementById('speed-indicator');
    timerDisplay = document.getElementById('timer');
    finalScore = document.getElementById('final-score');
    finalLevel = document.getElementById('final-level');
    finalTime = document.getElementById('final-time');

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    showScreen('start');
}

// Background Music using Web Audio API
function initAudio() {
    if (audioContext) return;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = audioContext.createGain();
    musicGain.connect(audioContext.destination);
    musicGain.gain.value = 0.3;
}

function playBackgroundMusic() {
    if (!audioContext || musicPlaying) return;
    musicPlaying = true;
    
    // Create atmospheric, cinematic game music
    const playNote = (freq, startTime, duration, type = 'sine', volume = 0.06) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gain.gain.setValueAtTime(volume, startTime + duration - 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);
        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    // Different atmospheric melodies for each world
    const getWorldMelody = () => {
        if (currentWorld === WORLDS.GARDEN) {
            // Peaceful, nature-inspired melody - minor key for depth
            return [
                { note: 392, time: 0, dur: 0.8 },      // G4
                { note: 440, time: 1.0, dur: 0.6 },    // A4
                { note: 523, time: 1.8, dur: 1.0 },    // C5
                { note: 494, time: 3.0, dur: 0.6 },    // B4
                { note: 440, time: 3.8, dur: 0.8 },    // A4
                { note: 392, time: 4.8, dur: 1.2 },    // G4
            ];
        } else if (currentWorld === WORLDS.PARK) {
            // Adventurous, slightly tense melody
            return [
                { note: 330, time: 0, dur: 0.5 },      // E4
                { note: 392, time: 0.6, dur: 0.5 },    // G4
                { note: 440, time: 1.2, dur: 0.8 },    // A4
                { note: 494, time: 2.2, dur: 0.6 },    // B4
                { note: 440, time: 3.0, dur: 0.5 },    // A4
                { note: 392, time: 3.6, dur: 0.5 },    // G4
                { note: 349, time: 4.2, dur: 0.8 },    // F4
                { note: 330, time: 5.2, dur: 0.8 },    // E4
            ];
        } else if (currentWorld === WORLDS.SPACE) {
            // Cosmic, mysterious ambient melody
            return [
                { note: 220, time: 0, dur: 1.5 },      // A3
                { note: 262, time: 1.8, dur: 1.2 },    // C4
                { note: 294, time: 3.2, dur: 1.0 },    // D4
                { note: 262, time: 4.5, dur: 1.5 },    // C4
            ];
        } else {
            // Snow - calm, crystalline melody
            return [
                { note: 523, time: 0, dur: 1.0 },      // C5
                { note: 494, time: 1.2, dur: 0.8 },    // B4
                { note: 440, time: 2.2, dur: 1.0 },    // A4
                { note: 392, time: 3.4, dur: 0.8 },    // G4
                { note: 440, time: 4.4, dur: 1.0 },    // A4
                { note: 523, time: 5.6, dur: 0.4 },    // C5
            ];
        }
    };

    // Deep, cinematic bass lines
    const getWorldBass = () => {
        if (currentWorld === WORLDS.GARDEN) {
            return [
                { note: 98, time: 0, dur: 2.0 },      // G2
                { note: 110, time: 2.5, dur: 1.5 },   // A2
                { note: 131, time: 4.5, dur: 1.5 },   // C3
            ];
        } else if (currentWorld === WORLDS.PARK) {
            return [
                { note: 82, time: 0, dur: 1.5 },      // E2
                { note: 98, time: 2.0, dur: 1.5 },    // G2
                { note: 87, time: 4.0, dur: 2.0 },    // F2
            ];
        } else if (currentWorld === WORLDS.SPACE) {
            return [
                { note: 55, time: 0, dur: 3.0 },      // A1 - deep drone
                { note: 65, time: 3.5, dur: 2.5 },    // C2
            ];
        } else {
            return [
                { note: 131, time: 0, dur: 2.0 },     // C3
                { note: 98, time: 2.5, dur: 2.0 },    // G2
                { note: 110, time: 5.0, dur: 1.0 },   // A2
            ];
        }
    };

    // Ambient pads and textures
    const getWorldPad = () => {
        if (currentWorld === WORLDS.GARDEN) {
            return [
                { note: 196, time: 0, dur: 3.0 },     // G3
                { note: 247, time: 0.1, dur: 2.8 },   // B3
                { note: 294, time: 0.2, dur: 2.6 },   // D4
                { note: 196, time: 3.5, dur: 2.5 },   // G3
                { note: 220, time: 3.6, dur: 2.4 },   // A3
                { note: 262, time: 3.7, dur: 2.3 },   // C4
            ];
        } else if (currentWorld === WORLDS.PARK) {
            return [
                { note: 165, time: 0, dur: 2.5 },     // E3
                { note: 196, time: 0.1, dur: 2.3 },   // G3
                { note: 247, time: 0.2, dur: 2.1 },   // B3
                { note: 175, time: 3.0, dur: 2.5 },   // F3
                { note: 220, time: 3.1, dur: 2.3 },   // A3
                { note: 262, time: 3.2, dur: 2.1 },   // C4
            ];
        } else if (currentWorld === WORLDS.SPACE) {
            return [
                { note: 110, time: 0, dur: 4.0 },     // A2
                { note: 165, time: 0.2, dur: 3.8 },   // E3
                { note: 220, time: 0.4, dur: 3.6 },   // A3
                { note: 131, time: 4.5, dur: 1.5 },   // C3
                { note: 196, time: 4.7, dur: 1.3 },   // G3
            ];
        } else {
            // Snow - shimmering high pads
            return [
                { note: 523, time: 0, dur: 2.5 },     // C5
                { note: 659, time: 0.1, dur: 2.3 },   // E5
                { note: 784, time: 0.2, dur: 2.1 },   // G5
                { note: 494, time: 3.0, dur: 2.5 },   // B4
                { note: 587, time: 3.1, dur: 2.3 },   // D5
                { note: 698, time: 3.2, dur: 2.1 },   // F5
            ];
        }
    };

    const loopDuration = 6;
    
    function scheduleLoop() {
        if (!musicPlaying || gameState !== 'playing') return;
        
        const now = audioContext.currentTime;
        const melody = getWorldMelody();
        const bass = getWorldBass();
        const pad = getWorldPad();
        
        // Melody - sine wave for smooth sound
        melody.forEach(({ note, time, dur }) => {
            playNote(note, now + time, dur, 'sine', 0.07);
        });
        
        // Bass - triangle for warmth
        bass.forEach(({ note, time, dur }) => {
            playNote(note, now + time, dur, 'triangle', 0.08);
        });
        
        // Ambient pad - sine for smoothness
        pad.forEach(({ note, time, dur }) => {
            playNote(note, now + time, dur, 'sine', 0.03);
        });
        
        setTimeout(scheduleLoop, loopDuration * 1000);
    }
    
    scheduleLoop();
}

function stopMusic() {
    musicPlaying = false;
}

function showScreen(screen) {
    startScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    switch(screen) {
        case 'start':
            startScreen.classList.remove('hidden');
            break;
        case 'game':
            gameScreen.classList.remove('hidden');
            break;
        case 'gameover':
            gameOverScreen.classList.remove('hidden');
            break;
    }
}

function startGame() {
    initAudio();
    
    gameState = 'playing';
    score = 0;
    energy = 100;
    level = 1;
    currentWorld = WORLDS.GARDEN;
    levelProgress = 0;
    levelStartTime = Date.now();
    gameStartTime = Date.now();
    playTime = 0;
    isSpeedUp = false;
    currentApproachSpeed = INITIAL_APPROACH_SPEED;
    spawnInterval = SPAWN_INTERVAL_BASE;
    approachingObjects = [];
    lastSpawnTime = 0;
    tunnelOffset = 0;
    levelCompleted = false;
    levelCompleteTime = 0;
    shieldActive = false;
    shieldEndTime = 0;
    shieldBubblePhase = 0;

    toby.x = CANVAS_WIDTH / 2;
    toby.targetX = CANVAS_WIDTH / 2;
    toby.direction = 0;

    updateHUD();
    speedIndicator.classList.add('hidden');
    showScreen('game');
    
    playBackgroundMusic();
    requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
}

function gameLoop(timestamp) {
    if (gameState !== 'playing') return;
    update(timestamp);
    render();
    requestAnimationFrame(gameLoop);
}

function update(timestamp) {
    // Update play time
    playTime = Date.now() - gameStartTime;
    
    // Check shield expiration
    if (shieldActive && Date.now() > shieldEndTime) {
        shieldActive = false;
        playShieldPopSound();
    }
    
    // Update shield bubble animation
    if (shieldActive) {
        shieldBubblePhase += 0.1;
    }
    
    // Handle level completion celebration
    if (levelCompleted) {
        if (Date.now() - levelCompleteTime > 2000) {
            levelCompleted = false;
            advanceLevel();
        }
        return; // Pause gameplay during celebration
    }
    
    // Update level progress
    const elapsed = Date.now() - levelStartTime;
    levelProgress = elapsed / LEVEL_DURATION;

    if (levelProgress >= SPEED_UP_THRESHOLD && !isSpeedUp) {
        isSpeedUp = true;
        speedIndicator.classList.remove('hidden');
        currentApproachSpeed = INITIAL_APPROACH_SPEED + (level * 0.002) + 0.004;
        spawnInterval = Math.max(600, SPAWN_INTERVAL_BASE - (level * 50) - 100);
    }

    // Level complete!
    if (levelProgress >= 1) {
        levelCompleted = true;
        levelCompleteTime = Date.now();
        playLevelCompleteSound();
        return;
    }

    // Update Toby position (smooth movement)
    if (keys.left) {
        toby.x -= toby.speed;
        toby.direction = -1;
    } else if (keys.right) {
        toby.x += toby.speed;
        toby.direction = 1;
    } else {
        toby.direction = 0;
    }

    // Keep Toby in bounds (within tunnel at bottom)
    const minX = 80;
    const maxX = CANVAS_WIDTH - 80;
    toby.x = Math.max(minX, Math.min(maxX, toby.x));

    // Spawn approaching objects
    if (timestamp - lastSpawnTime > spawnInterval) {
        spawnObject();
        lastSpawnTime = timestamp;
    }

    // Update approaching objects
    for (let i = approachingObjects.length - 1; i >= 0; i--) {
        const obj = approachingObjects[i];
        obj.z += currentApproachSpeed; // z goes from 0 (far) to 1 (close)

        // Check collision when object reaches player zone
        if (obj.z >= 0.85 && obj.z <= 1.0 && !obj.collected) {
            const objScreenX = getScreenX(obj.laneX, obj.z);
            const objSize = getObjectSize(obj.z);
            
            if (Math.abs(objScreenX - toby.x) < (objSize / 2 + TOBY_WIDTH / 3)) {
                handleCollision(obj);
                obj.collected = true;
            }
        }

        // Remove objects that passed the player
        if (obj.z > 1.1) {
            approachingObjects.splice(i, 1);
        }
    }

    // Update tunnel animation
    tunnelOffset = (tunnelOffset + currentApproachSpeed * 50) % 50;

    energy -= ENERGY_DECAY_RATE;
    energy = Math.max(0, energy);

    if (energy <= 0) {
        gameOver();
        return;
    }

    updateHUD();
}

function advanceLevel() {
    level++;
    levelProgress = 0;
    levelStartTime = Date.now();
    isSpeedUp = false;
    speedIndicator.classList.add('hidden');
    currentApproachSpeed = INITIAL_APPROACH_SPEED + (level * 0.0015);
    spawnInterval = Math.max(800, SPAWN_INTERVAL_BASE - (level * 50));
    energy = Math.min(100, energy + 20);
    approachingObjects = []; // Clear objects for new level
    
    // Change world every LEVELS_PER_WORLD levels
    const worldIndex = Math.floor((level - 1) / LEVELS_PER_WORLD) % 4;
    if (worldIndex === 0) {
        currentWorld = WORLDS.GARDEN;
    } else if (worldIndex === 1) {
        currentWorld = WORLDS.PARK;
    } else if (worldIndex === 2) {
        currentWorld = WORLDS.SPACE;
    } else {
        currentWorld = WORLDS.SNOW;
    }
    
    updateHUD();
}

function playLevelCompleteSound() {
    if (!audioContext) return;
    
    // Triumphant fanfare
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(audioContext.currentTime + i * 0.15);
        osc.stop(audioContext.currentTime + i * 0.15 + 0.4);
    });
}

function playShieldPopSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
}

function playShieldCollectSound() {
    if (!audioContext) return;
    // Magical sparkle sound
    for (let i = 0; i < 3; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1200 + i * 400;
        gain.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(audioContext.currentTime + i * 0.1);
        osc.stop(audioContext.currentTime + i * 0.1 + 0.2);
    }
}

function spawnObject() {
    const objectKeys = Object.keys(OBJECT_TYPES).filter(k => k !== 'SHIELD');
    
    let weights;
    if (levelProgress < 0.3) {
        weights = { treat: 0.7, bad: 0.3 };
    } else if (levelProgress < 0.6) {
        weights = { treat: 0.5, bad: 0.5 };
    } else {
        weights = { treat: 0.4, bad: 0.6 };
    }

    // Small chance to spawn a shield (5% chance)
    if (Math.random() < 0.05 && !shieldActive) {
        const objectType = OBJECT_TYPES.SHIELD;
        const laneX = (Math.random() - 0.5) * 1.6;
        const obj = {
            laneX: laneX,
            z: 0,
            ...objectType,
            collected: false,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        };
        approachingObjects.push(obj);
        return;
    }

    let selectedKey;
    if (Math.random() < weights.treat) {
        const treats = objectKeys.filter(k => OBJECT_TYPES[k].type === 'treat');
        selectedKey = treats[Math.floor(Math.random() * treats.length)];
    } else {
        const bads = objectKeys.filter(k => OBJECT_TYPES[k].type === 'bad');
        selectedKey = bads[Math.floor(Math.random() * bads.length)];
    }

    const objectType = OBJECT_TYPES[selectedKey];

    // Lane position (-1 to 1, where 0 is center)
    const laneX = (Math.random() - 0.5) * 1.6;

    const obj = {
        laneX: laneX,
        z: 0, // 0 = far away, 1 = at player
        ...objectType,
        collected: false,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    };

    approachingObjects.push(obj);
}

// Convert lane position and depth to screen X coordinate
function getScreenX(laneX, z) {
    const tunnelWidthAtZ = TUNNEL_WIDTH_AT_HORIZON + (TUNNEL_WIDTH_AT_BOTTOM - TUNNEL_WIDTH_AT_HORIZON) * z;
    return CANVAS_WIDTH / 2 + laneX * (tunnelWidthAtZ / 2);
}

// Convert depth to screen Y coordinate
function getScreenY(z) {
    return HORIZON_Y + (PLAYER_ZONE_Y - HORIZON_Y) * z;
}

// Get object size based on depth
function getObjectSize(z) {
    return 15 + z * 50;
}

function handleCollision(obj) {
    if (obj.type === 'shield') {
        shieldActive = true;
        shieldEndTime = Date.now() + SHIELD_DURATION;
        shieldBubblePhase = 0;
        score += obj.points * level;
        playShieldCollectSound();
    } else if (obj.type === 'treat') {
        score += obj.points * level;
        energy = Math.min(100, energy + ENERGY_GAIN);
        playCollectSound();
    } else {
        // Bad item - but shield protects!
        if (shieldActive) {
            // Shield absorbs the hit
            playCollectSound(); // Positive sound since we're protected
        } else {
            score = Math.max(0, score + obj.points);
            energy = Math.max(0, energy - ENERGY_LOSS);
            playHitSound();
        }
    }
}

function playCollectSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.15);
}

function playHitSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateHUD() {
    scoreDisplay.textContent = score;
    energyFill.style.width = `${energy}%`;
    levelDisplay.textContent = level;
    timerDisplay.textContent = formatTime(playTime);

    if (energy < 25) {
        energyFill.style.background = '#ff4444';
    } else if (energy < 50) {
        energyFill.style.background = 'linear-gradient(90deg, #ff4444 0%, #ffaa00 100%)';
    } else {
        energyFill.style.background = 'linear-gradient(90deg, #ff4444 0%, #ffaa00 50%, #44ff44 100%)';
    }
}

function gameOver() {
    gameState = 'gameover';
    stopMusic();
    finalScore.textContent = score;
    finalLevel.textContent = level;
    finalTime.textContent = formatTime(playTime);
    showScreen('gameover');
}

function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw tunnel background based on current world
    if (currentWorld === WORLDS.GARDEN) {
        drawGardenTunnel();
    } else if (currentWorld === WORLDS.PARK) {
        drawParkTunnel();
    } else if (currentWorld === WORLDS.SPACE) {
        drawSpaceTunnel();
    } else {
        drawSnowTunnel();
    }

    // Draw approaching objects (sorted by depth - far objects first)
    approachingObjects
        .filter(obj => !obj.collected)
        .sort((a, b) => a.z - b.z)
        .forEach(obj => drawApproachingObject(obj));

    // Draw Toby
    drawToby();
    
    // Draw shield bubble around Toby if active
    if (shieldActive) {
        drawShieldBubble();
    }
    
    // Draw shield countdown
    if (shieldActive) {
        const remaining = Math.ceil((shieldEndTime - Date.now()) / 1000);
        ctx.fillStyle = '#00BFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(`🛡️ ${remaining}s`, CANVAS_WIDTH / 2, 80);
        ctx.shadowBlur = 0;
    }

    // Speed up overlay
    if (isSpeedUp) {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // Level complete celebration
    if (levelCompleted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText(`Level ${level} Complete!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        
        // Show what's coming next
        const nextWorldIndex = Math.floor(level / LEVELS_PER_WORLD) % 4;
        let nextWorldName = 'Garden';
        if (nextWorldIndex === 1) nextWorldName = 'Park';
        else if (nextWorldIndex === 2) nextWorldName = 'Space';
        else if (nextWorldIndex === 3) nextWorldName = 'Snow';
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px Arial';
        if (level % LEVELS_PER_WORLD === 0) {
            ctx.fillText(`Next: ${nextWorldName} Adventure!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        } else {
            ctx.fillText('Get Ready!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        }
        ctx.shadowBlur = 0;
    }
}

function drawShieldBubble() {
    ctx.save();
    ctx.translate(toby.x, toby.y);
    
    // Animated bubble
    const pulseSize = Math.sin(shieldBubblePhase) * 5;
    const radius = 55 + pulseSize;
    
    // Outer glow
    const gradient = ctx.createRadialGradient(0, 0, radius - 10, 0, 0, radius + 20);
    gradient.addColorStop(0, 'rgba(0, 191, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Bubble outline
    ctx.strokeStyle = 'rgba(0, 191, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner bubble fill
    ctx.fillStyle = 'rgba(0, 191, 255, 0.1)';
    ctx.fill();
    
    // Sparkle highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-20, -30, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-30, -15, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawGardenTunnel() {
    // Beautiful blue sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 100);
    skyGradient.addColorStop(0, '#87CEEB');  // Light sky blue at top
    skyGradient.addColorStop(0.5, '#B0E0E6'); // Powder blue
    skyGradient.addColorStop(1, '#E0F6FF');   // Very light blue at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HORIZON_Y + 100);

    // Draw the sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(650, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun glow
    const sunGlow = ctx.createRadialGradient(650, 80, 30, 650, 80, 100);
    sunGlow.addColorStop(0, 'rgba(255, 223, 0, 0.6)');
    sunGlow.addColorStop(0.5, 'rgba(255, 223, 0, 0.2)');
    sunGlow.addColorStop(1, 'rgba(255, 223, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(650, 80, 100, 0, Math.PI * 2);
    ctx.fill();

    // Draw fluffy clouds
    drawCloud(100, 60, 50);
    drawCloud(280, 90, 40);
    drawCloud(480, 50, 55);
    drawCloud(180, 130, 35);
    drawCloud(580, 120, 45);

    // Green grass/garden path with perspective
    const grassGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    grassGradient.addColorStop(0, '#90EE90');  // Light green at horizon
    grassGradient.addColorStop(0.3, '#32CD32'); // Lime green
    grassGradient.addColorStop(0.7, '#228B22'); // Forest green
    grassGradient.addColorStop(1, '#006400');   // Dark green near player
    
    // Draw grass path (tunnel floor)
    ctx.fillStyle = grassGradient;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Draw grass texture lines (perspective)
    ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
    ctx.lineWidth = 2;

    // Horizontal grass lines - animated
    for (let i = 0; i < 12; i++) {
        const z = ((i * 60 + tunnelOffset) % 720) / 720;
        if (z < 0.05) continue;
        
        const y = getScreenY(z);
        const leftX = getScreenX(-0.8, z);
        const rightX = getScreenX(0.8, z);
        
        ctx.globalAlpha = 0.2 + z * 0.4;
        ctx.strokeStyle = 'rgba(0, 80, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Draw garden borders (flower beds on sides)
    // Left side - darker grass/hedge
    const leftHedge = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    leftHedge.addColorStop(0, '#228B22');
    leftHedge.addColorStop(1, '#004d00');
    ctx.fillStyle = leftHedge;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(0, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Right side - darker grass/hedge  
    ctx.fillStyle = leftHedge;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Add detailed flowers on the borders
    drawDetailedFlowers();

    // Draw a subtle path/lane marker
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 25]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, HORIZON_Y);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawParkTunnel() {
    // Bright cheerful sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 100);
    skyGradient.addColorStop(0, '#64B5F6');  // Bright blue
    skyGradient.addColorStop(0.5, '#90CAF9');
    skyGradient.addColorStop(1, '#BBDEFB');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HORIZON_Y + 100);

    // Sun
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(120, 70, 45, 0, Math.PI * 2);
    ctx.fill();
    
    // Clouds
    drawCloud(320, 50, 45);
    drawCloud(550, 80, 50);
    drawCloud(700, 40, 35);

    // Draw playground equipment in background
    drawSwingSet(200, HORIZON_Y - 20);
    drawSlide(550, HORIZON_Y - 15);
    drawTree(80, HORIZON_Y + 20, 60);
    drawTree(700, HORIZON_Y + 25, 55);

    // Sandy/grassy park path
    const pathGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    pathGradient.addColorStop(0, '#C8E6C9');  // Light grass
    pathGradient.addColorStop(0.3, '#81C784');
    pathGradient.addColorStop(0.6, '#66BB6A');
    pathGradient.addColorStop(1, '#4CAF50');
    
    ctx.fillStyle = pathGradient;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Path lines
    for (let i = 0; i < 10; i++) {
        const z = ((i * 70 + tunnelOffset) % 700) / 700;
        if (z < 0.05) continue;
        
        const y = getScreenY(z);
        const leftX = getScreenX(-0.8, z);
        const rightX = getScreenX(0.8, z);
        
        ctx.globalAlpha = 0.15 + z * 0.2;
        ctx.strokeStyle = 'rgba(139, 195, 74, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Park borders - darker grass with bushes
    const borderGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    borderGradient.addColorStop(0, '#4CAF50');
    borderGradient.addColorStop(1, '#2E7D32');
    
    ctx.fillStyle = borderGradient;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(0, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Draw bushes along borders
    drawParkBushes();
}

function drawSpaceTunnel() {
    // Deep space gradient
    const spaceGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    spaceGradient.addColorStop(0, '#0D0221');
    spaceGradient.addColorStop(0.3, '#190A33');
    spaceGradient.addColorStop(0.6, '#1A1A2E');
    spaceGradient.addColorStop(1, '#16213E');
    ctx.fillStyle = spaceGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    drawStars();
    
    // Draw planets
    drawPlanet(100, 80, 40, '#FF6B6B', '#FF8E53'); // Red planet
    drawPlanet(680, 120, 25, '#4FC3F7', '#29B6F6'); // Blue planet
    drawPlanet(400, 60, 55, '#FFB74D', '#FFA726'); // Orange/Saturn-like
    
    // Draw moon
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath();
    ctx.arc(200, 130, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#BDBDBD';
    ctx.beginPath();
    ctx.arc(190, 125, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(210, 138, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(195, 140, 4, 0, Math.PI * 2);
    ctx.fill();

    // Space path - cosmic energy trail
    const pathGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    pathGradient.addColorStop(0, 'rgba(156, 39, 176, 0.3)');
    pathGradient.addColorStop(0.5, 'rgba(103, 58, 183, 0.5)');
    pathGradient.addColorStop(1, 'rgba(63, 81, 181, 0.7)');
    
    ctx.fillStyle = pathGradient;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Energy lines
    for (let i = 0; i < 12; i++) {
        const z = ((i * 60 + tunnelOffset * 2) % 720) / 720;
        if (z < 0.05) continue;
        
        const y = getScreenY(z);
        const leftX = getScreenX(-0.8, z);
        const rightX = getScreenX(0.8, z);
        
        ctx.globalAlpha = 0.3 + z * 0.4;
        ctx.strokeStyle = `hsl(${260 + z * 60}, 80%, 60%)`;
        ctx.lineWidth = 1 + z * 2;
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Nebula borders
    const nebulaLeft = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    nebulaLeft.addColorStop(0, 'rgba(233, 30, 99, 0.3)');
    nebulaLeft.addColorStop(1, 'rgba(156, 39, 176, 0.5)');
    
    ctx.fillStyle = nebulaLeft;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(0, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = nebulaLeft;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, HORIZON_Y);
    ctx.closePath();
    ctx.fill();
}

function drawSnowTunnel() {
    // Winter sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 100);
    skyGradient.addColorStop(0, '#4A6FA5');    // Deep winter blue
    skyGradient.addColorStop(0.4, '#7BA3D0');  // Lighter blue
    skyGradient.addColorStop(0.8, '#B8D4E8');  // Pale blue
    skyGradient.addColorStop(1, '#E8F1F5');    // Almost white at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HORIZON_Y + 100);

    // Draw snow-capped mountains in background
    drawSnowMountains();

    // Draw falling snowflakes
    drawSnowflakes();

    // Snowy path
    const snowGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    snowGradient.addColorStop(0, '#E8F4F8');   // Light snow at horizon
    snowGradient.addColorStop(0.3, '#D4E6EC');  // Slightly blue snow
    snowGradient.addColorStop(0.6, '#C0D8E0');  // Deeper snow
    snowGradient.addColorStop(1, '#F5FBFC');    // Bright snow near player
    
    ctx.fillStyle = snowGradient;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Snow texture lines - sparkling effect
    for (let i = 0; i < 10; i++) {
        const z = ((i * 70 + tunnelOffset) % 700) / 700;
        if (z < 0.05) continue;
        
        const y = getScreenY(z);
        const leftX = getScreenX(-0.8, z);
        const rightX = getScreenX(0.8, z);
        
        ctx.globalAlpha = 0.2 + z * 0.3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1 + z;
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Snow banks on sides
    const snowBankGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    snowBankGradient.addColorStop(0, '#D0E8F0');
    snowBankGradient.addColorStop(0.5, '#B8DCE8');
    snowBankGradient.addColorStop(1, '#A0D0E0');
    
    ctx.fillStyle = snowBankGradient;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(0, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Draw pine trees along borders
    drawSnowTrees();

    // Draw snowdrifts
    drawSnowDrifts();
}

function drawSnowMountains() {
    // Far mountains
    ctx.fillStyle = '#8FAABE';
    ctx.beginPath();
    ctx.moveTo(0, HORIZON_Y);
    ctx.lineTo(100, HORIZON_Y - 60);
    ctx.lineTo(200, HORIZON_Y - 30);
    ctx.lineTo(300, HORIZON_Y - 80);
    ctx.lineTo(400, HORIZON_Y - 40);
    ctx.lineTo(500, HORIZON_Y - 90);
    ctx.lineTo(600, HORIZON_Y - 50);
    ctx.lineTo(700, HORIZON_Y - 70);
    ctx.lineTo(800, HORIZON_Y - 35);
    ctx.lineTo(800, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Snow caps
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(95, HORIZON_Y - 55);
    ctx.lineTo(100, HORIZON_Y - 60);
    ctx.lineTo(105, HORIZON_Y - 55);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(295, HORIZON_Y - 70);
    ctx.lineTo(300, HORIZON_Y - 80);
    ctx.lineTo(310, HORIZON_Y - 65);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(490, HORIZON_Y - 80);
    ctx.lineTo(500, HORIZON_Y - 90);
    ctx.lineTo(515, HORIZON_Y - 75);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(695, HORIZON_Y - 60);
    ctx.lineTo(700, HORIZON_Y - 70);
    ctx.lineTo(710, HORIZON_Y - 55);
    ctx.closePath();
    ctx.fill();
}

function drawSnowflakes() {
    ctx.fillStyle = '#FFFFFF';
    // Animated snowflakes
    const time = Date.now() / 1000;
    for (let i = 0; i < 30; i++) {
        const x = (i * 97 + time * 20 * (1 + (i % 3) * 0.3)) % CANVAS_WIDTH;
        const y = (i * 43 + time * 40 * (1 + (i % 4) * 0.2)) % (HORIZON_Y + 50);
        const size = 1.5 + (i % 3);
        
        ctx.globalAlpha = 0.6 + Math.sin(time + i) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawSnowTrees() {
    // Left side pine trees
    for (let i = 0; i < 5; i++) {
        const z = 0.2 + i * 0.15;
        const y = getScreenY(z);
        const x = getScreenX(-0.95, z) + 20;
        const size = 15 + z * 30;
        
        drawPineTree(x, y, size);
    }

    // Right side pine trees
    for (let i = 0; i < 5; i++) {
        const z = 0.15 + i * 0.15;
        const y = getScreenY(z);
        const x = getScreenX(0.95, z) - 20;
        const size = 15 + z * 30;
        
        drawPineTree(x, y, size);
    }
}

function drawPineTree(x, y, size) {
    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - size * 0.08, y, size * 0.16, size * 0.3);

    // Tree layers (3 triangular sections)
    ctx.fillStyle = '#2E7D32';
    for (let layer = 0; layer < 3; layer++) {
        const layerY = y - layer * size * 0.25;
        const layerWidth = size * (0.6 - layer * 0.12);
        const layerHeight = size * 0.35;
        
        ctx.beginPath();
        ctx.moveTo(x, layerY - layerHeight);
        ctx.lineTo(x - layerWidth / 2, layerY);
        ctx.lineTo(x + layerWidth / 2, layerY);
        ctx.closePath();
        ctx.fill();
    }

    // Snow on branches
    ctx.fillStyle = '#FFFFFF';
    for (let layer = 0; layer < 3; layer++) {
        const layerY = y - layer * size * 0.25;
        const layerWidth = size * (0.5 - layer * 0.1);
        
        ctx.beginPath();
        ctx.moveTo(x, layerY - size * 0.3);
        ctx.lineTo(x - layerWidth / 3, layerY - size * 0.15);
        ctx.lineTo(x + layerWidth / 3, layerY - size * 0.15);
        ctx.closePath();
        ctx.fill();
    }
}

function drawSnowDrifts() {
    ctx.fillStyle = '#FFFFFF';
    
    // Left side drifts
    for (let i = 0; i < 4; i++) {
        const z = 0.3 + i * 0.18;
        const y = getScreenY(z);
        const x = getScreenX(-0.85, z);
        const size = 10 + z * 25;
        
        ctx.beginPath();
        ctx.ellipse(x, y + 5, size, size * 0.4, 0, 0, Math.PI);
        ctx.fill();
    }

    // Right side drifts
    for (let i = 0; i < 4; i++) {
        const z = 0.25 + i * 0.18;
        const y = getScreenY(z);
        const x = getScreenX(0.85, z);
        const size = 10 + z * 25;
        
        ctx.beginPath();
        ctx.ellipse(x, y + 5, size, size * 0.4, 0, 0, Math.PI);
        ctx.fill();
    }
}

function drawSwingSet(x, y) {
    // Posts
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 30, y + 40);
    ctx.lineTo(x - 15, y - 30);
    ctx.lineTo(x + 15, y - 30);
    ctx.lineTo(x + 30, y + 40);
    ctx.stroke();
    
    // Top bar
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 30);
    ctx.lineTo(x + 15, y - 30);
    ctx.stroke();
    
    // Swing chains
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 30);
    ctx.lineTo(x - 8, y + 10);
    ctx.moveTo(x + 5, y - 30);
    ctx.lineTo(x + 8, y + 10);
    ctx.stroke();
    
    // Swing seat
    ctx.fillStyle = '#F44336';
    ctx.fillRect(x - 12, y + 8, 24, 6);
}

function drawSlide(x, y) {
    // Slide platform
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(x + 15, y - 25, 25, 8);
    
    // Slide
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.moveTo(x + 15, y - 20);
    ctx.quadraticCurveTo(x - 10, y + 10, x - 20, y + 35);
    ctx.lineTo(x - 10, y + 38);
    ctx.quadraticCurveTo(x, y + 15, x + 25, y - 17);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FBC02D';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Ladder
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 25);
    ctx.lineTo(x + 35, y + 35);
    ctx.moveTo(x + 40, y - 25);
    ctx.lineTo(x + 45, y + 35);
    ctx.stroke();
    
    // Rungs
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 31 + i * 1.2, y - 15 + i * 12);
        ctx.lineTo(x + 41 + i * 1.2, y - 15 + i * 12);
        ctx.stroke();
    }
}

function drawTree(x, y, size) {
    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - size * 0.1, y, size * 0.2, size * 0.5);
    
    // Foliage
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.arc(x + size * 0.15, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawParkBushes() {
    const bushColors = ['#43A047', '#388E3C', '#2E7D32'];
    
    // Left side bushes
    for (let i = 0; i < 6; i++) {
        const z = 0.25 + i * 0.12;
        const y = getScreenY(z);
        const x = getScreenX(-0.9, z);
        const size = 8 + z * 20;
        
        ctx.fillStyle = bushColors[i % 3];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Right side bushes
    for (let i = 0; i < 6; i++) {
        const z = 0.2 + i * 0.12;
        const y = getScreenY(z);
        const x = getScreenX(0.9, z);
        const size = 8 + z * 20;
        
        ctx.fillStyle = bushColors[(i + 1) % 3];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - size * 0.5, y + size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawStars() {
    // Static stars (seeded random for consistency)
    const starPositions = [
        [50, 30], [120, 180], [200, 50], [280, 120], [350, 20],
        [420, 90], [500, 40], [580, 150], [650, 70], [720, 30],
        [80, 110], [160, 60], [240, 140], [320, 80], [400, 160],
        [480, 100], [560, 45], [640, 130], [700, 100], [760, 55],
        [30, 70], [100, 140], [180, 25], [260, 100], [340, 50],
        [450, 130], [530, 80], [610, 20], [680, 90], [750, 140]
    ];
    
    ctx.fillStyle = '#FFFFFF';
    starPositions.forEach(([x, y], i) => {
        const twinkle = Math.sin(Date.now() / 500 + i) * 0.5 + 0.5;
        ctx.globalAlpha = 0.5 + twinkle * 0.5;
        const size = 1 + (i % 3);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawPlanet(x, y, radius, color1, color2) {
    // Planet body
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Ring for the orange planet (Saturn-like)
    if (radius > 40) {
        ctx.strokeStyle = 'rgba(255, 224, 178, 0.6)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.5, radius * 0.3, -0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 204, 128, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.7, radius * 0.35, -0.2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawTunnel() {
    drawGardenTunnel();
}

function drawCloud(x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.15, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawDetailedFlowers() {
    const flowerColors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#FF4500', '#FF1493', '#FFA500'];
    
    // Left border flowers - detailed multi-petal flowers
    for (let i = 0; i < 8; i++) {
        const z = 0.2 + i * 0.1;
        const y = getScreenY(z);
        const x = getScreenX(-0.85, z) + 10;
        const size = 4 + z * 10;
        const color = flowerColors[i % flowerColors.length];
        
        drawDetailedFlower(x, y, size, color);
    }
    
    // Right border flowers
    for (let i = 0; i < 8; i++) {
        const z = 0.15 + i * 0.1;
        const y = getScreenY(z);
        const x = getScreenX(0.85, z) - 10;
        const size = 4 + z * 10;
        const color = flowerColors[(i + 3) % flowerColors.length];
        
        drawDetailedFlower(x, y, size, color);
    }
}

function drawDetailedFlower(x, y, size, color) {
    // Draw stem
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = Math.max(1, size / 5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + size * 1.5);
    ctx.stroke();
    
    // Draw leaves
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.ellipse(x - size * 0.3, y + size * 0.8, size * 0.4, size * 0.15, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + size * 0.3, y + size * 1.1, size * 0.35, size * 0.12, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw petals (5-6 petals in a circle)
    const petalCount = 5 + Math.floor(size / 8);
    for (let p = 0; p < petalCount; p++) {
        const angle = (p / petalCount) * Math.PI * 2;
        const petalX = x + Math.cos(angle) * size * 0.5;
        const petalY = y + Math.sin(angle) * size * 0.5;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(petalX, petalY, size * 0.4, size * 0.25, angle, 0, Math.PI * 2);
        ctx.fill();
        
        // Petal highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(petalX - size * 0.1, petalY - size * 0.1, size * 0.15, size * 0.1, angle, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Flower center
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Center detail - tiny dots
    ctx.fillStyle = '#FFA000';
    for (let d = 0; d < 5; d++) {
        const dotAngle = (d / 5) * Math.PI * 2;
        const dotX = x + Math.cos(dotAngle) * size * 0.15;
        const dotY = y + Math.sin(dotAngle) * size * 0.15;
        ctx.beginPath();
        ctx.arc(dotX, dotY, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawFlowers() {
    drawDetailedFlowers();
}

function drawApproachingObject(obj) {
    const screenX = getScreenX(obj.laneX, obj.z);
    const screenY = getScreenY(obj.z);
    const size = getObjectSize(obj.z);

    ctx.save();
    ctx.translate(screenX, screenY);
    obj.rotation += obj.rotationSpeed;
    ctx.rotate(obj.rotation);

    // Glow effect
    if (obj.type === 'treat') {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10 + obj.z * 15;
    } else if (obj.type === 'shield') {
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 15 + obj.z * 20;
    } else {
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = 8 + obj.z * 10;
    }

    ctx.globalAlpha = 0.5 + obj.z * 0.5;

    // Check for custom graphics
    if (obj.emoji === 'fishskeleton') {
        drawFishSkeleton(size);
    } else if (obj.emoji === 'nicefish') {
        drawNiceFish(size);
    } else {
        // Scale and draw emoji
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, 0, 0);
    }

    ctx.restore();
}

function drawFishSkeleton(size) {
    const scale = size / 40; // Base size is 40
    ctx.save();
    ctx.scale(scale, scale);
    
    // Fish skeleton body outline
    ctx.strokeStyle = '#E0E0E0';
    ctx.fillStyle = '#F5F5F5';
    ctx.lineWidth = 2;
    
    // Main body shape
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Head
    ctx.beginPath();
    ctx.ellipse(-18, 0, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Eye socket (empty/spooky)
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(-22, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlight
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(-23, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Spine - main backbone
    ctx.strokeStyle = '#BDBDBD';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(25, 0);
    ctx.stroke();
    
    // Ribs
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        const x = -5 + i * 5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 2, -8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 2, 8);
        ctx.stroke();
    }
    
    // Tail bones
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(35, -12);
    ctx.moveTo(25, 0);
    ctx.lineTo(35, 12);
    ctx.moveTo(28, 0);
    ctx.lineTo(38, -8);
    ctx.moveTo(28, 0);
    ctx.lineTo(38, 8);
    ctx.stroke();
    
    // Jaw bone
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-25, 3);
    ctx.lineTo(-30, 5);
    ctx.lineTo(-28, 8);
    ctx.stroke();
    
    // Teeth
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-27 + i * 3, 3);
        ctx.lineTo(-28 + i * 3, 8);
        ctx.lineTo(-26 + i * 3, 3);
        ctx.fill();
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawNiceFish(size) {
    const scale = size / 40; // Base size is 40
    ctx.save();
    ctx.scale(scale, scale);
    
    // Healthy, happy fish
    
    // Body - gradient blue/teal
    const bodyGradient = ctx.createLinearGradient(-25, -15, 25, 15);
    bodyGradient.addColorStop(0, '#4FC3F7');
    bodyGradient.addColorStop(0.5, '#29B6F6');
    bodyGradient.addColorStop(1, '#0288D1');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-5, -6, 15, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail fin
    ctx.fillStyle = '#0277BD';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(38, -14);
    ctx.lineTo(35, 0);
    ctx.lineTo(38, 14);
    ctx.closePath();
    ctx.fill();
    
    // Tail fin detail
    ctx.strokeStyle = '#01579B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(36, -10);
    ctx.moveTo(25, 0);
    ctx.lineTo(36, 10);
    ctx.stroke();
    
    // Dorsal fin
    ctx.fillStyle = '#0288D1';
    ctx.beginPath();
    ctx.moveTo(-5, -12);
    ctx.quadraticCurveTo(5, -25, 15, -12);
    ctx.lineTo(-5, -12);
    ctx.fill();
    
    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.quadraticCurveTo(5, 20, 12, 12);
    ctx.lineTo(0, 12);
    ctx.fill();
    
    // Side fin
    ctx.fillStyle = '#039BE5';
    ctx.beginPath();
    ctx.ellipse(-5, 5, 8, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.ellipse(-18, 0, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye - happy expression
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-20, -2, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(-19, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye sparkle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-20, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Happy smile
    ctx.strokeStyle = '#01579B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-25, 2, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Scales pattern
    ctx.strokeStyle = 'rgba(1, 87, 155, 0.3)';
    ctx.lineWidth = 1;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            ctx.beginPath();
            ctx.arc(-8 + col * 8, -6 + row * 6, 4, 0.5, Math.PI - 0.5);
            ctx.stroke();
        }
    }
    
    // Bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(-32, -5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-35, -10, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawToby() {
    ctx.save();
    ctx.translate(toby.x, toby.y);

    // Flip based on direction
    if (toby.direction === -1) {
        ctx.scale(-1, 1);
    }

    const scale = 1.2; // Make Toby bigger
    ctx.scale(scale, scale);

    // Draw cat body (WHITE with grey/black markings)
    
    // Body - white
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 10, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Body patches - grey
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.ellipse(-10, 5, 12, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.ellipse(12, 12, 8, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Head - white
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -15, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#CCCCCC';
    ctx.stroke();

    // Head patch - black
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.ellipse(-8, -22, 10, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Ears - white with black tips
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-17, -32);
    ctx.lineTo(-12, -45);
    ctx.lineTo(-5, -32);
    ctx.fill();
    ctx.strokeStyle = '#CCCCCC';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(5, -32);
    ctx.lineTo(12, -45);
    ctx.lineTo(17, -32);
    ctx.fill();
    ctx.stroke();

    // Black ear tips
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.moveTo(-14, -38);
    ctx.lineTo(-12, -45);
    ctx.lineTo(-10, -38);
    ctx.fill();

    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.moveTo(10, -38);
    ctx.lineTo(12, -45);
    ctx.lineTo(14, -38);
    ctx.fill();

    // Inner ears (pink)
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo(-14, -33);
    ctx.lineTo(-12, -40);
    ctx.lineTo(-9, -33);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(9, -33);
    ctx.lineTo(12, -40);
    ctx.lineTo(14, -33);
    ctx.fill();

    // Eyes - yellow/green with gradient
    const eyeGradient1 = ctx.createRadialGradient(-8, -18, 0, -8, -18, 6);
    eyeGradient1.addColorStop(0, '#9ACD32');   // Yellow-green center
    eyeGradient1.addColorStop(0.5, '#7CB342'); // Lime green
    eyeGradient1.addColorStop(1, '#558B2F');   // Darker green edge
    
    ctx.fillStyle = eyeGradient1;
    ctx.beginPath();
    ctx.ellipse(-8, -18, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeGradient2 = ctx.createRadialGradient(8, -18, 0, 8, -18, 6);
    eyeGradient2.addColorStop(0, '#9ACD32');
    eyeGradient2.addColorStop(0.5, '#7CB342');
    eyeGradient2.addColorStop(1, '#558B2F');
    
    ctx.fillStyle = eyeGradient2;
    ctx.beginPath();
    ctx.ellipse(8, -18, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-6, -20, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, -20, 2, 0, Math.PI * 2);
    ctx.fill();

    // Pupils - black vertical slits (cat eyes)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(-8, -17, 1.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -17, 1.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose - pink
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 0);
    ctx.moveTo(-6, 2);
    ctx.quadraticCurveTo(0, 6, 6, 2);
    ctx.stroke();

    // Whiskers - dark grey
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-30, -10);
    ctx.moveTo(-12, -3);
    ctx.lineTo(-30, -3);
    ctx.moveTo(-12, 0);
    ctx.lineTo(-30, 4);
    ctx.moveTo(12, -6);
    ctx.lineTo(30, -10);
    ctx.moveTo(12, -3);
    ctx.lineTo(30, -3);
    ctx.moveTo(12, 0);
    ctx.lineTo(30, 4);
    ctx.stroke();

    // Tail - white with grey/black
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(22, 15);
    ctx.quadraticCurveTo(40, 10, 45, -5);
    ctx.quadraticCurveTo(50, -15, 40, -10);
    ctx.quadraticCurveTo(35, 5, 22, 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#CCCCCC';
    ctx.stroke();

    // Tail stripes - grey/black
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.moveTo(28, 8);
    ctx.quadraticCurveTo(35, 5, 38, 0);
    ctx.quadraticCurveTo(40, 2, 33, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.moveTo(38, -2);
    ctx.quadraticCurveTo(45, -8, 44, -12);
    ctx.quadraticCurveTo(48, -10, 42, -2);
    ctx.closePath();
    ctx.fill();

    // Paws - white
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-15, 30, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#CCCCCC';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(15, 30, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Paw pads - pink
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(-15, 32, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, 32, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw name label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('Toby', toby.x, toby.y + 60);
    ctx.shadowBlur = 0;
}

// Initialize when page loads
window.addEventListener('load', init);
