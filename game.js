// Game Version
const GAME_VERSION = '0.9.8';

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
const BOSS_LEVEL_INTERVAL = 6; // Boss battle every 6 levels

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: { speedMult: 0.5, energyDecayMult: 0.4, spawnMult: 1.5, label: 'Easy' },
    normal: { speedMult: 0.8, energyDecayMult: 0.8, spawnMult: 1.1, label: 'Normal' },
    hard: { speedMult: 1.2, energyDecayMult: 1.3, spawnMult: 0.8, label: 'Hard' }
};
let currentDifficulty = 'normal';

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
    SNOW: 'snow',
    CASTLE: 'castle' // Boss battle world!
};

// Game Objects Types - 2 good (treats), 2 bad (hazards), 1 shield, plus new power-ups
const OBJECT_TYPES = {
    // Good items - Toby's treats!
    CHICKEN: { emoji: '🍗', type: 'treat', points: 15, color: '#FFB347' },
    TUNA: { emoji: 'tuna', type: 'treat', points: 20, color: '#4FC3F7' },
    // Bad items - things Toby hates!
    HAIRDRYER: { emoji: 'hairdryer', type: 'bad', points: -10, color: '#FFB347' },
    PUDDLE: { emoji: '💧', type: 'bad', points: -10, color: '#87CEEB' },
    // Shield power-up!
    SHIELD: { emoji: '🛡️', type: 'shield', points: 5, color: '#00BFFF' },
    // New power-ups!
    SPEED_BOOST: { emoji: '⚡', type: 'speedboost', points: 5, color: '#FFD700' },
    MAGNET: { emoji: '🧲', type: 'magnet', points: 5, color: '#FF4444' },
    DOUBLE_POINTS: { emoji: '✨', type: 'doublepoints', points: 5, color: '#FF69B4' },
    // Boss battle ammo!
    PUNCH: { emoji: '👊', type: 'punch', points: 5, color: '#FF6B35' }
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

// Boss battle state
let isBossLevel = false;
let bossHealth = 100;
let bossMaxHealth = 100;
let punchesCollected = 0;
let thrownPunches = []; // Projectiles thrown at boss
let bossX = 0;
let bossY = 0;
let bossDirection = 1;
let bossHitTime = 0;
let bossDefeated = false;
let bossDefeatedTime = 0;
let bossBattleStartTime = 0;
let currentBossType = 0; // 0=Dave, 1=Hoover, 2=Cucumber, 3=Dougie
let bossShieldSpawned = false; // Track if 50% shield has been given

// Boss types
const BOSS_TYPES = {
    DAVE: { name: 'Dave the Angry Cat', emoji: '😼', color: '#1a1a1a' },
    HOOVER: { name: 'Big Bad Hoover', emoji: '🧹', color: '#4a4a4a' },
    CUCUMBER: { name: 'Creepy Crazy Cucumber', emoji: '🥒', color: '#228B22' },
    DOUGIE: { name: 'Dangerous Dougie the Dog', emoji: '🐕', color: '#8B4513' }
};

// Shield state
let shieldActive = false;
let shieldEndTime = 0;
let shieldBubblePhase = 0;

// New power-up states
let speedBoostActive = false;
let speedBoostEndTime = 0;
let magnetActive = false;
let magnetEndTime = 0;
let doublePointsActive = false;
let doublePointsEndTime = 0;

// Particle system
let particles = [];

// Screen shake
let screenShake = { intensity: 0, duration: 0, startTime: 0 };

// Combo system
let comboCount = 0;
let comboTimer = 0;
const COMBO_TIMEOUT = 2000; // 2 seconds to continue combo

// Sound/Music toggle
let soundEnabled = true;
let musicEnabled = true;

// Pause state
let gamePaused = false;

// Daily challenge
let dailyChallengeActive = false;
let dailyChallengeSeed = 0;

// Kitty Coins Currency System
let kittyCoins = 0;
const COINS_PER_TREAT = 1;      // Earn 1 coin per treat collected
const COINS_PER_LEVEL = 10;    // Earn 10 coins per level completed
const COINS_PER_BOSS = 50;     // Earn 50 coins for defeating a boss

// Helper functions for color manipulation (used for skin rendering)
function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent));
    const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)));
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Character skins with prices
const TOBY_SKINS = {
    default: { name: 'Classic Toby', unlocked: true, price: 0, bodyColor: '#FFFFFF', patchColor: '#333333' },
    golden: { name: 'Golden Toby', unlocked: false, price: 100, bodyColor: '#FFD700', patchColor: '#B8860B' },
    midnight: { name: 'Midnight Toby', unlocked: false, price: 150, bodyColor: '#2C3E50', patchColor: '#1A252F' },
    rainbow: { name: 'Rainbow Toby', unlocked: false, price: 200, bodyColor: '#FF69B4', patchColor: '#9B59B6' },
    space: { name: 'Space Toby', unlocked: false, price: 250, bodyColor: '#4A0080', patchColor: '#00CED1' },
    tiger: { name: 'Tiger Toby', unlocked: false, price: 300, bodyColor: '#FF8C00', patchColor: '#8B4513' },
    ghost: { name: 'Ghost Toby', unlocked: false, price: 350, bodyColor: '#E8E8E8', patchColor: '#C0C0C0' },
    neon: { name: 'Neon Toby', unlocked: false, price: 400, bodyColor: '#00FF00', patchColor: '#FF00FF' }
};
let currentSkin = 'default';

// Achievements system
const ACHIEVEMENTS = {
    first_treat: { name: 'First Bite', description: 'Collect your first treat', icon: '🍖', unlocked: false },
    combo_5: { name: 'Combo King', description: 'Get a 5x combo', icon: '🔥', unlocked: false },
    combo_10: { name: 'Combo Master', description: 'Get a 10x combo', icon: '💥', unlocked: false },
    treats_100: { name: 'Treat Collector', description: 'Collect 100 treats total', icon: '🏆', unlocked: false },
    treats_500: { name: 'Treat Hoarder', description: 'Collect 500 treats total', icon: '👑', unlocked: false },
    complete_garden: { name: 'Garden Explorer', description: 'Complete the Garden world', icon: '🌸', unlocked: false },
    complete_snow: { name: 'Snow Runner', description: 'Complete the Snow world', icon: '❄️', unlocked: false },
    complete_park: { name: 'Park Champion', description: 'Complete the Park world', icon: '🎢', unlocked: false },
    complete_space: { name: 'Space Conqueror', description: 'Complete the Space world', icon: '🚀', unlocked: false },
    no_damage: { name: 'Untouchable', description: 'Complete a level without getting hit', icon: '✨', unlocked: false },
    score_1000: { name: 'High Scorer', description: 'Score 1000 points', icon: '⭐', unlocked: false },
    score_5000: { name: 'Score Legend', description: 'Score 5000 points', icon: '🌟', unlocked: false },
    daily_complete: { name: 'Daily Warrior', description: 'Complete a daily challenge', icon: '📅', unlocked: false },
    all_skins: { name: 'Fashion Cat', description: 'Unlock all skins', icon: '🎨', unlocked: false },
    boss_defeated: { name: 'Boss Slayer', description: 'Defeat the angry black cat boss', icon: '😼', unlocked: false },
    boss_master: { name: 'Boss Master', description: 'Defeat 3 bosses', icon: '🏰', unlocked: false }
};
let totalTreatsCollected = 0;
let totalBossesDefeated = 0;
let levelDamageTaken = false;
let newAchievements = []; // For showing unlock notifications

// Expression state
let tobyExpression = 'normal'; // 'normal', 'happy', 'sad'
let expressionEndTime = 0;
let floatingTexts = []; // For "Yum yum" text

// Player name and leaderboard
let playerName = 'Player 1';
let leaderboard = [];

// Side scenery (moving objects on the sides)
let sideScenery = [];
let lastSideScenerySpawn = 0;
const SIDE_SCENERY_INTERVAL = 2000; // Spawn every 2 seconds

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
    targetX: CANVAS_WIDTH / 2,
    // Animation state
    runCycle: 0,       // Animation frame counter (0 to 2π)
    bobOffset: 0       // Vertical bobbing offset
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
let playerNameInput, leaderboardList;

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
    playerNameInput = document.getElementById('player-name');
    leaderboardList = document.getElementById('leaderboard-list');

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Mobile touch controls
    setupTouchControls();
    
    // Setup settings controls
    setupSettingsControls();

    // Load saved data from localStorage
    loadLeaderboard();
    loadAchievements();
    loadSkins();
    loadKittyCoins();
    loadSettings();
    displayLeaderboard();

    showScreen('start');
}

// Background Music using Web Audio API
function initAudio() {
    if (audioContext) return;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = audioContext.createGain();
    musicGain.connect(audioContext.destination);
    musicGain.gain.value = 0.25;
}

