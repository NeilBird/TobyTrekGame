// Game Version
const GAME_VERSION = '0.2.0';

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
const LEVELS_PER_WORLD = 3; // Complete 3 levels before changing world
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
    SPACE: 'space'
};

// Game Objects Types - 2 good (treats), 2 bad (hazards), 1 shield
const OBJECT_TYPES = {
    // Good items - Toby's treats!
    CHICKEN: { emoji: '🍗', type: 'treat', points: 15, color: '#FFB347' },
    SHRIMP: { emoji: '🦐', type: 'treat', points: 20, color: '#FF6B6B' },
    // Bad items - things Toby hates!
    HAIRDRYER: { emoji: 'hairdryer', type: 'bad', points: -10, color: '#FFB347' },
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
    
    // Create a more interesting melody with different scales per world
    const playNote = (freq, startTime, duration, type = 'square', volume = 0.08) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.connect(gain);
        gain.connect(musicGain);
        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    // Different melodies for each world
    const getWorldMelody = () => {
        if (currentWorld === WORLDS.GARDEN) {
            // Happy major key melody
            return [
                { note: 523, time: 0, dur: 0.15 },     // C5
                { note: 587, time: 0.2, dur: 0.15 },   // D5
                { note: 659, time: 0.4, dur: 0.15 },   // E5
                { note: 698, time: 0.6, dur: 0.15 },   // F5
                { note: 784, time: 0.8, dur: 0.3 },    // G5
                { note: 659, time: 1.2, dur: 0.15 },   // E5
                { note: 523, time: 1.4, dur: 0.3 },    // C5
                { note: 392, time: 1.8, dur: 0.15 },   // G4
                { note: 440, time: 2.0, dur: 0.15 },   // A4
                { note: 523, time: 2.2, dur: 0.15 },   // C5
                { note: 587, time: 2.4, dur: 0.15 },   // D5
                { note: 659, time: 2.6, dur: 0.3 },    // E5
                { note: 784, time: 3.0, dur: 0.15 },   // G5
                { note: 880, time: 3.2, dur: 0.15 },   // A5
                { note: 784, time: 3.4, dur: 0.3 },    // G5
                { note: 659, time: 3.8, dur: 0.15 },   // E5
            ];
        } else if (currentWorld === WORLDS.PARK) {
            // Playful bouncy melody
            return [
                { note: 392, time: 0, dur: 0.1 },      // G4
                { note: 494, time: 0.15, dur: 0.1 },   // B4
                { note: 587, time: 0.3, dur: 0.2 },    // D5
                { note: 784, time: 0.55, dur: 0.2 },   // G5
                { note: 698, time: 0.8, dur: 0.15 },   // F5
                { note: 587, time: 1.0, dur: 0.15 },   // D5
                { note: 494, time: 1.2, dur: 0.2 },    // B4
                { note: 392, time: 1.5, dur: 0.1 },    // G4
                { note: 440, time: 1.65, dur: 0.1 },   // A4
                { note: 494, time: 1.8, dur: 0.2 },    // B4
                { note: 587, time: 2.05, dur: 0.2 },   // D5
                { note: 659, time: 2.3, dur: 0.15 },   // E5
                { note: 587, time: 2.5, dur: 0.15 },   // D5
                { note: 494, time: 2.7, dur: 0.2 },    // B4
                { note: 523, time: 2.95, dur: 0.3 },   // C5
                { note: 494, time: 3.3, dur: 0.15 },   // B4
                { note: 440, time: 3.5, dur: 0.15 },   // A4
                { note: 392, time: 3.7, dur: 0.25 },   // G4
            ];
        } else {
            // Space - mysterious ethereal melody
            return [
                { note: 330, time: 0, dur: 0.4 },      // E4
                { note: 392, time: 0.5, dur: 0.3 },    // G4
                { note: 440, time: 0.9, dur: 0.3 },    // A4
                { note: 523, time: 1.3, dur: 0.5 },    // C5
                { note: 494, time: 1.9, dur: 0.3 },    // B4
                { note: 392, time: 2.3, dur: 0.4 },    // G4
                { note: 349, time: 2.8, dur: 0.3 },    // F4
                { note: 330, time: 3.2, dur: 0.5 },    // E4
            ];
        }
    };

    // Bass lines per world
    const getWorldBass = () => {
        if (currentWorld === WORLDS.GARDEN) {
            return [
                { note: 131, time: 0, dur: 0.6 },    // C3
                { note: 165, time: 0.8, dur: 0.6 },  // E3
                { note: 131, time: 1.6, dur: 0.6 },  // C3
                { note: 98, time: 2.4, dur: 0.6 },   // G2
                { note: 110, time: 3.2, dur: 0.6 },  // A2
            ];
        } else if (currentWorld === WORLDS.PARK) {
            return [
                { note: 98, time: 0, dur: 0.4 },     // G2
                { note: 98, time: 0.5, dur: 0.4 },   // G2
                { note: 123, time: 1.0, dur: 0.4 },  // B2
                { note: 98, time: 1.5, dur: 0.4 },   // G2
                { note: 110, time: 2.0, dur: 0.4 },  // A2
                { note: 98, time: 2.5, dur: 0.4 },   // G2
                { note: 131, time: 3.0, dur: 0.4 },  // C3
                { note: 98, time: 3.5, dur: 0.4 },   // G2
            ];
        } else {
            return [
                { note: 82, time: 0, dur: 1.5 },     // E2 - long drone
                { note: 98, time: 2.0, dur: 1.5 },   // G2
            ];
        }
    };

    // Arpeggios/harmony
    const getWorldArpeggio = () => {
        if (currentWorld === WORLDS.GARDEN) {
            return [
                { note: 262, time: 0.1, dur: 0.1 },
                { note: 330, time: 0.3, dur: 0.1 },
                { note: 392, time: 0.5, dur: 0.1 },
                { note: 330, time: 1.1, dur: 0.1 },
                { note: 392, time: 1.3, dur: 0.1 },
                { note: 523, time: 1.5, dur: 0.1 },
                { note: 262, time: 2.1, dur: 0.1 },
                { note: 330, time: 2.3, dur: 0.1 },
                { note: 392, time: 2.5, dur: 0.1 },
                { note: 330, time: 3.1, dur: 0.1 },
                { note: 262, time: 3.3, dur: 0.1 },
                { note: 196, time: 3.5, dur: 0.1 },
            ];
        } else if (currentWorld === WORLDS.PARK) {
            return [
                { note: 294, time: 0.1, dur: 0.08 },
                { note: 392, time: 0.25, dur: 0.08 },
                { note: 294, time: 0.85, dur: 0.08 },
                { note: 392, time: 1.0, dur: 0.08 },
                { note: 330, time: 1.6, dur: 0.08 },
                { note: 440, time: 1.75, dur: 0.08 },
                { note: 294, time: 2.35, dur: 0.08 },
                { note: 392, time: 2.5, dur: 0.08 },
                { note: 262, time: 3.1, dur: 0.08 },
                { note: 330, time: 3.25, dur: 0.08 },
                { note: 392, time: 3.55, dur: 0.08 },
            ];
        } else {
            // Space - ethereal pads
            return [
                { note: 165, time: 0, dur: 1.8 },    // E3
                { note: 196, time: 0.1, dur: 1.6 },  // G3
                { note: 247, time: 0.2, dur: 1.4 },  // B3
                { note: 165, time: 2.0, dur: 1.8 },  // E3
                { note: 175, time: 2.1, dur: 1.6 },  // F3
                { note: 220, time: 2.2, dur: 1.4 },  // A3
            ];
        }
    };

    const loopDuration = 4;
    
    function scheduleLoop() {
        if (!musicPlaying || gameState !== 'playing') return;
        
        const now = audioContext.currentTime;
        const melody = getWorldMelody();
        const bass = getWorldBass();
        const arpeggio = getWorldArpeggio();
        
        melody.forEach(({ note, time, dur }) => {
            playNote(note, now + time, dur, 'square', 0.08);
        });
        
        bass.forEach(({ note, time, dur }) => {
            playNote(note, now + time, dur, 'triangle', 0.12);
        });
        
        arpeggio.forEach(({ note, time, dur }) => {
            const type = currentWorld === WORLDS.SPACE ? 'sine' : 'square';
            playNote(note, now + time, dur, type, 0.04);
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
    const worldIndex = Math.floor((level - 1) / LEVELS_PER_WORLD) % 3;
    if (worldIndex === 0) {
        currentWorld = WORLDS.GARDEN;
    } else if (worldIndex === 1) {
        currentWorld = WORLDS.PARK;
    } else {
        currentWorld = WORLDS.SPACE;
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
    } else {
        drawSpaceTunnel();
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
        const nextWorldIndex = Math.floor(level / LEVELS_PER_WORLD) % 3;
        let nextWorldName = 'Garden';
        if (nextWorldIndex === 1) nextWorldName = 'Park';
        else if (nextWorldIndex === 2) nextWorldName = 'Space';
        
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

    // Check if it's the hairdryer - draw custom graphic
    if (obj.emoji === 'hairdryer') {
        drawHairdryer(size);
    } else {
        // Scale and draw emoji
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, 0, 0);
    }

    ctx.restore();
}

function drawHairdryer(size) {
    const scale = size / 40; // Base size is 40
    ctx.save();
    ctx.scale(scale, scale);
    
    // Handle
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.roundRect(-8, 5, 16, 25, 3);
    ctx.fill();
    
    // Handle grip lines
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-5, 10 + i * 6);
        ctx.lineTo(5, 10 + i * 6);
        ctx.stroke();
    }
    
    // Main body
    ctx.fillStyle = '#E91E63'; // Pink hairdryer
    ctx.beginPath();
    ctx.ellipse(0, -5, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body highlight
    ctx.fillStyle = '#F48FB1';
    ctx.beginPath();
    ctx.ellipse(-5, -8, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Nozzle
    ctx.fillStyle = '#424242';
    ctx.beginPath();
    ctx.moveTo(15, -10);
    ctx.lineTo(28, -12);
    ctx.lineTo(28, 2);
    ctx.lineTo(15, 0);
    ctx.closePath();
    ctx.fill();
    
    // Nozzle opening
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(28, -5, 3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Air blast lines
    ctx.strokeStyle = '#90CAF9';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(32, -8 + i * 3);
        ctx.lineTo(40 + i * 3, -10 + i * 4);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Power button
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(-8, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Vent holes on back
    ctx.fillStyle = '#C2185B';
    ctx.beginPath();
    ctx.arc(-14, -5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-14, -9, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-14, -1, 1.5, 0, Math.PI * 2);
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

    // Eyes - bright green
    ctx.fillStyle = '#50C878';
    ctx.beginPath();
    ctx.ellipse(-8, -18, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
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

    // Pupils - black
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(-8, -17, 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -17, 2, 4, 0, 0, Math.PI * 2);
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