function playBackgroundMusic() {
    if (!audioContext || musicPlaying) return;
    musicPlaying = true;
    
    // Create smooth, pleasant game music with proper filtering
    const playNote = (freq, startTime, duration, type = 'sine', volume = 0.05) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        // Smooth low-pass filter to remove harshness
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.5;
        
        // Smooth envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
        gain.gain.setValueAtTime(volume * 0.8, startTime + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);
        osc.start(startTime);
        osc.stop(startTime + duration);
    };
    
    // Play a chord (multiple notes together)
    const playChord = (notes, startTime, duration, volume = 0.03) => {
        notes.forEach(note => {
            playNote(note, startTime, duration, 'sine', volume);
        });
    };

    // Pleasant major/minor progressions for each world
    const getWorldMusic = () => {
        if (currentWorld === WORLDS.GARDEN) {
            // Peaceful C major - happy garden vibes
            return {
                chords: [
                    { notes: [262, 330, 392], time: 0, dur: 2.0 },     // C major
                    { notes: [294, 370, 440], time: 2.2, dur: 1.8 },   // D minor  
                    { notes: [262, 330, 392], time: 4.2, dur: 1.8 },   // C major
                    { notes: [247, 311, 370], time: 6.2, dur: 1.8 },   // G major
                ],
                melody: [
                    { note: 523, time: 0.5, dur: 0.4 },
                    { note: 494, time: 1.0, dur: 0.4 },
                    { note: 440, time: 1.5, dur: 0.6 },
                    { note: 392, time: 2.5, dur: 0.8 },
                    { note: 440, time: 4.0, dur: 0.5 },
                    { note: 494, time: 5.0, dur: 0.5 },
                    { note: 523, time: 6.0, dur: 1.0 },
                ],
                bass: [
                    { note: 131, time: 0, dur: 2.0 },
                    { note: 147, time: 2.2, dur: 1.8 },
                    { note: 131, time: 4.2, dur: 1.8 },
                    { note: 98, time: 6.2, dur: 1.8 },
                ]
            };
        } else if (currentWorld === WORLDS.SNOW) {
            // Peaceful, crystalline winter melody
            return {
                chords: [
                    { notes: [220, 277, 330], time: 0, dur: 2.5 },     // A minor
                    { notes: [196, 247, 294], time: 2.7, dur: 2.3 },   // G major
                    { notes: [175, 220, 262], time: 5.2, dur: 2.5 },   // F major
                    { notes: [196, 247, 294], time: 7.9, dur: 2.1 },   // G major
                ],
                melody: [
                    { note: 659, time: 0, dur: 1.0 },
                    { note: 587, time: 1.2, dur: 0.8 },
                    { note: 523, time: 2.2, dur: 1.2 },
                    { note: 494, time: 4.0, dur: 0.8 },
                    { note: 440, time: 5.0, dur: 1.5 },
                    { note: 494, time: 7.0, dur: 0.8 },
                    { note: 523, time: 8.2, dur: 1.5 },
                ],
                bass: [
                    { note: 110, time: 0, dur: 2.5 },
                    { note: 98, time: 2.7, dur: 2.3 },
                    { note: 87, time: 5.2, dur: 2.5 },
                    { note: 98, time: 7.9, dur: 2.1 },
                ]
            };
        } else if (currentWorld === WORLDS.PARK) {
            // Playful, bouncy adventure tune
            return {
                chords: [
                    { notes: [262, 330, 392], time: 0, dur: 1.5 },     // C major
                    { notes: [220, 277, 330], time: 1.7, dur: 1.5 },   // A minor
                    { notes: [175, 220, 262], time: 3.4, dur: 1.5 },   // F major
                    { notes: [196, 247, 294], time: 5.1, dur: 1.5 },   // G major
                ],
                melody: [
                    { note: 392, time: 0, dur: 0.3 },
                    { note: 440, time: 0.4, dur: 0.3 },
                    { note: 494, time: 0.8, dur: 0.5 },
                    { note: 523, time: 1.5, dur: 0.6 },
                    { note: 440, time: 2.5, dur: 0.4 },
                    { note: 392, time: 3.2, dur: 0.6 },
                    { note: 349, time: 4.2, dur: 0.5 },
                    { note: 392, time: 5.0, dur: 0.8 },
                ],
                bass: [
                    { note: 131, time: 0, dur: 1.5 },
                    { note: 110, time: 1.7, dur: 1.5 },
                    { note: 87, time: 3.4, dur: 1.5 },
                    { note: 98, time: 5.1, dur: 1.5 },
                ]
            };
        } else if (currentWorld === WORLDS.SPACE) {
            // Cosmic, dreamy ambient - SLOWER and more relaxed
            return {
                chords: [
                    { notes: [165, 220, 262], time: 0, dur: 3.5 },     // E minor spread
                    { notes: [147, 196, 247], time: 4.0, dur: 3.5 },   // D minor spread
                    { notes: [131, 175, 220], time: 8.0, dur: 3.5 },   // C minor spread
                ],
                melody: [
                    { note: 330, time: 1.0, dur: 1.5 },
                    { note: 294, time: 3.0, dur: 1.5 },
                    { note: 262, time: 5.5, dur: 2.0 },
                    { note: 294, time: 8.5, dur: 1.5 },
                    { note: 330, time: 10.5, dur: 1.5 },
                ],
                bass: [
                    { note: 82, time: 0, dur: 4.0 },
                    { note: 73, time: 4.0, dur: 4.0 },
                    { note: 65, time: 8.0, dur: 4.0 },
                ]
            };
        } else {
            // Castle/Boss - dramatic but not harsh
            return {
                chords: [
                    { notes: [147, 175, 220], time: 0, dur: 2.0 },     // D minor
                    { notes: [131, 165, 196], time: 2.2, dur: 2.0 },   // C minor
                    { notes: [147, 175, 220], time: 4.4, dur: 2.0 },   // D minor
                    { notes: [165, 196, 247], time: 6.6, dur: 2.0 },   // E diminished
                ],
                melody: [
                    { note: 440, time: 0, dur: 0.5 },
                    { note: 392, time: 0.6, dur: 0.5 },
                    { note: 349, time: 1.2, dur: 0.8 },
                    { note: 330, time: 2.5, dur: 0.8 },
                    { note: 349, time: 4.0, dur: 0.5 },
                    { note: 392, time: 5.0, dur: 0.5 },
                    { note: 440, time: 6.0, dur: 1.0 },
                ],
                bass: [
                    { note: 73, time: 0, dur: 2.0 },
                    { note: 65, time: 2.2, dur: 2.0 },
                    { note: 73, time: 4.4, dur: 2.0 },
                    { note: 82, time: 6.6, dur: 2.0 },
                ]
            };
        }
    };

    const loopDuration = currentWorld === WORLDS.SPACE ? 12 : 8;
    
    function scheduleLoop() {
        if (!musicPlaying || gameState !== 'playing') return;
        
        const now = audioContext.currentTime;
        const music = getWorldMusic();
        
        // Play smooth chords
        music.chords.forEach(({ notes, time, dur }) => {
            playChord(notes, now + time, dur, 0.025);
        });
        
        // Play gentle melody
        music.melody.forEach(({ note, time, dur }) => {
            playNote(note, now + time, dur, 'sine', 0.04);
        });
        
        // Play warm bass
        music.bass.forEach(({ note, time, dur }) => {
            playNote(note, now + time, dur, 'triangle', 0.05);
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
    
    // Get player name (default to "Player 1" if empty)
    if (playerNameInput) {
        playerName = playerNameInput.value.trim() || 'Player 1';
    }
    
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
    gamePaused = false;
    
    // Apply difficulty settings
    const diffSettings = DIFFICULTY_SETTINGS[currentDifficulty];
    currentApproachSpeed = INITIAL_APPROACH_SPEED * diffSettings.speedMult;
    spawnInterval = SPAWN_INTERVAL_BASE * diffSettings.spawnMult;
    
    approachingObjects = [];
    sideScenery = [];
    particles = [];
    lastSpawnTime = 0;
    lastSideScenerySpawn = 0;
    tunnelOffset = 0;
    levelCompleted = false;
    levelCompleteTime = 0;
    
    // Reset power-ups
    shieldActive = false;
    shieldEndTime = 0;
    shieldBubblePhase = 0;
    speedBoostActive = false;
    speedBoostEndTime = 0;
    magnetActive = false;
    magnetEndTime = 0;
    doublePointsActive = false;
    doublePointsEndTime = 0;
    
    // Reset combo and expression
    comboCount = 0;
    comboTimer = 0;
    tobyExpression = 'normal';
    expressionEndTime = 0;
    floatingTexts = [];
    newAchievements = [];
    levelDamageTaken = false;
    
    // Reset screen shake
    screenShake = { intensity: 0, duration: 0, startTime: 0 };
    
    // Reset boss state
    isBossLevel = false;
    bossHealth = 100;
    bossMaxHealth = 100;
    punchesCollected = 0;
    thrownPunches = [];
    bossDefeated = false;
    bossDefeatedTime = 0;
    
    // Hide mobile punch button
    const touchPunch = document.getElementById('touch-punch');
    if (touchPunch) touchPunch.classList.remove('visible');

    toby.x = CANVAS_WIDTH / 2;
    toby.targetX = CANVAS_WIDTH / 2;
    toby.direction = 0;

    updateHUD();
    speedIndicator.classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    showScreen('game');
    
    if (musicEnabled) playBackgroundMusic();
    requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    
    // Space bar to throw punch during boss battle
    if (e.key === ' ' && gameState === 'playing' && isBossLevel && !gamePaused) {
        e.preventDefault(); // Prevent page scroll
        throwPunch();
    }
    
    // Pause with Escape or P
    if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && gameState === 'playing') {
        togglePause();
    }
    
    // Mute with M
    if (e.key === 'm' || e.key === 'M') {
        toggleSound();
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
}

// Pause functionality
function togglePause() {
    if (gameState !== 'playing') return;
    
    gamePaused = !gamePaused;
    const pauseOverlay = document.getElementById('pause-overlay');
    
    if (gamePaused) {
        pauseOverlay.classList.remove('hidden');
        if (musicEnabled) stopBackgroundMusic();
    } else {
        pauseOverlay.classList.add('hidden');
        if (musicEnabled) playBackgroundMusic();
        requestAnimationFrame(gameLoop);
    }
}

function stopBackgroundMusic() {
    musicPlaying = false;
}

// Sound toggle
function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    saveSettings();
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    if (!musicEnabled) {
        stopBackgroundMusic();
    } else if (gameState === 'playing' && !gamePaused) {
        playBackgroundMusic();
    }
    updateMusicButton();
    saveSettings();
}

function updateSoundButton() {
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
}

function updateMusicButton() {
    const btn = document.getElementById('music-toggle');
    if (btn) btn.textContent = musicEnabled ? '🎵' : '🔕';
}

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;
let touchActive = false;
let lastTapTime = 0; // For double-tap detection (boss punch)

function setupTouchControls() {
    const gameCanvas = document.getElementById('game-canvas');
    
    // Prevent default touch behaviors to avoid scrolling
    gameCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Also handle clicks/taps for left/right movement
    gameCanvas.addEventListener('click', handleCanvasClick);
    
    // On-screen button controls
    const touchLeft = document.getElementById('touch-left');
    const touchRight = document.getElementById('touch-right');
    
    if (touchLeft && touchRight) {
        // Left button
        touchLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys.left = true;
            keys.right = false;
        }, { passive: false });
        touchLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys.left = false;
        }, { passive: false });
        touchLeft.addEventListener('mousedown', () => {
            keys.left = true;
            keys.right = false;
        });
        touchLeft.addEventListener('mouseup', () => {
            keys.left = false;
        });
        touchLeft.addEventListener('mouseleave', () => {
            keys.left = false;
        });
        
        // Right button
        touchRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys.right = true;
            keys.left = false;
        }, { passive: false });
        touchRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys.right = false;
        }, { passive: false });
        touchRight.addEventListener('mousedown', () => {
            keys.right = true;
            keys.left = false;
        });
        touchRight.addEventListener('mouseup', () => {
            keys.right = false;
        });
        touchRight.addEventListener('mouseleave', () => {
            keys.right = false;
        });
    }
    
    // Punch button for mobile boss battles
    const touchPunch = document.getElementById('touch-punch');
    if (touchPunch) {
        touchPunch.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (isBossLevel && gameState === 'playing' && !gamePaused) {
                throwPunch();
            }
        }, { passive: false });
        touchPunch.addEventListener('click', () => {
            if (isBossLevel && gameState === 'playing' && !gamePaused) {
                throwPunch();
            }
        });
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    if (gameState !== 'playing') return;
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
    
    // Double tap detection for throwing punches during boss battle
    const now = Date.now();
    if (isBossLevel && now - lastTapTime < 300) {
        throwPunch();
        lastTapTime = 0;
        return;
    }
    lastTapTime = now;
    
    // Immediate tap response - move based on which side was tapped
    const rect = canvas.getBoundingClientRect();
    const tapX = touch.clientX - rect.left;
    const centerX = canvas.width / 2;
    
    if (tapX < centerX) {
        keys.left = true;
        keys.right = false;
    } else {
        keys.right = true;
        keys.left = false;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchActive || gameState !== 'playing') return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    
    // Swipe threshold for smoother control
    const threshold = 10;
    
    if (deltaX < -threshold) {
        keys.left = true;
        keys.right = false;
    } else if (deltaX > threshold) {
        keys.right = true;
        keys.left = false;
    } else {
        // Small movement, keep previous direction
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    touchActive = false;
    keys.left = false;
    keys.right = false;
}

function handleCanvasClick(e) {
    // For desktop click support too
    if (gameState !== 'playing') return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = canvas.width / 2;
    
    // Brief movement in clicked direction
    if (clickX < centerX) {
        keys.left = true;
        keys.right = false;
    } else {
        keys.right = true;
        keys.left = false;
    }
    
    // Stop movement after brief period
    setTimeout(() => {
        keys.left = false;
        keys.right = false;
    }, 150);
}

function gameLoop(timestamp) {
    if (gameState !== 'playing') return;
    if (gamePaused) return;
    update(timestamp);
    render();
    requestAnimationFrame(gameLoop);
}

function update(timestamp) {
    // Update play time
    playTime = Date.now() - gameStartTime;
    
    // Update Toby's running animation
    const animSpeed = 0.25; // Animation speed
    toby.runCycle += animSpeed;
    if (toby.runCycle > Math.PI * 2) toby.runCycle -= Math.PI * 2;
    toby.bobOffset = Math.sin(toby.runCycle * 2) * 3; // Body bobbing
    
    // Check expression expiration
    if (tobyExpression !== 'normal' && Date.now() > expressionEndTime) {
        tobyExpression = 'normal';
    }
    
    // Update floating texts (remove old ones)
    floatingTexts = floatingTexts.filter(ft => Date.now() - ft.startTime < 1000);
    
    // Update particles
    updateParticles();
    
    // Update screen shake
    if (screenShake.intensity > 0 && Date.now() - screenShake.startTime > screenShake.duration) {
        screenShake.intensity = 0;
    }
    
    // Check combo expiration
    if (comboCount > 0 && Date.now() > comboTimer) {
        comboCount = 0;
    }
    
    // Check shield expiration
    if (shieldActive && Date.now() > shieldEndTime) {
        shieldActive = false;
        if (soundEnabled) playShieldPopSound();
    }
    
    // Check speed boost expiration
    if (speedBoostActive && Date.now() > speedBoostEndTime) {
        speedBoostActive = false;
        addFloatingText('Speed Normal!', '#FFD700', toby.x, toby.y - 50);
    }
    
    // Check magnet expiration
    if (magnetActive && Date.now() > magnetEndTime) {
        magnetActive = false;
        addFloatingText('Magnet Off!', '#FF4444', toby.x, toby.y - 50);
    }
    
    // Check double points expiration
    if (doublePointsActive && Date.now() > doublePointsEndTime) {
        doublePointsActive = false;
        addFloatingText('Normal Points!', '#FF69B4', toby.x, toby.y - 50);
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
    
    // Boss battle logic
    if (isBossLevel) {
        updateBossBattle();
        
        // During boss battle, still update Toby movement and collisions
        // but skip normal level progress
        const currentTobySpeed = speedBoostActive ? toby.speed * 1.5 : toby.speed;
        if (keys.left) {
            toby.x -= currentTobySpeed;
            toby.direction = -1;
        } else if (keys.right) {
            toby.x += currentTobySpeed;
            toby.direction = 1;
        } else {
            toby.direction = 0;
        }
        
        // Keep Toby in bounds
        const minX = 80;
        const maxX = CANVAS_WIDTH - 80;
        toby.x = Math.max(minX, Math.min(maxX, toby.x));
        
        // Update approaching objects (boss hazards)
        const diffSettings = DIFFICULTY_SETTINGS[currentDifficulty];
        approachingObjects.forEach(obj => {
            if (!obj.collected) {
                obj.z += currentApproachSpeed;
                obj.rotation += obj.rotationSpeed;
            }
        });
        
        // Check collisions with boss hazards
        for (let i = approachingObjects.length - 1; i >= 0; i--) {
            const obj = approachingObjects[i];
            if (obj.z >= 0.85 && obj.z <= 1.0 && !obj.collected) {
                const objScreenX = getScreenX(obj.laneX, obj.z);
                const objSize = getObjectSize(obj.z);
                
                if (Math.abs(objScreenX - toby.x) < (objSize / 2 + TOBY_WIDTH / 3)) {
                    handleCollision(obj);
                    obj.collected = true;
                }
            }
        }
        
        // Remove objects that passed the player
        approachingObjects = approachingObjects.filter(obj => obj.z < 1.2 || obj.collected);
        
        // Energy still decays during boss battle
        energy -= ENERGY_DECAY_RATE * diffSettings.energyDecayMult * 0.5; // Half decay rate
        energy = Math.max(0, energy);
        
        if (energy <= 0) {
            gameOver();
            return;
        }
        
        updateHUD();
        return;
    }
    
    // Update level progress
    const elapsed = Date.now() - levelStartTime;
    levelProgress = elapsed / LEVEL_DURATION;
    
    // Apply difficulty modifier
    const diffSettings = DIFFICULTY_SETTINGS[currentDifficulty];

    if (levelProgress >= SPEED_UP_THRESHOLD && !isSpeedUp) {
        isSpeedUp = true;
        speedIndicator.classList.remove('hidden');
        currentApproachSpeed = (INITIAL_APPROACH_SPEED + (level * 0.002) + 0.004) * diffSettings.speedMult;
        spawnInterval = Math.max(600, (SPAWN_INTERVAL_BASE - (level * 50) - 100) * diffSettings.spawnMult);
    }

    // Level complete!
    if (levelProgress >= 1) {
        levelCompleted = true;
        levelCompleteTime = Date.now();
        if (soundEnabled) playLevelCompleteSound();
        
        // Check no-damage achievement
        if (!levelDamageTaken) {
            unlockAchievement('no_damage');
        }
        levelDamageTaken = false;
        return;
    }
    
    // Apply speed boost to Toby's movement
    const currentTobySpeed = speedBoostActive ? toby.speed * 1.5 : toby.speed;

    // Update Toby position (smooth movement)
    if (keys.left) {
        toby.x -= currentTobySpeed;
        toby.direction = -1;
    } else if (keys.right) {
        toby.x += currentTobySpeed;
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
    
    // Spawn side scenery
    if (timestamp - lastSideScenerySpawn > SIDE_SCENERY_INTERVAL) {
        spawnSideScenery();
        lastSideScenerySpawn = timestamp;
    }
    
    // Apply magnet effect - attract treats towards Toby
    if (magnetActive) {
        approachingObjects.forEach(obj => {
            if (obj.objectType.type === 'treat' && obj.depth > 0.6) {
                // Attract towards Toby
                const targetX = toby.x;
                const dx = targetX - obj.x;
                obj.x += dx * 0.03; // Gradual attraction
            }
        });
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
    
    // Update side scenery (moves toward player like objects)
    for (let i = sideScenery.length - 1; i >= 0; i--) {
        const scenery = sideScenery[i];
        scenery.z += currentApproachSpeed * 0.8; // Slightly slower than main objects
        
        // Remove scenery that passed the player
        if (scenery.z > 1.2) {
            sideScenery.splice(i, 1);
        }
    }

    // Update tunnel animation
    tunnelOffset = (tunnelOffset + currentApproachSpeed * 50) % 50;

    // Apply difficulty-based energy decay (diffSettings already defined above)
    energy -= ENERGY_DECAY_RATE * diffSettings.energyDecayMult;
    energy = Math.max(0, energy);

    if (energy <= 0) {
        gameOver();
        return;
    }

    updateHUD();
}

function advanceLevel() {
    // Award Kitty Coins for completing the level!
    earnKittyCoins(COINS_PER_LEVEL);
    addFloatingText(`+${COINS_PER_LEVEL} 🪙`, '#FFD700', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    level++;
    levelProgress = 0;
    levelStartTime = Date.now();
    isSpeedUp = false;
    speedIndicator.classList.add('hidden');
    
    // Apply difficulty settings
    const diffSettings = DIFFICULTY_SETTINGS[currentDifficulty];
    currentApproachSpeed = (INITIAL_APPROACH_SPEED + (level * 0.001)) * diffSettings.speedMult;
    spawnInterval = Math.max(900, (SPAWN_INTERVAL_BASE - (level * 30)) * diffSettings.spawnMult);
    
    energy = 100; // Reset energy to full at start of each level!
    levelDamageTaken = false;
    approachingObjects = []; // Clear objects for new level
    sideScenery = []; // Clear side scenery for new level
    
    // Check world completion achievements
    checkWorldAchievements();
    
    // Check for daily challenge completion
    if (dailyChallengeActive && level > 8) {
        endDailyChallenge();
    }
    
    // Check if this is a BOSS LEVEL!
    if (level % BOSS_LEVEL_INTERVAL === 0) {
        startBossBattle();
        return;
    }
    
    // Reset boss state for normal levels
    isBossLevel = false;
    
    // Change world every LEVELS_PER_WORLD levels
    const worldIndex = Math.floor((level - 1) / LEVELS_PER_WORLD) % 4;
    if (worldIndex === 0) {
        currentWorld = WORLDS.GARDEN;
    } else if (worldIndex === 1) {
        currentWorld = WORLDS.SNOW;
    } else if (worldIndex === 2) {
        currentWorld = WORLDS.PARK;
    } else {
        currentWorld = WORLDS.SPACE;
    }
    
    updateHUD();
}

// ============== BOSS BATTLE SYSTEM ==============

function startBossBattle() {
    isBossLevel = true;
    currentWorld = WORLDS.CASTLE;
    bossBattleStartTime = Date.now();
    
    // Determine which boss based on boss number (cycles through 4 bosses)
    const bossNumber = level / BOSS_LEVEL_INTERVAL;
    currentBossType = (bossNumber - 1) % 4; // 0=Dave, 1=Hoover, 2=Cucumber, 3=Dougie
    
    // Boss health scales with level and boss type
    // Dougie (final boss) is tougher
    const baseHealth = currentBossType === 3 ? 75 : 50;
    bossMaxHealth = baseHealth + (bossNumber * 25);
    bossHealth = bossMaxHealth;
    
    // Boss position
    bossX = CANVAS_WIDTH / 2;
    bossY = HORIZON_Y + 80;
    bossDirection = 1;
    bossDefeated = false;
    bossDefeatedTime = 0;
    bossHitTime = 0;
    bossShieldSpawned = false; // Reset shield spawn flag for new boss
    
    // Clear any existing objects
    approachingObjects = [];
    sideScenery = [];
    thrownPunches = [];
    
    // Give minimum punches if player has few - increased to 10 for better gameplay
    if (punchesCollected < 10) {
        punchesCollected = 10;
        addFloatingText('Bonus ammo!', '#FF6B35', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
    
    // Show boss indicator (will auto-hide after 3 seconds)
    const bossIndicator = document.getElementById('boss-indicator');
    if (bossIndicator) {
        bossIndicator.classList.remove('hidden');
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (isBossLevel && !bossDefeated) {
                bossIndicator.classList.add('hidden');
            }
        }, 3000);
    }
    
    // Show mobile punch button
    const touchPunch = document.getElementById('touch-punch');
    if (touchPunch) touchPunch.classList.add('visible');
    
    if (soundEnabled) playBossMusic();
    updateHUD();
}

function updateBossBattle() {
    if (!isBossLevel || bossDefeated) return;
    
    // Boss movement (side to side)
    const bossSpeed = 2 + (level / BOSS_LEVEL_INTERVAL);
    bossX += bossDirection * bossSpeed;
    
    // Bounce off walls
    if (bossX > CANVAS_WIDTH - 100) {
        bossX = CANVAS_WIDTH - 100;
        bossDirection = -1;
    } else if (bossX < 100) {
        bossX = 100;
        bossDirection = 1;
    }
    
    // Update thrown punches
    for (let i = thrownPunches.length - 1; i >= 0; i--) {
        const punch = thrownPunches[i];
        punch.y -= 8; // Move up towards boss
        punch.x += punch.vx; // Slight horizontal movement
        
        // Check collision with boss
        const dx = punch.x - bossX;
        const dy = punch.y - bossY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 60) {
            // Hit the boss!
            bossHealth -= 10;
            bossHitTime = Date.now();
            thrownPunches.splice(i, 1);
            
            if (soundEnabled) playBossHitSound();
            spawnParticles(bossX, bossY, '#FF0000', 20);
            
            // Spawn a shield at 50% health to help block hair dryers
            if (!bossShieldSpawned && bossHealth <= bossMaxHealth * 0.5) {
                spawnBossShield();
                bossShieldSpawned = true;
            }
            
            // Check if boss defeated
            if (bossHealth <= 0) {
                defeatBoss();
            }
            continue;
        }
        
        // Remove punches that go off screen
        if (punch.y < 0) {
            thrownPunches.splice(i, 1);
        }
    }
    
    // Boss attacks - occasionally spawn hazards
    if (Math.random() < 0.02) {
        spawnBossHazard();
    }
    
    // Occasionally spawn punch power-ups so player can collect more ammo
    if (Math.random() < 0.015) {
        spawnBossPunch();
    }
}

function spawnBossHazard() {
    // Boss throws hairdryers at Toby!
    const obj = {
        laneX: (Math.random() - 0.5) * 1.6,
        z: 0,
        ...OBJECT_TYPES.HAIRDRYER,
        objectType: OBJECT_TYPES.HAIRDRYER,
        collected: false,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.2
    };
    approachingObjects.push(obj);
}

function spawnBossPunch() {
    // Spawn punch power-ups during boss battle for extra ammo!
    const obj = {
        laneX: (Math.random() - 0.5) * 1.6,
        z: 0,
        ...OBJECT_TYPES.PUNCH,
        objectType: OBJECT_TYPES.PUNCH,
        collected: false,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    };
    approachingObjects.push(obj);
}

function spawnBossShield() {
    // Spawn a single shield at 50% boss health to help player block hair dryers
    const obj = {
        laneX: 0, // Spawn in center for visibility
        z: 0,
        ...OBJECT_TYPES.SHIELD,
        objectType: OBJECT_TYPES.SHIELD,
        collected: false,
        rotation: 0,
        rotationSpeed: 0.05
    };
    approachingObjects.push(obj);
    addFloatingText('🛡️ Shield incoming!', '#00BFFF', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
}

function throwPunch() {
    if (!isBossLevel || punchesCollected <= 0 || bossDefeated) return;
    
    punchesCollected--;
    
    // Create punch projectile
    thrownPunches.push({
        x: toby.x,
        y: toby.y - 40,
        vx: (Math.random() - 0.5) * 2 // Slight random horizontal movement
    });
    
    if (soundEnabled) playPunchSound();
    updateHUD();
}

function defeatBoss() {
    bossDefeated = true;
    bossDefeatedTime = Date.now();
    
    // Track bosses defeated
    totalBossesDefeated++;
    
    // Big score bonus for defeating boss!
    const bossBonus = 500 * (level / BOSS_LEVEL_INTERVAL);
    score += bossBonus;
    
    // Big Kitty Coins bonus for defeating boss!
    earnKittyCoins(COINS_PER_BOSS);
    
    if (soundEnabled) playBossDefeatedSound();
    spawnParticles(bossX, bossY, '#FFD700', 50);
    spawnParticles(bossX, bossY, '#FF6B35', 30);
    
    addFloatingText(`BOSS DEFEATED! +${bossBonus}`, '#FFD700', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    addFloatingText(`+${COINS_PER_BOSS} 🪙`, '#FFD700', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    
    // Unlock boss defeat achievements
    unlockAchievement('boss_defeated');
    if (totalBossesDefeated >= 3) {
        unlockAchievement('boss_master');
    }
    
    // Hide boss indicator
    const bossIndicator = document.getElementById('boss-indicator');
    if (bossIndicator) bossIndicator.classList.add('hidden');
    
    // Hide mobile punch button
    const touchPunch = document.getElementById('touch-punch');
    if (touchPunch) touchPunch.classList.remove('visible');
    
    // After celebration, continue to next level
    setTimeout(() => {
        isBossLevel = false;
        levelCompleted = true;
        levelCompleteTime = Date.now();
    }, 2000);
}

function playBossMusic() {
    // Intense boss battle music would play here
    // For now, just a warning sound
    if (!audioContext) return;
    
    const notes = [196, 233, 262, 294]; // G3, Bb3, C4, D4 - ominous
    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.2 + 0.3);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(audioContext.currentTime + i * 0.2);
        osc.stop(audioContext.currentTime + i * 0.2 + 0.3);
    });
}

function playBossHitSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
}

function playPunchSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
}

function playBossDefeatedSound() {
    if (!audioContext) return;
    // Victory fanfare!
    const notes = [523, 659, 784, 880, 1047]; // C5, E5, G5, A5, C6
    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.12 + 0.5);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(audioContext.currentTime + i * 0.12);
        osc.stop(audioContext.currentTime + i * 0.12 + 0.5);
    });
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
    // Don't spawn normal objects during boss battle
    if (isBossLevel) return;
    
    // Get random value, use seeded random for daily challenge
    const rand = dailyChallengeActive ? seededRandom() : Math.random();
    
    const objectKeys = Object.keys(OBJECT_TYPES).filter(k => 
        k !== 'SHIELD' && k !== 'SPEED_BOOST' && k !== 'MAGNET' && k !== 'DOUBLE_POINTS' && k !== 'PUNCH'
    );
    
    let weights;
    if (levelProgress < 0.3) {
        weights = { treat: 0.7, bad: 0.3 };
    } else if (levelProgress < 0.6) {
        weights = { treat: 0.5, bad: 0.5 };
    } else {
        weights = { treat: 0.4, bad: 0.6 };
    }

    // Small chance to spawn power-ups
    const powerUpRand = dailyChallengeActive ? seededRandom() : Math.random();
    
    // 5% chance for shield
    if (powerUpRand < 0.05 && !shieldActive) {
        spawnPowerUp(OBJECT_TYPES.SHIELD);
        return;
    }
    // 3% chance for speed boost
    if (powerUpRand >= 0.05 && powerUpRand < 0.08 && !speedBoostActive) {
        spawnPowerUp(OBJECT_TYPES.SPEED_BOOST);
        return;
    }
    // 3% chance for magnet
    if (powerUpRand >= 0.08 && powerUpRand < 0.11 && !magnetActive) {
        spawnPowerUp(OBJECT_TYPES.MAGNET);
        return;
    }
    // 3% chance for double points
    if (powerUpRand >= 0.11 && powerUpRand < 0.14 && !doublePointsActive) {
        spawnPowerUp(OBJECT_TYPES.DOUBLE_POINTS);
        return;
    }
    // 4% chance for punch (boss ammo) - appears more often as you approach boss level
    const nextBossLevel = Math.ceil(level / BOSS_LEVEL_INTERVAL) * BOSS_LEVEL_INTERVAL;
    const levelsUntilBoss = nextBossLevel - level;
    const punchChance = levelsUntilBoss <= 3 ? 0.08 : 0.04; // More punches close to boss
    if (powerUpRand >= 0.14 && powerUpRand < 0.14 + punchChance) {
        spawnPowerUp(OBJECT_TYPES.PUNCH);
        return;
    }

    let selectedKey;
    if (rand < weights.treat) {
        const treats = objectKeys.filter(k => OBJECT_TYPES[k].type === 'treat');
        selectedKey = treats[Math.floor((dailyChallengeActive ? seededRandom() : Math.random()) * treats.length)];
    } else {
        const bads = objectKeys.filter(k => OBJECT_TYPES[k].type === 'bad');
        selectedKey = bads[Math.floor((dailyChallengeActive ? seededRandom() : Math.random()) * bads.length)];
    }

    const objectType = OBJECT_TYPES[selectedKey];

    // Lane position (-1 to 1, where 0 is center)
    const laneX = ((dailyChallengeActive ? seededRandom() : Math.random()) - 0.5) * 1.6;

    const obj = {
        laneX: laneX,
        z: 0, // 0 = far away, 1 = at player
        ...objectType,
        objectType: objectType,
        collected: false,
        rotation: 0,
        rotationSpeed: ((dailyChallengeActive ? seededRandom() : Math.random()) - 0.5) * 0.1
    };

    approachingObjects.push(obj);
}

function spawnPowerUp(objectType) {
    const laneX = (Math.random() - 0.5) * 1.6;
    const obj = {
        laneX: laneX,
        z: 0,
        ...objectType,
        objectType: objectType,
        collected: false,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    };
    approachingObjects.push(obj);
}

// Seeded random for daily challenge (same patterns each day)
let dailySeed = 0;
function seededRandom() {
    dailySeed = (dailySeed * 9301 + 49297) % 233280;
    return dailySeed / 233280;
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
    // Calculate points with double points modifier
    const pointMultiplier = doublePointsActive ? 2 : 1;
    
    if (obj.type === 'shield') {
        shieldActive = true;
        shieldEndTime = Date.now() + SHIELD_DURATION;
        shieldBubblePhase = 0;
        score += obj.points * level * pointMultiplier;
        if (soundEnabled) {
            playShieldCollectSound();
            playYeySound();
        }
        // Spawn sparkle particles
        spawnParticles(toby.x, toby.y, '#00BFFF', 15);
        // Happy expression for shield too
        tobyExpression = 'happy';
        expressionEndTime = Date.now() + 1000;
        addFloatingText('Yey!', '#00BFFF', toby.x, toby.y - 60);
        
    } else if (obj.type === 'speedboost') {
        speedBoostActive = true;
        speedBoostEndTime = Date.now() + 5000; // 5 second boost
        score += obj.points * level * pointMultiplier;
        if (soundEnabled) {
            playPowerUpSound();
            playYeySound();
        }
        spawnParticles(toby.x, toby.y, '#FFD700', 20);
        tobyExpression = 'happy';
        expressionEndTime = Date.now() + 1000;
        addFloatingText('Speed Boost!', '#FFD700', toby.x, toby.y - 60);
        
    } else if (obj.type === 'magnet') {
        magnetActive = true;
        magnetEndTime = Date.now() + 8000; // 8 second magnet
        score += obj.points * level * pointMultiplier;
        if (soundEnabled) {
            playPowerUpSound();
            playYeySound();
        }
        spawnParticles(toby.x, toby.y, '#FF4444', 20);
        tobyExpression = 'happy';
        expressionEndTime = Date.now() + 1000;
        addFloatingText('Magnet!', '#FF4444', toby.x, toby.y - 60);
        
    } else if (obj.type === 'doublepoints') {
        doublePointsActive = true;
        doublePointsEndTime = Date.now() + 10000; // 10 second double points
        score += obj.points * level * 2; // Apply double immediately
        if (soundEnabled) {
            playPowerUpSound();
            playYeySound();
        }
        spawnParticles(toby.x, toby.y, '#FF69B4', 20);
        tobyExpression = 'happy';
        expressionEndTime = Date.now() + 1000;
        addFloatingText('Double Points!', '#FF69B4', toby.x, toby.y - 60);
        
    } else if (obj.type === 'punch') {
        // Collect punch ammo for boss battle!
        punchesCollected++;
        score += obj.points * level * pointMultiplier;
        if (soundEnabled) {
            playPowerUpSound();
            playYeySound();
        }
        spawnParticles(toby.x, toby.y, '#FF6B35', 15);
        tobyExpression = 'happy';
        expressionEndTime = Date.now() + 1000;
        addFloatingText(`👊 x${punchesCollected}`, '#FF6B35', toby.x, toby.y - 60);
        
    } else if (obj.type === 'treat') {
        // Combo system
        comboCount++;
        comboTimer = Date.now() + COMBO_TIMEOUT;
        
        // Calculate combo bonus
        const comboBonus = Math.floor(comboCount / 2);
        const totalPoints = (obj.points + comboBonus) * level * pointMultiplier;
        score += totalPoints;
        energy = Math.min(100, energy + ENERGY_GAIN);
        
        // Track total treats for achievements
        totalTreatsCollected++;
        checkTreatAchievements();
        
        // Earn Kitty Coins!
        earnKittyCoins(COINS_PER_TREAT);
        
        if (soundEnabled) {
            playCollectSound();
            playYeySound();
        }
        
        // Spawn sparkle particles
        spawnParticles(toby.x, toby.y, '#FFD700', 10);
        
        // Happy expression!
        tobyExpression = 'happy';
        expressionEndTime = Date.now() + 1000;
        
        // Show combo text if active
        if (comboCount > 1) {
            addFloatingText(`${comboCount}x Combo!`, '#FF6B00', toby.x, toby.y - 80);
            // Check combo achievements
            if (comboCount >= 5) unlockAchievement('combo_5');
            if (comboCount >= 10) unlockAchievement('combo_10');
        }
        addFloatingText('Yum yum!', '#FFD700', toby.x, toby.y - 60);
        
    } else {
        // Bad item - but shield protects!
        if (shieldActive) {
            // Shield absorbs the hit
            if (soundEnabled) playCollectSound();
            spawnParticles(toby.x, toby.y, '#00BFFF', 8);
            addFloatingText('Blocked!', '#00BFFF', toby.x, toby.y - 60);
        } else {
            // Reset combo on hit
            comboCount = 0;
            levelDamageTaken = true;
            
            score = Math.max(0, score + obj.points);
            energy = Math.max(0, energy - ENERGY_LOSS);
            
            if (soundEnabled) {
                playHitSound();
                playOwwSound();
            }
            
            // Screen shake!
            triggerScreenShake(8, 200);
            
            // Spawn splash particles for puddle, spark particles for hairdryer
            const particleColor = obj.objectType === OBJECT_TYPES.PUDDLE ? '#87CEEB' : '#FF6B00';
            spawnParticles(toby.x, toby.y, particleColor, 15);
            
            // Sad expression!
            tobyExpression = 'sad';
            expressionEndTime = Date.now() + 1500;
            addFloatingText('Oww!', '#FF4444', toby.x, toby.y - 60);
        }
    }
    
    // Check score achievements
    if (score >= 1000) unlockAchievement('score_1000');
    if (score >= 5000) unlockAchievement('score_5000');
}

// Helper function to add floating text
function addFloatingText(text, color, x, y) {
    floatingTexts.push({ text, x, y, startTime: Date.now(), color, duration: 1000 });
}

// Particle system functions
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            color: color,
            size: 3 + Math.random() * 4,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.life -= p.decay;
        p.size *= 0.97;
        
        if (p.life <= 0 || p.size < 0.5) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Screen shake
function triggerScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
    screenShake.startTime = Date.now();
}

function getShakeOffset() {
    if (screenShake.intensity <= 0) return { x: 0, y: 0 };
    const elapsed = Date.now() - screenShake.startTime;
    const progress = elapsed / screenShake.duration;
    const currentIntensity = screenShake.intensity * (1 - progress);
    return {
        x: (Math.random() - 0.5) * currentIntensity * 2,
        y: (Math.random() - 0.5) * currentIntensity * 2
    };
}

// Power-up sound
function playPowerUpSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1047, audioContext.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(1568, audioContext.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
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

// Voice sound for "Yey!" when eating good things
function playYeySound() {
    if (!audioContext) return;
    
    // Create a cheerful "Yey!" sound using frequency modulation
    const carrier = audioContext.createOscillator();
    const modulator = audioContext.createOscillator();
    const modGain = audioContext.createGain();
    const gain = audioContext.createGain();
    
    // "Y" sound - rising tone
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(400, audioContext.currentTime);
    carrier.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
    // "ey" sound - sustain high
    carrier.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
    carrier.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
    
    // Add vibrato for voice-like quality
    modulator.type = 'sine';
    modulator.frequency.value = 30;
    modGain.gain.value = 20;
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    gain.gain.setValueAtTime(0.25, audioContext.currentTime);
    gain.gain.setValueAtTime(0.25, audioContext.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
    
    carrier.connect(gain);
    gain.connect(audioContext.destination);
    
    carrier.start();
    modulator.start();
    carrier.stop(audioContext.currentTime + 0.35);
    modulator.stop(audioContext.currentTime + 0.35);
}

// Voice sound for "Oww!" when hitting bad things - pain sound
function playOwwSound() {
    if (!audioContext) return;
    
    // Create a pained "Oww!" sound
    const carrier = audioContext.createOscillator();
    const modulator = audioContext.createOscillator();
    const modGain = audioContext.createGain();
    const gain = audioContext.createGain();
    
    // "O" sound - starts mid-high
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(500, audioContext.currentTime);
    // "ww" sound - drops down like pain
    carrier.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
    carrier.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
    carrier.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.35);
    
    // Add slight wobble for pain effect
    modulator.type = 'sine';
    modulator.frequency.value = 8;
    modGain.gain.value = 15;
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.setValueAtTime(0.25, audioContext.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    carrier.connect(gain);
    gain.connect(audioContext.destination);
    
    carrier.start();
    modulator.start();
    carrier.stop(audioContext.currentTime + 0.4);
    modulator.stop(audioContext.currentTime + 0.4);
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
    
    // Update punch counter if it exists
    const punchCounter = document.getElementById('punch-counter');
    if (punchCounter) {
        punchCounter.textContent = `👊 x${punchesCollected}`;
        punchCounter.style.display = punchesCollected > 0 || isBossLevel ? 'block' : 'none';
    }
}

function gameOver() {
    gameState = 'gameover';
    stopMusic();
    finalScore.textContent = score;
    finalLevel.textContent = level;
    finalTime.textContent = formatTime(playTime);
    
    // Save score to leaderboard
    saveScore(playerName, score, level);
    
    showScreen('gameover');
}

// ============== LEADERBOARD FUNCTIONS (Firebase + Local) ==============

// Check if Firebase is available
function isFirebaseAvailable() {
    return typeof firebaseDB !== 'undefined' && firebaseDB !== null;
}

function loadLeaderboard() {
    // Load local leaderboard first
    try {
        const saved = localStorage.getItem('tobyTrekLeaderboard');
        if (saved) {
            leaderboard = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading local leaderboard:', e);
        leaderboard = [];
    }
    
    // Then try to load from Firebase
    if (isFirebaseAvailable()) {
        loadFirebaseLeaderboard();
    } else {
        displayLeaderboard();
    }
}

function loadFirebaseLeaderboard() {
    if (!isFirebaseAvailable()) return;
    
    try {
        const scoresRef = firebaseDB.ref('leaderboard');
        
        // Listen for real-time updates!
        scoresRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
            const firebaseScores = [];
            snapshot.forEach((child) => {
                firebaseScores.push(child.val());
            });
            
            // Reverse to get highest first
            firebaseScores.reverse();
            
            // Merge with local scores, remove duplicates
            mergeLeaderboards(firebaseScores);
            displayLeaderboard();
        });
        
        console.log('Firebase leaderboard connected - real-time updates enabled!');
    } catch (e) {
        console.error('Error loading Firebase leaderboard:', e);
        displayLeaderboard();
    }
}

function mergeLeaderboards(firebaseScores) {
    // Combine Firebase and local scores
    const combined = [...firebaseScores];
    
    // Add local scores that aren't in Firebase
    leaderboard.forEach(localScore => {
        const isDuplicate = combined.some(fbScore => 
            fbScore.name === localScore.name && 
            fbScore.score === localScore.score &&
            fbScore.level === localScore.level
        );
        if (!isDuplicate) {
            combined.push(localScore);
        }
    });
    
    // Sort by score (highest first) and keep top 10
    combined.sort((a, b) => b.score - a.score);
    leaderboard = combined.slice(0, 10);
}

function saveLeaderboard() {
    try {
        localStorage.setItem('tobyTrekLeaderboard', JSON.stringify(leaderboard));
    } catch (e) {
        console.error('Error saving leaderboard:', e);
    }
}

function saveScore(name, score, level) {
    const entry = {
        name: name,
        score: score,
        level: level,
        date: new Date().toISOString()
    };
    
    // Save to local storage
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    saveLeaderboard();
    
    // Save to Firebase if available
    if (isFirebaseAvailable()) {
        saveToFirebase(entry);
    }
    
    displayLeaderboard();
}

function saveToFirebase(entry) {
    if (!isFirebaseAvailable()) {
        return;
    }
    
    try {
        const scoresRef = firebaseDB.ref('leaderboard');
        
        // Push the new score
        scoresRef.push(entry)
            .then(() => {
                // Clean up old scores (keep only top 50 globally)
                scoresRef.orderByChild('score').limitToFirst(1).once('value', (snapshot) => {
                    // Firebase will handle the real-time update
                });
            })
            .catch((error) => {
                console.error('Error saving to Firebase:', error);
            });
    } catch (e) {
        console.error('Exception in saveToFirebase:', e);
    }
}

function displayLeaderboard() {
    if (!leaderboardList) return;
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p class="no-scores">No scores yet - be the first!</p>';
        return;
    }
    
    const firebaseStatus = isFirebaseAvailable() ? 
        '<div class="firebase-status online">🌐 Global Leaderboard</div>' : 
        '<div class="firebase-status offline">💾 Local Scores</div>';
    
    leaderboardList.innerHTML = firebaseStatus + leaderboard.map((entry, index) => `
        <div class="leaderboard-entry ${index === 0 ? 'first' : ''}">
            <span class="rank">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1) + '.'}</span>
            <span class="name">${escapeHtml(entry.name)}</span>
            <span class="score">${entry.score}</span>
        </div>
    `).join('');
}

// Prevent XSS in player names
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function render() {
    // Apply screen shake
    const shake = getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    
    ctx.clearRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20);

    // Draw tunnel background based on current world
    if (currentWorld === WORLDS.CASTLE) {
        drawCastleTunnel();
    } else if (currentWorld === WORLDS.GARDEN) {
        drawGardenTunnel();
    } else if (currentWorld === WORLDS.PARK) {
        drawParkTunnel();
    } else if (currentWorld === WORLDS.SPACE) {
        drawSpaceTunnel();
    } else {
        drawSnowTunnel();
    }
    
    // Draw side scenery (snowmen, grit bins, benches, etc.)
    drawSideScenery();

    // Draw approaching objects (sorted by depth - far objects first)
    approachingObjects
        .filter(obj => !obj.collected)
        .sort((a, b) => a.z - b.z)
        .forEach(obj => drawApproachingObject(obj));

    // Draw Toby
    drawToby();
    
    // Draw particles
    drawParticles();
    
    // Draw floating texts (Yum yum!, Ouch!, etc.)
    drawFloatingTexts();
    
    // Draw shield bubble around Toby if active
    if (shieldActive) {
        drawShieldBubble();
    }
    
    // Draw power-up indicators
    drawPowerUpIndicators();
    
    // Draw combo indicator
    if (comboCount > 1) {
        ctx.fillStyle = '#FF6B00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(`🔥 ${comboCount}x Combo`, 15, 120);
        ctx.shadowBlur = 0;
    }
    
    // Draw achievement notifications
    drawAchievementNotifications();

    // Speed up overlay
    if (isSpeedUp) {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // Restore from screen shake
    ctx.restore();
    
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
        if (nextWorldIndex === 1) nextWorldName = 'Snow';
        else if (nextWorldIndex === 2) nextWorldName = 'Park';
        else if (nextWorldIndex === 3) nextWorldName = 'Space';
        
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

function drawPowerUpIndicators() {
    let yOffset = 80;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    
    if (shieldActive) {
        const remaining = Math.ceil((shieldEndTime - Date.now()) / 1000);
        ctx.fillStyle = '#00BFFF';
        ctx.fillText(`🛡️ Shield: ${remaining}s`, CANVAS_WIDTH / 2, yOffset);
        yOffset += 25;
    }
    
    if (speedBoostActive) {
        const remaining = Math.ceil((speedBoostEndTime - Date.now()) / 1000);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`⚡ Speed: ${remaining}s`, CANVAS_WIDTH / 2, yOffset);
        yOffset += 25;
    }
    
    if (magnetActive) {
        const remaining = Math.ceil((magnetEndTime - Date.now()) / 1000);
        ctx.fillStyle = '#FF4444';
        ctx.fillText(`🧲 Magnet: ${remaining}s`, CANVAS_WIDTH / 2, yOffset);
        yOffset += 25;
    }
    
    if (doublePointsActive) {
        const remaining = Math.ceil((doublePointsEndTime - Date.now()) / 1000);
        ctx.fillStyle = '#FF69B4';
        ctx.fillText(`✨ 2x Points: ${remaining}s`, CANVAS_WIDTH / 2, yOffset);
    }
    
    ctx.shadowBlur = 0;
}

function drawAchievementNotifications() {
    const currentTime = Date.now();
    
    for (let i = newAchievements.length - 1; i >= 0; i--) {
        const ach = newAchievements[i];
        const age = currentTime - ach.unlockedAt;
        
        if (age > 3000) {
            newAchievements.splice(i, 1);
            continue;
        }
        
        const progress = age / 3000;
        const alpha = progress < 0.8 ? 1 : 1 - ((progress - 0.8) / 0.2);
        
        // Slide in from right
        const slideX = progress < 0.1 ? (1 - progress / 0.1) * 200 : 0;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const boxX = CANVAS_WIDTH - 220 + slideX;
        const boxY = 150 + i * 70;
        ctx.fillRect(boxX, boxY, 210, 60);
        
        // Border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, 210, 60);
        
        // Icon
        ctx.font = '28px Arial';
        ctx.fillText(ach.icon, boxX + 25, boxY + 40);
        
        // Text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Achievement Unlocked!', boxX + 50, boxY + 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(ach.name, boxX + 50, boxY + 42);
        
        ctx.restore();
    }
}

function drawFloatingTexts() {
    const currentTime = Date.now();
    
    floatingTexts.forEach(ft => {
        const age = currentTime - ft.startTime;
        const progress = age / ft.duration;
        
        // Float upward
        const y = ft.y - (progress * 60);
        
        // Fade out
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.font = 'bold 28px Comic Sans MS, cursive';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        
        // Color based on type
        if (ft.text === 'Yum yum!') {
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`; // Gold for treats
        } else if (ft.text === 'Ouch!') {
            ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`; // Red for hazards
        } else {
            ctx.fillStyle = `rgba(0, 191, 255, ${alpha})`; // Blue for shield
        }
        
        // Slight wobble animation
        const wobble = Math.sin(age / 50) * 3;
        
        ctx.fillText(ft.text, ft.x + wobble, y);
        ctx.shadowBlur = 0;
        ctx.restore();
    });
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

// ============== CASTLE BOSS LEVEL DRAWING ==============

function drawCastleTunnel() {
    // Dark stormy sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 50);
    skyGradient.addColorStop(0, '#1a1a2e');    // Very dark blue
    skyGradient.addColorStop(0.3, '#2d2d44');  // Dark purple-blue
    skyGradient.addColorStop(0.6, '#3d3d5c');  // Slightly lighter
    skyGradient.addColorStop(1, '#4a4a70');    // Purple at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HORIZON_Y + 50);
    
    // Draw lightning occasionally
    if (Math.random() < 0.01) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const lightningX = Math.random() * CANVAS_WIDTH;
        ctx.moveTo(lightningX, 0);
        let y = 0;
        while (y < HORIZON_Y) {
            y += 20;
            ctx.lineTo(lightningX + (Math.random() - 0.5) * 30, y);
        }
        ctx.stroke();
    }
    
    // Draw the castle in the background
    drawCastle();
    
    // Stone floor path
    const floorGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    floorGradient.addColorStop(0, '#4a4a4a');   // Dark gray at horizon
    floorGradient.addColorStop(0.5, '#5a5a5a'); // Slightly lighter
    floorGradient.addColorStop(1, '#6a6a6a');   // Lighter gray near player
    
    ctx.fillStyle = floorGradient;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.closePath();
    ctx.fill();
    
    // Stone texture lines
    for (let i = 0; i < 8; i++) {
        const z = ((i * 90 + tunnelOffset) % 720) / 720;
        if (z < 0.05) continue;
        
        const y = getScreenY(z);
        const leftX = getScreenX(-0.8, z);
        const rightX = getScreenX(0.8, z);
        
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1 + z * 2;
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Castle walls on sides
    const wallGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    wallGradient.addColorStop(0, '#3a3a3a');
    wallGradient.addColorStop(0.5, '#4a4a4a');
    wallGradient.addColorStop(1, '#5a5a5a');
    
    // Left wall
    ctx.fillStyle = wallGradient;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.lineTo(0, HORIZON_Y);
    ctx.closePath();
    ctx.fill();
    
    // Right wall
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 + TUNNEL_WIDTH_AT_HORIZON / 2, HORIZON_Y);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, HORIZON_Y);
    ctx.closePath();
    ctx.fill();
    
    // Wall torches
    drawCastleTorches();
    
    // Draw the current boss
    if (!bossDefeated) {
        drawCurrentBoss();
    } else {
        // Draw defeated boss
        drawDefeatedBoss();
    }
    
    // Draw thrown punches
    drawThrownPunches();
}

function drawCastle() {
    const castleX = CANVAS_WIDTH / 2;
    const castleY = HORIZON_Y - 30;
    
    // Main castle body
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(castleX - 80, castleY - 60, 160, 90);
    
    // Towers
    ctx.fillStyle = '#252525';
    // Left tower
    ctx.fillRect(castleX - 100, castleY - 100, 40, 130);
    // Right tower
    ctx.fillRect(castleX + 60, castleY - 100, 40, 130);
    
    // Tower tops (pointed)
    ctx.fillStyle = '#3a1a1a'; // Dark red
    ctx.beginPath();
    ctx.moveTo(castleX - 100, castleY - 100);
    ctx.lineTo(castleX - 80, castleY - 140);
    ctx.lineTo(castleX - 60, castleY - 100);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(castleX + 60, castleY - 100);
    ctx.lineTo(castleX + 80, castleY - 140);
    ctx.lineTo(castleX + 100, castleY - 100);
    ctx.closePath();
    ctx.fill();
    
    // Battlements
    ctx.fillStyle = '#2a2a2a';
    for (let i = 0; i < 7; i++) {
        ctx.fillRect(castleX - 75 + i * 25, castleY - 75, 15, 15);
    }
    
    // Castle gate (arch)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(castleX, castleY + 30, 25, Math.PI, 0);
    ctx.lineTo(castleX + 25, castleY + 30);
    ctx.lineTo(castleX - 25, castleY + 30);
    ctx.closePath();
    ctx.fill();
    
    // Windows with glowing effect
    ctx.fillStyle = '#FF6600';
    ctx.shadowColor = '#FF6600';
    ctx.shadowBlur = 10;
    // Left tower windows
    ctx.fillRect(castleX - 88, castleY - 80, 15, 20);
    ctx.fillRect(castleX - 88, castleY - 50, 15, 20);
    // Right tower windows
    ctx.fillRect(castleX + 73, castleY - 80, 15, 20);
    ctx.fillRect(castleX + 73, castleY - 50, 15, 20);
    ctx.shadowBlur = 0;
}

function drawCastleTorches() {
    // Draw torches on walls with flame animation
    const time = Date.now() / 100;
    
    for (let i = 0; i < 3; i++) {
        const z = 0.3 + i * 0.25;
        const y = getScreenY(z);
        const leftX = getScreenX(-0.9, z);
        const rightX = getScreenX(0.9, z);
        const size = 5 + z * 15;
        
        // Left torch
        drawTorch(leftX, y - size, size, time + i);
        // Right torch
        drawTorch(rightX, y - size, size, time + i + 0.5);
    }
}

function drawTorch(x, y, size, time) {
    // Torch holder
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(x - size * 0.15, y, size * 0.3, size * 0.8);
    
    // Flame
    const flicker = Math.sin(time * 5) * size * 0.1;
    
    // Outer flame (orange)
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y);
    ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.5 + flicker, x, y - size + flicker);
    ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.5 - flicker, x + size * 0.3, y);
    ctx.closePath();
    ctx.fill();
    
    // Inner flame (yellow)
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.15, y);
    ctx.quadraticCurveTo(x - size * 0.2, y - size * 0.3 - flicker, x, y - size * 0.6 + flicker);
    ctx.quadraticCurveTo(x + size * 0.2, y - size * 0.3 + flicker, x + size * 0.15, y);
    ctx.closePath();
    ctx.fill();
}

// Draw the current boss based on boss type
function drawCurrentBoss() {
    switch (currentBossType) {
        case 0:
            drawDaveTheAngryCat();
            break;
        case 1:
            drawBigBadHoover();
            break;
        case 2:
            drawCreepyCrazyCucumber();
            break;
        case 3:
            drawDangerousDougieTheDog();
            break;
        default:
            drawDaveTheAngryCat();
    }
}

// Boss 1: Dave the Angry Cat (original boss)
function drawDaveTheAngryCat() {
    const hitFlash = Date.now() - bossHitTime < 200;
    const bossScale = 1.5 + (level / BOSS_LEVEL_INTERVAL) * 0.2; // Gets bigger with each boss
    
    ctx.save();
    ctx.translate(bossX, bossY);
    ctx.scale(bossScale, bossScale);
    
    if (hitFlash) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 30) * 0.5;
    }
    
    // Body - angry black cat
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(0, 10, 35, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, -20, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry ears (pointed up)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-20, -35);
    ctx.lineTo(-12, -55);
    ctx.lineTo(-5, -35);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(20, -35);
    ctx.lineTo(12, -55);
    ctx.lineTo(5, -35);
    ctx.closePath();
    ctx.fill();
    
    // Inner ears (pink, angry)
    ctx.fillStyle = '#FF3333';
    ctx.beginPath();
    ctx.moveTo(-17, -37);
    ctx.lineTo(-12, -50);
    ctx.lineTo(-8, -37);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(17, -37);
    ctx.lineTo(12, -50);
    ctx.lineTo(8, -37);
    ctx.closePath();
    ctx.fill();
    
    // Angry eyes (red, glowing)
    ctx.fillStyle = '#FF0000';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(-10, -22, 8, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, -22, 8, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Evil pupils (slits)
    ctx.fillStyle = '#000000';
    ctx.fillRect(-11, -25, 2, 6);
    ctx.fillRect(9, -25, 2, 6);
    
    // Angry eyebrows
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, -32);
    ctx.lineTo(-5, -28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, -32);
    ctx.lineTo(5, -28);
    ctx.stroke();
    
    // Snarling mouth with fangs
    ctx.fillStyle = '#330000';
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.quadraticCurveTo(0, 5, 12, -5);
    ctx.quadraticCurveTo(0, 10, -12, -5);
    ctx.closePath();
    ctx.fill();
    
    // Fangs
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.lineTo(-4, 3);
    ctx.lineTo(-2, -5);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(6, -5);
    ctx.lineTo(4, 3);
    ctx.lineTo(2, -5);
    ctx.closePath();
    ctx.fill();
    
    // Whiskers (aggressive, pointing down)
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        // Left whiskers
        ctx.beginPath();
        ctx.moveTo(-15, -10 + i * 4);
        ctx.lineTo(-35, -5 + i * 6);
        ctx.stroke();
        // Right whiskers
        ctx.beginPath();
        ctx.moveTo(15, -10 + i * 4);
        ctx.lineTo(35, -5 + i * 6);
        ctx.stroke();
    }
    
    // Raised paws (threatening pose)
    ctx.fillStyle = '#1a1a1a';
    // Left paw
    ctx.beginPath();
    ctx.ellipse(-30, 0, 12, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right paw
    ctx.beginPath();
    ctx.ellipse(30, 0, 12, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Claws
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 3; i++) {
        // Left claws
        ctx.beginPath();
        ctx.moveTo(-38 + i * 5, -5);
        ctx.lineTo(-40 + i * 5, -12);
        ctx.lineTo(-36 + i * 5, -5);
        ctx.closePath();
        ctx.fill();
        // Right claws
        ctx.beginPath();
        ctx.moveTo(38 - i * 5, -5);
        ctx.lineTo(40 - i * 5, -12);
        ctx.lineTo(36 - i * 5, -5);
        ctx.closePath();
        ctx.fill();
    }
    
    // Tail (swishing angrily)
    const tailSwish = Math.sin(Date.now() / 100) * 15;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(30 + tailSwish, 40, 40 + tailSwish, 20);
    ctx.stroke();
    
    ctx.restore();
    
    // Draw boss health bar
    drawBossHealthBar();
}

// Boss 2: Big Bad Hoover - A menacing vacuum cleaner
function drawBigBadHoover() {
    const hitFlash = Date.now() - bossHitTime < 200;
    const bossScale = 1.5 + (level / BOSS_LEVEL_INTERVAL) * 0.2;
    const wobble = Math.sin(Date.now() / 150) * 5;
    
    ctx.save();
    ctx.translate(bossX, bossY);
    ctx.scale(bossScale, bossScale);
    
    if (hitFlash) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 30) * 0.5;
    }
    
    // Vacuum body (cylinder)
    const gradient = ctx.createLinearGradient(-30, 0, 30, 0);
    gradient.addColorStop(0, '#2a2a2a');
    gradient.addColorStop(0.5, '#4a4a4a');
    gradient.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 10, 35, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Vacuum head (angry face area)
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(0, -15, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Red angry "power" button (like an eye)
    ctx.fillStyle = '#FF0000';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, -20, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Inner red glow
    ctx.fillStyle = '#FF6666';
    ctx.beginPath();
    ctx.arc(-3, -23, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyes (headlights)
    ctx.fillStyle = '#FFFF00';
    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-18, -10, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(18, -10, 6, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Angry eyebrows (vents)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-25, -18, 12, 3);
    ctx.fillRect(13, -18, 12, 3);
    
    // Suction mouth (scary opening)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(0, 5 + wobble, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Swirling suction effect
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const angle = Date.now() / 200 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(0, 5 + wobble, 10 - i * 3, angle, angle + Math.PI);
        ctx.stroke();
    }
    
    // Hose arm (threatening)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    const hoseSwing = Math.sin(Date.now() / 200) * 20;
    ctx.beginPath();
    ctx.moveTo(-30, 15);
    ctx.quadraticCurveTo(-50 + hoseSwing, 0, -60 + hoseSwing, -20);
    ctx.stroke();
    
    // Hose nozzle
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(-60 + hoseSwing, -20, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(-25, 35, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(25, 35, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    drawBossHealthBar();
}

// Boss 3: Creepy Crazy Cucumber - An evil sentient cucumber
function drawCreepyCrazyCucumber() {
    const hitFlash = Date.now() - bossHitTime < 200;
    const bossScale = 1.5 + (level / BOSS_LEVEL_INTERVAL) * 0.2;
    const squish = Math.sin(Date.now() / 200) * 3;
    
    ctx.save();
    ctx.translate(bossX, bossY);
    ctx.scale(bossScale, bossScale);
    
    if (hitFlash) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 30) * 0.5;
    }
    
    // Cucumber body (elongated oval)
    const cucumberGradient = ctx.createLinearGradient(-35, 0, 35, 0);
    cucumberGradient.addColorStop(0, '#1B5E20');
    cucumberGradient.addColorStop(0.3, '#2E7D32');
    cucumberGradient.addColorStop(0.5, '#43A047');
    cucumberGradient.addColorStop(0.7, '#2E7D32');
    cucumberGradient.addColorStop(1, '#1B5E20');
    ctx.fillStyle = cucumberGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 40 + squish, 25 - squish, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Cucumber bumps/texture
    ctx.fillStyle = '#1B5E20';
    for (let i = 0; i < 8; i++) {
        const bx = -30 + i * 9 + Math.sin(i) * 3;
        const by = Math.sin(i * 1.5) * 15;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Crazy spiral eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-15, -8, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(15, -8, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Spiral pupils (crazy!)
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    const spiralRotation = Date.now() / 100;
    for (let eye = -1; eye <= 1; eye += 2) {
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 4; t += 0.1) {
            const r = t * 1.2;
            const x = eye * 15 + Math.cos(t + spiralRotation * eye) * r * 0.5;
            const y = -8 + Math.sin(t + spiralRotation * eye) * r * 0.5;
            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Evil grin
    ctx.fillStyle = '#1B5E20';
    ctx.beginPath();
    ctx.arc(0, 10, 20, 0, Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0.1, Math.PI - 0.1);
    ctx.fill();
    
    // Sharp teeth
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 7; i++) {
        const tx = -14 + i * 5;
        ctx.beginPath();
        ctx.moveTo(tx - 2, 10);
        ctx.lineTo(tx, 20);
        ctx.lineTo(tx + 2, 10);
        ctx.closePath();
        ctx.fill();
    }
    
    // Vine arms (threatening)
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    const vineSwing = Math.sin(Date.now() / 150) * 15;
    
    // Left vine
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.quadraticCurveTo(-55, -10 + vineSwing, -60, -30 + vineSwing);
    ctx.stroke();
    
    // Right vine  
    ctx.beginPath();
    ctx.moveTo(35, 0);
    ctx.quadraticCurveTo(55, -10 - vineSwing, 60, -30 - vineSwing);
    ctx.stroke();
    
    // Leaves on vines
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.ellipse(-58, -25 + vineSwing, 8, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(58, -25 - vineSwing, 8, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    drawBossHealthBar();
}

// Boss 4: Dangerous Dougie the Dog - The final cute but deadly puppy boss
function drawDangerousDougieTheDog() {
    const hitFlash = Date.now() - bossHitTime < 200;
    const bossScale = 1.8 + (level / BOSS_LEVEL_INTERVAL) * 0.2; // Bigger final boss!
    const bounce = Math.abs(Math.sin(Date.now() / 200)) * 5;
    const tailWag = Math.sin(Date.now() / 80) * 20;
    
    ctx.save();
    ctx.translate(bossX, bossY - bounce);
    ctx.scale(bossScale, bossScale);
    
    if (hitFlash) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 30) * 0.5;
    }
    
    // Body (fluffy brown)
    const bodyGradient = ctx.createRadialGradient(0, 10, 0, 0, 10, 40);
    bodyGradient.addColorStop(0, '#A0522D');
    bodyGradient.addColorStop(1, '#8B4513');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 10, 35, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Fluffy chest (cream colored)
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.ellipse(0, 20, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.arc(0, -18, 28, 0, Math.PI * 2);
    ctx.fill();
    
    // Snout
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.ellipse(0, -8, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Big cute but menacing eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-12, -22, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -22, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Red glowing pupils (danger!)
    ctx.fillStyle = '#8B0000';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-12, -20, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -20, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Evil glint in eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-10, -23, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, -23, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(0, -5, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-2, -7, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Snarling mouth with teeth
    ctx.fillStyle = '#330000';
    ctx.beginPath();
    ctx.moveTo(-12, 3);
    ctx.quadraticCurveTo(0, 15, 12, 3);
    ctx.quadraticCurveTo(0, 20, -12, 3);
    ctx.closePath();
    ctx.fill();
    
    // Sharp teeth
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-8 + i * 4, 5);
        ctx.lineTo(-6 + i * 4, 12);
        ctx.lineTo(-4 + i * 4, 5);
        ctx.closePath();
        ctx.fill();
    }
    
    // Tongue
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.ellipse(0, 14, 6, 4, 0, 0, Math.PI);
    ctx.fill();
    
    // Floppy ears
    ctx.fillStyle = '#8B4513';
    // Left ear (floppy)
    ctx.beginPath();
    ctx.ellipse(-25, -15, 12, 20, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.ellipse(25, -15, 12, 20, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Paws (ready to pounce)
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.ellipse(-28, 30, 12, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(28, 30, 12, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Paw pads
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.ellipse(-28, 32, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(28, 32, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wagging tail
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 35);
    ctx.quadraticCurveTo(25 + tailWag, 45, 35 + tailWag, 25);
    ctx.stroke();
    
    // Fluffy tail tip
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.arc(35 + tailWag, 22, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Collar (danger sign)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-18, -2, 36, 6);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 1, 5, 0, Math.PI * 2);
    ctx.fill();
    // Skull on collar tag
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillRect(-1.5, -1, 1, 1);
    ctx.fillRect(0.5, -1, 1, 1);
    
    ctx.restore();
    drawBossHealthBar();
}

function drawBossHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const barX = CANVAS_WIDTH / 2 - barWidth / 2;
    const barY = 50;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    
    // Health bar
    const healthPercent = bossHealth / bossMaxHealth;
    const healthColor = healthPercent > 0.5 ? '#FF0000' : healthPercent > 0.25 ? '#FF6600' : '#FF0000';
    
    ctx.fillStyle = '#550000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Boss name based on current boss type
    const bossNames = [
        '😼 DAVE THE ANGRY CAT 😼',
        '🧹 BIG BAD HOOVER 🧹',
        '🥒 CREEPY CRAZY CUCUMBER 🥒',
        '🐕 DANGEROUS DOUGIE 🐕'
    ];
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(bossNames[currentBossType] || bossNames[0], CANVAS_WIDTH / 2, barY - 8);
    
    // Health text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText(`${Math.ceil(bossHealth)} / ${bossMaxHealth}`, CANVAS_WIDTH / 2, barY + 15);
}

function drawDefeatedBoss() {
    ctx.save();
    ctx.translate(bossX, bossY + 20);
    ctx.rotate(Math.PI / 2); // Lying down
    ctx.globalAlpha = 0.6;
    
    // Simplified defeated cat
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // X eyes
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, -5);
    ctx.lineTo(-7, 3);
    ctx.moveTo(-7, -5);
    ctx.lineTo(-15, 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, -5);
    ctx.lineTo(15, 3);
    ctx.moveTo(15, -5);
    ctx.lineTo(7, 3);
    ctx.stroke();
    
    ctx.restore();
}

function drawThrownPunches() {
    thrownPunches.forEach(punch => {
        ctx.save();
        ctx.translate(punch.x, punch.y);
        
        // Punch emoji with motion blur effect
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👊', 0, 0);
        
        // Motion trail
        ctx.globalAlpha = 0.3;
        ctx.fillText('👊', 0, 15);
        ctx.globalAlpha = 0.15;
        ctx.fillText('👊', 0, 30);
        
        ctx.restore();
    });
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

// Side Scenery System - decorative objects that move along the sides
function spawnSideScenery() {
    // Determine which type of scenery based on current world
    // Now includes flowers and trees that were previously static!
    let sceneryTypes = [];
    
    if (currentWorld === WORLDS.GARDEN) {
        // Include detailed flowers as moving scenery
        sceneryTypes = ['detailed_flower', 'detailed_flower', 'flower_bush', 'garden_gnome', 'butterfly', 'bird_bath', 'garden_tree'];
    } else if (currentWorld === WORLDS.SNOW) {
        // Include pine trees as moving scenery
        sceneryTypes = ['pine_tree', 'pine_tree', 'snowman', 'grit_bin', 'snow_lamp', 'ice_sculpture', 'snow_drift'];
    } else if (currentWorld === WORLDS.PARK) {
        // Include park trees
        sceneryTypes = ['park_tree', 'bench', 'lamp_post', 'trash_bin', 'bird', 'swing_set'];
    } else { // SPACE
        sceneryTypes = ['asteroid', 'satellite', 'alien_plant', 'space_rock', 'star_cluster', 'planet'];
    }
    
    const type = sceneryTypes[Math.floor(Math.random() * sceneryTypes.length)];
    const side = Math.random() < 0.5 ? 'left' : 'right';
    
    sideScenery.push({
        type: type,
        side: side,
        z: 0.05, // Start far away
        offsetX: Math.random() * 30, // Small random offset
        color: getRandomFlowerColor() // For flowers
    });
}

function getRandomFlowerColor() {
    const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#FF4500', '#FF1493', '#FFA500', '#FF0000', '#FF00FF'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function drawSideScenery() {
    // Sort by z so far objects are drawn first
    sideScenery.sort((a, b) => a.z - b.z);
    
    sideScenery.forEach(scenery => {
        const scale = 0.3 + scenery.z * 1.2; // Scale based on distance
        const y = getScreenY(scenery.z);
        
        // Position on left or right side, outside the main tunnel
        let x;
        if (scenery.side === 'left') {
            x = getScreenX(-1.2 - scenery.offsetX / 100, scenery.z);
        } else {
            x = getScreenX(1.2 + scenery.offsetX / 100, scenery.z);
        }
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // Draw based on type and world
        if (currentWorld === WORLDS.SNOW) {
            drawSnowSceneryItem(scenery.type, scenery.side);
        } else if (currentWorld === WORLDS.GARDEN) {
            drawGardenSceneryItem(scenery.type, scenery.side);
        } else if (currentWorld === WORLDS.PARK) {
            drawParkSceneryItem(scenery.type, scenery.side);
        } else {
            drawSpaceSceneryItem(scenery.type, scenery.side);
        }
        
        ctx.restore();
    });
}

function drawSnowSceneryItem(type, side) {
    if (type === 'pine_tree') {
        // Moving snow-covered pine tree
        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-5, 20, 10, 30);
        // Tree layers with snow
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(-25, 0);
        ctx.lineTo(25, 0);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-30, 20);
        ctx.lineTo(30, 20);
        ctx.closePath();
        ctx.fill();
        // Snow on branches
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(-12, -30);
        ctx.lineTo(12, -30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-20, -5, 8, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(18, 0, 7, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'snow_drift') {
        // Snow drift mound
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, 15, 30, 15, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#E8F4F8';
        ctx.beginPath();
        ctx.ellipse(-10, 10, 20, 10, -0.2, Math.PI, 0);
        ctx.fill();
        // Sparkles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-15 + i * 8, 5 + Math.sin(i) * 5, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'snowman') {
        // Snowman - three balls with accessories
        ctx.fillStyle = '#FFFFFF';
        // Bottom ball
        ctx.beginPath();
        ctx.arc(0, 20, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CCDDEE';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Middle ball
        ctx.beginPath();
        ctx.arc(0, -5, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Head
        ctx.beginPath();
        ctx.arc(0, -25, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Eyes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-4, -27, 2, 0, Math.PI * 2);
        ctx.arc(4, -27, 2, 0, Math.PI * 2);
        ctx.fill();
        // Carrot nose
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(8, -23);
        ctx.lineTo(0, -21);
        ctx.closePath();
        ctx.fill();
        // Scarf
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-12, -15, 24, 5);
        // Hat
        ctx.fillStyle = '#222';
        ctx.fillRect(-8, -42, 16, 12);
        ctx.fillRect(-10, -32, 20, 3);
    } else if (type === 'grit_bin') {
        // Grit/Salt bin - yellow rectangular box
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-15, -5, 30, 35);
        // Lid
        ctx.fillStyle = '#E6C200';
        ctx.fillRect(-17, -10, 34, 8);
        // "GRIT" text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GRIT', 0, 18);
    } else if (type === 'snow_lamp') {
        // Street lamp covered in snow
        ctx.fillStyle = '#444';
        ctx.fillRect(-3, -50, 6, 80);
        // Lamp head
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(-12, -50);
        ctx.lineTo(12, -50);
        ctx.lineTo(8, -40);
        ctx.lineTo(-8, -40);
        ctx.closePath();
        ctx.fill();
        // Light glow
        ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
        ctx.beginPath();
        ctx.arc(0, -45, 15, 0, Math.PI * 2);
        ctx.fill();
        // Snow on top
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, -52, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'ice_sculpture') {
        // Ice cat sculpture
        ctx.fillStyle = 'rgba(180, 220, 255, 0.7)';
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.8)';
        ctx.lineWidth = 2;
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 10, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Head
        ctx.beginPath();
        ctx.arc(0, -10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Ears
        ctx.beginPath();
        ctx.moveTo(-10, -18);
        ctx.lineTo(-5, -28);
        ctx.lineTo(0, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(5, -28);
        ctx.lineTo(10, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function drawGardenSceneryItem(type, side, color) {
    if (type === 'detailed_flower') {
        // Moving detailed flower - like the old static ones
        const flowerColor = color || '#FF69B4';
        // Stem
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 40);
        ctx.stroke();
        // Leaves
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(-8, 20, 10, 4, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(8, 28, 9, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Petals
        for (let p = 0; p < 6; p++) {
            const angle = (p / 6) * Math.PI * 2;
            const px = Math.cos(angle) * 12;
            const py = Math.sin(angle) * 12;
            ctx.fillStyle = flowerColor;
            ctx.beginPath();
            ctx.ellipse(px, py, 10, 6, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        // Center
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFA000';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'garden_tree') {
        // Small garden tree
        // Trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-6, 0, 12, 50);
        // Foliage layers
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(0, -20, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        ctx.arc(-10, -15, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12, -10, 18, 0, Math.PI * 2);
        ctx.fill();
        // Apples or flowers
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-15, -25, 5, 0, Math.PI * 2);
        ctx.arc(8, -30, 4, 0, Math.PI * 2);
        ctx.arc(20, -15, 5, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'flower_bush') {
        // Colorful flower bush
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(0, 10, 25, 0, Math.PI * 2);
        ctx.fill();
        // Flowers
        const colors = ['#FF69B4', '#FF6347', '#FFD700', '#FF1493', '#FF4500'];
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = colors[i % colors.length];
            const angle = (i / 8) * Math.PI * 2;
            const fx = Math.cos(angle) * 18;
            const fy = Math.sin(angle) * 15 + 5;
            ctx.beginPath();
            ctx.arc(fx, fy, 6, 0, Math.PI * 2);
            ctx.fill();
            // Center
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'garden_gnome') {
        // Garden gnome
        // Body
        ctx.fillStyle = '#0066CC';
        ctx.beginPath();
        ctx.moveTo(-10, 30);
        ctx.lineTo(10, 30);
        ctx.lineTo(8, 5);
        ctx.lineTo(-8, 5);
        ctx.closePath();
        ctx.fill();
        // Head
        ctx.fillStyle = '#FFD5B4';
        ctx.beginPath();
        ctx.arc(0, -5, 10, 0, Math.PI * 2);
        ctx.fill();
        // Pointy hat
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(0, -35);
        ctx.lineTo(10, -8);
        ctx.closePath();
        ctx.fill();
        // Beard
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.quadraticCurveTo(0, 20, 8, 0);
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-4, -7, 2, 0, Math.PI * 2);
        ctx.arc(4, -7, 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'butterfly') {
        // Animated butterfly
        const wingFlap = Math.sin(Date.now() / 100) * 0.3;
        ctx.save();
        // Left wing
        ctx.fillStyle = '#FF69B4';
        ctx.rotate(-wingFlap);
        ctx.beginPath();
        ctx.ellipse(-10, 0, 12, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(-12, 0, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        // Right wing
        ctx.fillStyle = '#FF69B4';
        ctx.rotate(wingFlap);
        ctx.beginPath();
        ctx.ellipse(10, 0, 12, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(12, 0, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Body
        ctx.fillStyle = '#333';
        ctx.fillRect(-2, -8, 4, 16);
    } else if (type === 'bird_bath') {
        // Bird bath
        ctx.fillStyle = '#888';
        // Base
        ctx.fillRect(-5, 10, 10, 25);
        // Bowl
        ctx.beginPath();
        ctx.ellipse(0, 5, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6699CC';
        ctx.beginPath();
        ctx.ellipse(0, 3, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawParkSceneryItem(type, side) {
    if (type === 'park_tree') {
        // Large leafy park tree
        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-8, 10, 16, 40);
        // Root bumps
        ctx.beginPath();
        ctx.ellipse(-12, 48, 8, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(12, 48, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Main foliage
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(0, -15, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#388E3C';
        ctx.beginPath();
        ctx.arc(-15, -5, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(18, -10, 22, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(-8, -25, 12, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'swing_set') {
        // Playground swing set
        // Frame
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 4;
        // A-frame left
        ctx.beginPath();
        ctx.moveTo(-30, 40);
        ctx.lineTo(-20, -30);
        ctx.lineTo(-10, 40);
        ctx.stroke();
        // A-frame right
        ctx.beginPath();
        ctx.moveTo(10, 40);
        ctx.lineTo(20, -30);
        ctx.lineTo(30, 40);
        ctx.stroke();
        // Top bar
        ctx.beginPath();
        ctx.moveTo(-20, -30);
        ctx.lineTo(20, -30);
        ctx.stroke();
        // Swing chains
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -30);
        ctx.lineTo(-8, 10);
        ctx.moveTo(5, -30);
        ctx.lineTo(8, 10);
        ctx.stroke();
        // Swing seat
        ctx.fillStyle = '#333';
        ctx.fillRect(-10, 10, 20, 4);
    } else if (type === 'bench') {
        // Park bench
        ctx.fillStyle = '#8B4513';
        // Seat
        ctx.fillRect(-20, 5, 40, 5);
        // Back
        ctx.fillRect(-20, -15, 40, 5);
        ctx.fillRect(-20, -8, 40, 5);
        // Legs
        ctx.fillStyle = '#333';
        ctx.fillRect(-18, 10, 4, 20);
        ctx.fillRect(14, 10, 4, 20);
        // Arm rests
        ctx.fillRect(-22, -5, 4, 15);
        ctx.fillRect(18, -5, 4, 15);
    } else if (type === 'lamp_post') {
        // Classic lamp post
        ctx.fillStyle = '#222';
        ctx.fillRect(-3, -40, 6, 70);
        // Lamp
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(-10, -45);
        ctx.lineTo(10, -45);
        ctx.lineTo(8, -35);
        ctx.lineTo(-8, -35);
        ctx.closePath();
        ctx.fill();
        // Light
        ctx.fillStyle = 'rgba(255, 255, 150, 0.8)';
        ctx.beginPath();
        ctx.arc(0, -40, 8, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.fillStyle = 'rgba(255, 255, 150, 0.3)';
        ctx.beginPath();
        ctx.arc(0, -40, 20, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'trash_bin') {
        // Trash bin
        ctx.fillStyle = '#228B22';
        ctx.fillRect(-12, -5, 24, 35);
        // Lid
        ctx.fillStyle = '#1E7A1E';
        ctx.beginPath();
        ctx.ellipse(0, -5, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Opening
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 8, 6, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'bird') {
        // Flying bird
        const flapOffset = Math.sin(Date.now() / 80) * 10;
        ctx.fillStyle = '#444';
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wings
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.quadraticCurveTo(-15, -10 + flapOffset, -20, 0);
        ctx.quadraticCurveTo(-15, 5, -5, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.quadraticCurveTo(15, -10 + flapOffset, 20, 0);
        ctx.quadraticCurveTo(15, 5, 5, 0);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(10, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        // Beak
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(14, -2);
        ctx.lineTo(20, -1);
        ctx.lineTo(14, 0);
        ctx.closePath();
        ctx.fill();
    }
}

function drawSpaceSceneryItem(type, side) {
    if (type === 'star_cluster') {
        // Cluster of twinkling stars
        const stars = [
            {x: 0, y: 0, size: 6},
            {x: -15, y: -10, size: 4},
            {x: 12, y: -8, size: 5},
            {x: -8, y: 15, size: 3},
            {x: 18, y: 12, size: 4},
            {x: -20, y: 5, size: 3},
            {x: 5, y: -18, size: 4}
        ];
        const twinkle = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        stars.forEach(star => {
            const brightness = twinkle + Math.sin(Date.now() / 150 + star.x) * 0.2;
            ctx.fillStyle = `rgba(255, 255, 200, ${brightness})`;
            // Draw star shape
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
                const outerX = star.x + Math.cos(angle) * star.size;
                const outerY = star.y + Math.sin(angle) * star.size;
                const innerAngle = angle + Math.PI / 5;
                const innerX = star.x + Math.cos(innerAngle) * (star.size * 0.4);
                const innerY = star.y + Math.sin(innerAngle) * (star.size * 0.4);
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
        });
    } else if (type === 'planet') {
        // Colorful planet with rings
        const colors = ['#E57373', '#64B5F6', '#81C784', '#FFB74D', '#BA68C8'];
        const planetColor = colors[Math.floor(Date.now() / 5000) % colors.length];
        // Planet body
        ctx.fillStyle = planetColor;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        // Darker side
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(5, 0, 25, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        // Rings
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 10, 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(180, 180, 180, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 12, 0.3, 0, Math.PI * 2);
        ctx.stroke();
    } else if (type === 'asteroid') {
        // Tumbling asteroid
        ctx.save();
        ctx.rotate(Date.now() / 1000);
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(15, -10);
        ctx.lineTo(20, 5);
        ctx.lineTo(10, 20);
        ctx.lineTo(-10, 18);
        ctx.lineTo(-18, 5);
        ctx.lineTo(-15, -12);
        ctx.closePath();
        ctx.fill();
        // Craters
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(5, 0, 5, 0, Math.PI * 2);
        ctx.arc(-8, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else if (type === 'satellite') {
        // Space satellite
        ctx.fillStyle = '#888';
        // Body
        ctx.fillRect(-8, -8, 16, 16);
        // Solar panels
        ctx.fillStyle = '#1E90FF';
        ctx.fillRect(-35, -5, 25, 10);
        ctx.fillRect(10, -5, 25, 10);
        // Panel lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = -30; i < -10; i += 5) {
            ctx.beginPath();
            ctx.moveTo(i, -5);
            ctx.lineTo(i, 5);
            ctx.stroke();
        }
        for (let i = 15; i < 35; i += 5) {
            ctx.beginPath();
            ctx.moveTo(i, -5);
            ctx.lineTo(i, 5);
            ctx.stroke();
        }
        // Antenna
        ctx.fillStyle = '#AAA';
        ctx.fillRect(-1, -20, 2, 12);
        ctx.beginPath();
        ctx.arc(0, -22, 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'alien_plant') {
        // Bioluminescent alien plant
        ctx.fillStyle = '#00FF88';
        // Stem
        ctx.fillRect(-3, 0, 6, 30);
        // Glowing bulbs
        const glow = 0.5 + Math.sin(Date.now() / 300) * 0.3;
        ctx.fillStyle = `rgba(0, 255, 200, ${glow})`;
        ctx.beginPath();
        ctx.arc(-10, -10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -20, 12, 0, Math.PI * 2);
        ctx.fill();
        // Glow effect
        ctx.fillStyle = `rgba(0, 255, 200, ${glow * 0.3})`;
        ctx.beginPath();
        ctx.arc(0, -10, 30, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'space_rock') {
        // Floating space rock
        ctx.fillStyle = '#554433';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 12, Date.now() / 2000, 0, Math.PI * 2);
        ctx.fill();
        // Highlights
        ctx.fillStyle = '#776655';
        ctx.beginPath();
        ctx.ellipse(-5, -3, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
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
    if (obj.emoji === 'hairdryer') {
        drawHairdryer(size);
    } else if (obj.emoji === 'tuna') {
        drawTunaCan(size);
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

function drawTunaCan(size) {
    const scale = size / 40; // Base size is 40
    ctx.save();
    ctx.scale(scale, scale);
    
    // Can body - silver/metallic
    const canGradient = ctx.createLinearGradient(-20, 0, 20, 0);
    canGradient.addColorStop(0, '#A0A0A0');
    canGradient.addColorStop(0.3, '#E0E0E0');
    canGradient.addColorStop(0.5, '#F5F5F5');
    canGradient.addColorStop(0.7, '#E0E0E0');
    canGradient.addColorStop(1, '#A0A0A0');
    
    ctx.fillStyle = canGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Can rim - top
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -8, 18, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Can rim - bottom  
    ctx.beginPath();
    ctx.ellipse(0, 8, 18, 5, 0, 0, Math.PI);
    ctx.stroke();
    
    // Label background - blue
    ctx.fillStyle = '#1976D2';
    ctx.beginPath();
    ctx.rect(-18, -5, 36, 10);
    ctx.fill();
    
    // Label wave pattern (ocean)
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.moveTo(-18, 2);
    for (let i = 0; i < 6; i++) {
        ctx.quadraticCurveTo(-15 + i * 6, 0, -12 + i * 6, 2);
        ctx.quadraticCurveTo(-9 + i * 6, 4, -6 + i * 6, 2);
    }
    ctx.lineTo(18, 5);
    ctx.lineTo(-18, 5);
    ctx.closePath();
    ctx.fill();
    
    // "TUNA" text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TUNA', 0, -1);
    
    // Small fish icon on label
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.ellipse(-10, 3, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, 3);
    ctx.lineTo(-3, 1);
    ctx.lineTo(-3, 5);
    ctx.closePath();
    ctx.fill();
    
    // Pull tab on top
    ctx.fillStyle = '#9E9E9E';
    ctx.beginPath();
    ctx.ellipse(8, -10, 5, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.arc(10, -10, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Shine/highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-8, -3, 6, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawToby() {
    ctx.save();
    
    // Get current skin colors
    const skin = TOBY_SKINS[currentSkin] || TOBY_SKINS.default;
    const bodyColor = skin.bodyColor;
    const patchColor = skin.patchColor;
    // Derive secondary colors from skin
    const bodyLighter = lightenColor(bodyColor, 0.1);
    const bodyDarker = darkenColor(bodyColor, 0.15);
    const patchLighter = lightenColor(patchColor, 0.2);
    
    // Apply body bob for running animation
    ctx.translate(toby.x, toby.y + toby.bobOffset);

    // Flip based on direction
    if (toby.direction === -1) {
        ctx.scale(-1, 1);
    }

    const scale = 1.2; // Make Toby bigger
    ctx.scale(scale, scale);
    
    // Animation values for running
    const runPhase = toby.runCycle;
    const legSwing = Math.sin(runPhase) * 12;           // Front/back leg swing
    const legSwingBack = Math.sin(runPhase + Math.PI) * 12; // Opposite phase for back legs
    const tailWag = Math.sin(runPhase * 1.5) * 8;       // Tail wagging
    const headBob = Math.sin(runPhase * 2) * 1.5;       // Slight head bob

    // ===== BACK LEGS (drawn first, behind body) =====
    ctx.save();
    
    // Back left leg (further back, darker)
    ctx.fillStyle = bodyDarker;
    ctx.strokeStyle = darkenColor(bodyColor, 0.25);
    ctx.lineWidth = 1;
    
    // Upper back leg
    ctx.save();
    ctx.translate(-12, 20);
    ctx.rotate(legSwingBack * 0.03);
    ctx.beginPath();
    ctx.ellipse(0, 8, 7, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Lower back leg + paw
    ctx.save();
    ctx.translate(0, 16);
    ctx.rotate(legSwingBack * 0.02);
    ctx.beginPath();
    ctx.ellipse(0, 8, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Paw
    ctx.fillStyle = bodyDarker;
    ctx.beginPath();
    ctx.ellipse(0, 18, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    
    // Back right leg
    ctx.save();
    ctx.translate(12, 20);
    ctx.rotate(legSwing * 0.03);
    ctx.beginPath();
    ctx.ellipse(0, 8, 7, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.save();
    ctx.translate(0, 16);
    ctx.rotate(legSwing * 0.02);
    ctx.beginPath();
    ctx.ellipse(0, 8, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = bodyDarker;
    ctx.beginPath();
    ctx.ellipse(0, 18, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    
    ctx.restore();

    // ===== ANIMATED TAIL =====
    ctx.save();
    ctx.translate(22, 10);
    ctx.rotate(tailWag * 0.02);
    
    // Tail - uses skin body color
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.quadraticCurveTo(18 + tailWag * 0.3, 0, 23 + tailWag * 0.5, -15);
    ctx.quadraticCurveTo(28 + tailWag * 0.3, -25, 18 + tailWag * 0.2, -20);
    ctx.quadraticCurveTo(13, -5, 0, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = bodyDarker;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tail stripes - uses skin patch color
    ctx.fillStyle = patchLighter;
    ctx.beginPath();
    ctx.moveTo(6, -2);
    ctx.quadraticCurveTo(13 + tailWag * 0.2, -5, 16 + tailWag * 0.3, -10);
    ctx.quadraticCurveTo(18 + tailWag * 0.2, -8, 11, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = patchColor;
    ctx.beginPath();
    ctx.moveTo(16 + tailWag * 0.3, -12);
    ctx.quadraticCurveTo(23 + tailWag * 0.4, -18, 22 + tailWag * 0.4, -22);
    ctx.quadraticCurveTo(26 + tailWag * 0.3, -20, 20 + tailWag * 0.3, -12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ===== BODY =====
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 10, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bodyDarker;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Body patches - uses skin patch colors
    ctx.fillStyle = patchLighter;
    ctx.beginPath();
    ctx.ellipse(-10, 5, 12, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = patchColor;
    ctx.beginPath();
    ctx.ellipse(12, 12, 8, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // ===== FRONT LEGS (in front of body) =====
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = bodyDarker;
    ctx.lineWidth = 1;
    
    // Front left leg
    ctx.save();
    ctx.translate(-15, 22);
    ctx.rotate(legSwing * 0.04);
    // Upper leg
    ctx.beginPath();
    ctx.ellipse(0, 6, 6, 10, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Lower leg
    ctx.save();
    ctx.translate(0, 12);
    ctx.rotate(legSwing * 0.03);
    ctx.beginPath();
    ctx.ellipse(0, 6, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Paw
    ctx.beginPath();
    ctx.ellipse(0, 14, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Paw pads - pink
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(0, 15, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    
    // Front right leg
    ctx.save();
    ctx.translate(15, 22);
    ctx.rotate(legSwingBack * 0.04);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 6, 6, 10, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(0, 12);
    ctx.rotate(legSwingBack * 0.03);
    ctx.beginPath();
    ctx.ellipse(0, 6, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 14, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(0, 15, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // ===== HEAD (with slight bob) =====
    ctx.save();
    ctx.translate(0, headBob);
    
    // Head - uses skin body color
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -15, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bodyDarker;
    ctx.stroke();

    // Head patch - uses skin patch color
    ctx.fillStyle = patchColor;
    ctx.beginPath();
    ctx.ellipse(-8, -22, 10, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Ears - uses skin body color with patch tips
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-17, -32);
    ctx.lineTo(-12, -45);
    ctx.lineTo(-5, -32);
    ctx.fill();
    ctx.strokeStyle = bodyDarker;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(5, -32);
    ctx.lineTo(12, -45);
    ctx.lineTo(17, -32);
    ctx.fill();
    ctx.stroke();

    // Ear tips - uses skin patch color
    ctx.fillStyle = patchColor;
    ctx.beginPath();
    ctx.moveTo(-14, -38);
    ctx.lineTo(-12, -45);
    ctx.lineTo(-10, -38);
    ctx.fill();

    ctx.fillStyle = patchLighter;
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

    // Mouth - changes based on expression
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 0);
    
    if (tobyExpression === 'happy') {
        // Big smile!
        ctx.moveTo(-8, 0);
        ctx.quadraticCurveTo(0, 10, 8, 0);
    } else if (tobyExpression === 'sad') {
        // Sad frown
        ctx.moveTo(-6, 5);
        ctx.quadraticCurveTo(0, 0, 6, 5);
    } else {
        // Normal slight smile
        ctx.moveTo(-6, 2);
        ctx.quadraticCurveTo(0, 6, 6, 2);
    }
    ctx.stroke();
    
    // Tears when sad
    if (tobyExpression === 'sad') {
        ctx.fillStyle = '#87CEEB';
        // Left tear
        ctx.beginPath();
        ctx.ellipse(-10, -10, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-11, -4, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right tear
        ctx.beginPath();
        ctx.ellipse(10, -10, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(11, -4, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Sad eyebrows
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -26);
        ctx.lineTo(-4, -24);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, -24);
        ctx.lineTo(12, -26);
        ctx.stroke();
    }
    
    // Blush/rosy cheeks when happy
    if (tobyExpression === 'happy') {
        ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-14, -8, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14, -8, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Whiskers - dark grey (with slight animation)
    const whiskerWiggle = Math.sin(runPhase * 3) * 2;
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-30, -10 + whiskerWiggle);
    ctx.moveTo(-12, -3);
    ctx.lineTo(-30, -3);
    ctx.moveTo(-12, 0);
    ctx.lineTo(-30, 4 - whiskerWiggle);
    ctx.moveTo(12, -6);
    ctx.lineTo(30, -10 - whiskerWiggle);
    ctx.moveTo(12, -3);
    ctx.lineTo(30, -3);
    ctx.moveTo(12, 0);
    ctx.lineTo(30, 4 + whiskerWiggle);
    ctx.stroke();
    
    ctx.restore(); // End head transform

    ctx.restore(); // End main transform

    // Draw name label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('Toby', toby.x, toby.y + 60);
    ctx.shadowBlur = 0;
}

// ============== ACHIEVEMENTS SYSTEM ==============

function unlockAchievement(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement || achievement.unlocked) return;
    
    achievement.unlocked = true;
    newAchievements.push({
        ...achievement,
        id: achievementId,
        unlockedAt: Date.now()
    });
    
    if (soundEnabled) playAchievementSound();
    saveAchievements();
    
    // Check if all achievements unlocked
    checkAllAchievements();
}

function checkTreatAchievements() {
    if (totalTreatsCollected >= 1) unlockAchievement('first_treat');
    if (totalTreatsCollected >= 100) unlockAchievement('treats_100');
    if (totalTreatsCollected >= 500) unlockAchievement('treats_500');
}

function checkWorldAchievements() {
    if (level > 2) unlockAchievement('complete_garden');
    if (level > 4) unlockAchievement('complete_snow');
    if (level > 6) unlockAchievement('complete_park');
    if (level > 8) unlockAchievement('complete_space');
}

function checkAllAchievements() {
    const allUnlocked = Object.values(ACHIEVEMENTS).every(a => a.unlocked);
    if (allUnlocked) {
        // Unlock all skins as reward
        Object.keys(TOBY_SKINS).forEach(skin => {
            TOBY_SKINS[skin].unlocked = true;
        });
        saveSkins();
    }
}

function loadAchievements() {
    const saved = localStorage.getItem('tobyTrekAchievements');
    if (saved) {
        const savedAchievements = JSON.parse(saved);
        Object.keys(savedAchievements).forEach(key => {
            if (ACHIEVEMENTS[key]) {
                ACHIEVEMENTS[key].unlocked = savedAchievements[key];
            }
        });
    }
    
    const savedTreats = localStorage.getItem('tobyTrekTotalTreats');
    if (savedTreats) {
        totalTreatsCollected = parseInt(savedTreats);
    }
}

function saveAchievements() {
    const toSave = {};
    Object.keys(ACHIEVEMENTS).forEach(key => {
        toSave[key] = ACHIEVEMENTS[key].unlocked;
    });
    localStorage.setItem('tobyTrekAchievements', JSON.stringify(toSave));
    localStorage.setItem('tobyTrekTotalTreats', totalTreatsCollected.toString());
}

function playAchievementSound() {
    if (!audioContext) return;
    
    // Triumphant sound
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(audioContext.currentTime + i * 0.1);
        osc.stop(audioContext.currentTime + i * 0.1 + 0.3);
    });
}

// ============== SKINS SYSTEM ==============

function loadSkins() {
    const saved = localStorage.getItem('tobyTrekSkins');
    if (saved) {
        const savedSkins = JSON.parse(saved);
        Object.keys(savedSkins).forEach(key => {
            if (TOBY_SKINS[key]) {
                TOBY_SKINS[key].unlocked = savedSkins[key];
            }
        });
    }
    
    const savedCurrent = localStorage.getItem('tobyTrekCurrentSkin');
    if (savedCurrent && TOBY_SKINS[savedCurrent] && TOBY_SKINS[savedCurrent].unlocked) {
        currentSkin = savedCurrent;
    }
}

function saveSkins() {
    const toSave = {};
    Object.keys(TOBY_SKINS).forEach(key => {
        toSave[key] = TOBY_SKINS[key].unlocked;
    });
    localStorage.setItem('tobyTrekSkins', JSON.stringify(toSave));
    localStorage.setItem('tobyTrekCurrentSkin', currentSkin);
}

function selectSkin(skinId) {
    if (TOBY_SKINS[skinId] && TOBY_SKINS[skinId].unlocked) {
        currentSkin = skinId;
        saveSkins();
        updateSkinDisplay();
    }
}

function unlockSkin(skinId) {
    if (TOBY_SKINS[skinId]) {
        TOBY_SKINS[skinId].unlocked = true;
        saveSkins();
    }
}

// ============== KITTY COINS SYSTEM ==============

function earnKittyCoins(amount) {
    kittyCoins += amount;
    saveKittyCoins();
    updateCoinDisplay();
}

function spendKittyCoins(amount) {
    if (kittyCoins >= amount) {
        kittyCoins -= amount;
        saveKittyCoins();
        updateCoinDisplay();
        return true;
    }
    return false;
}

function saveKittyCoins() {
    localStorage.setItem('tobyTrekKittyCoins', kittyCoins.toString());
}

function loadKittyCoins() {
    const saved = localStorage.getItem('tobyTrekKittyCoins');
    if (saved) {
        kittyCoins = parseInt(saved) || 0;
    }
    updateCoinDisplay();
}

function updateCoinDisplay() {
    const coinDisplay = document.getElementById('kitty-coins-display');
    if (coinDisplay) {
        coinDisplay.textContent = `🪙 ${kittyCoins}`;
    }
}

function purchaseSkin(skinId) {
    const skin = TOBY_SKINS[skinId];
    if (!skin || skin.unlocked) return false;
    
    if (spendKittyCoins(skin.price)) {
        unlockSkin(skinId);
        if (soundEnabled) playCollectSound();
        addFloatingText(`Unlocked ${skin.name}!`, '#FFD700', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        updateSkinDisplay();
        
        // Check if all skins unlocked
        const allUnlocked = Object.values(TOBY_SKINS).every(s => s.unlocked);
        if (allUnlocked) {
            unlockAchievement('all_skins');
        }
        return true;
    }
    return false;
}

function updateSkinDisplay() {
    const container = document.getElementById('skin-selector');
    if (!container) return;
    
    container.innerHTML = Object.entries(TOBY_SKINS).map(([id, skin]) => {
        const isSelected = id === currentSkin;
        const isLocked = !skin.unlocked;
        const canAfford = kittyCoins >= skin.price;
        
        let onClick = '';
        let statusText = '';
        
        if (isLocked) {
            if (canAfford) {
                onClick = `purchaseSkin('${id}')`;
                statusText = `<span class="skin-price affordable">🪙 ${skin.price}</span>`;
            } else {
                statusText = `<span class="skin-price">🪙 ${skin.price}</span>`;
            }
        } else {
            onClick = `selectSkin('${id}')`;
            statusText = isSelected ? '<span class="skin-equipped">✓ Equipped</span>' : '<span class="skin-owned">Owned</span>';
        }
        
        return `
            <div class="skin-option ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${isLocked && canAfford ? 'can-afford' : ''}" 
                 onclick="${onClick}">
                <div class="skin-preview" style="background: ${skin.bodyColor}; border-color: ${skin.patchColor}">
                    ${isLocked ? '🔒' : ''}
                </div>
                <span class="skin-name">${skin.name}</span>
                ${statusText}
            </div>
        `;
    }).join('');
}

// Make purchaseSkin available globally
window.purchaseSkin = purchaseSkin;

// ============== SETTINGS SYSTEM ==============

function loadSettings() {
    const saved = localStorage.getItem('tobyTrekSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        soundEnabled = settings.soundEnabled !== false;
        musicEnabled = settings.musicEnabled !== false;
        currentDifficulty = settings.difficulty || 'normal';
    }
    updateSoundButton();
    updateMusicButton();
    updateDifficultyDisplay();
}

function saveSettings() {
    localStorage.setItem('tobyTrekSettings', JSON.stringify({
        soundEnabled,
        musicEnabled,
        difficulty: currentDifficulty
    }));
}

function setupSettingsControls() {
    // Sound toggle
    const soundBtn = document.getElementById('sound-toggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', toggleSound);
    }
    
    // Music toggle
    const musicBtn = document.getElementById('music-toggle');
    if (musicBtn) {
        musicBtn.addEventListener('click', toggleMusic);
    }
    
    // Pause button
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
    
    // Resume button in pause overlay
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', togglePause);
    }
    
    // Difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setDifficulty(btn.dataset.difficulty);
        });
    });
    
    // Daily challenge button
    const dailyBtn = document.getElementById('daily-challenge-btn');
    if (dailyBtn) {
        dailyBtn.addEventListener('click', startDailyChallenge);
    }
    
    // Skin selector
    updateSkinDisplay();
    
    // Achievements button
    const achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', showAchievements);
    }
    
    // How to Play button
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    if (howToPlayBtn) {
        howToPlayBtn.addEventListener('click', () => togglePanel('how-to-play-panel'));
    }
    
    // Skins button
    const skinsBtn = document.getElementById('skins-btn');
    if (skinsBtn) {
        skinsBtn.addEventListener('click', () => togglePanel('skins-panel'));
    }
}

// Panel toggle function
function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        // Close other panels first
        document.querySelectorAll('.panel').forEach(p => {
            if (p.id !== panelId) {
                p.classList.add('hidden');
            }
        });
        panel.classList.toggle('hidden');
    }
}

// Make togglePanel available globally for inline onclick
window.togglePanel = togglePanel;

function setDifficulty(diff) {
    if (DIFFICULTY_SETTINGS[diff]) {
        currentDifficulty = diff;
        saveSettings();
        updateDifficultyDisplay();
    }
}

function updateDifficultyDisplay() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === currentDifficulty);
    });
}

// ============== DAILY CHALLENGE ==============

function startDailyChallenge() {
    // Generate seed from today's date
    const today = new Date();
    dailyChallengeSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    dailySeed = dailyChallengeSeed;
    dailyChallengeActive = true;
    
    // Start normal game with daily seed
    startGame();
}

function endDailyChallenge() {
    if (dailyChallengeActive && level >= 8) {
        unlockAchievement('daily_complete');
        // Unlock a random skin as daily reward
        const lockedSkins = Object.keys(TOBY_SKINS).filter(k => !TOBY_SKINS[k].unlocked);
        if (lockedSkins.length > 0) {
            const randomSkin = lockedSkins[Math.floor(Math.random() * lockedSkins.length)];
            unlockSkin(randomSkin);
            addFloatingText(`Unlocked: ${TOBY_SKINS[randomSkin].name}!`, '#FFD700', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
    }
    dailyChallengeActive = false;
}

// ============== ACHIEVEMENTS DISPLAY ==============

function showAchievements() {
    const modal = document.getElementById('achievements-modal');
    if (modal) {
        updateAchievementsDisplay();
        modal.classList.remove('hidden');
    }
}

function hideAchievements() {
    const modal = document.getElementById('achievements-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function updateAchievementsDisplay() {
    const container = document.getElementById('achievements-list');
    if (!container) return;
    
    const unlockedCount = Object.values(ACHIEVEMENTS).filter(a => a.unlocked).length;
    const totalCount = Object.keys(ACHIEVEMENTS).length;
    
    document.getElementById('achievements-progress').textContent = `${unlockedCount}/${totalCount}`;
    
    container.innerHTML = Object.entries(ACHIEVEMENTS).map(([id, ach]) => `
        <div class="achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}">
            <span class="achievement-icon">${ach.unlocked ? ach.icon : '🔒'}</span>
            <div class="achievement-info">
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.unlocked ? ach.description : '???'}</div>
            </div>
        </div>
    `).join('');
}

// Initialize when page loads
window.addEventListener('load', init);
