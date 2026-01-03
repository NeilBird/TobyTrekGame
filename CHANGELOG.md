# Changelog

All notable changes to Toby Trek will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.2] - 2026-01-03

### Changed
- **Modern Home Screen Redesign** - Cleaner, less cluttered interface
  - Dark elegant theme with glassmorphism effects
  - Collapsible "How to Play" panel (hidden by default)
  - Collapsible "Skins" panel
  - Streamlined setup row (name + difficulty in one line)
  - Larger, more prominent Play button
  - Quick action buttons for Help, Achievements, Skins
  - Settings icons moved to top-right corner
  - Compact leaderboard with modern styling

---

## [0.9.1] - 2026-01-03

### Added
- **Global Leaderboard** - Compete with players worldwide!
  - 🌐 Firebase Realtime Database integration
  - Real-time score updates - see new high scores instantly
  - Global vs Local indicator shows connection status
  - Scores sync across all players and devices
  - XSS protection on player names
  - Graceful fallback to local storage if Firebase unavailable

---

## [0.9.0] - 2026-01-03

### Added
- **Boss Battle System** - Epic boss fights every 10 levels!
  - 😼 **Angry Black Cat Boss**: A menacing boss in a dark castle
  - 🏰 **Castle World**: New dark, stormy castle environment with:
    - Gothic stone architecture
    - Glowing torches with animated flames
    - Lightning effects in the stormy sky
    - Ominous atmosphere
  
- **Combat Mechanics**:
  - 👊 **Punch Power-ups**: Collect fists during normal levels as ammo
  - Press **SPACE** to throw punches at the boss
  - Boss health bar with damage feedback
  - Boss moves and attacks with increasing difficulty
  - Boss throws hazards (hairdryers) at Toby
  - 5 bonus punches given if player reaches boss with too few

- **Boss Progression**:
  - Boss appears every 10 levels (Level 10, 20, 30, etc.)
  - Each boss has more health than the last
  - Boss speed increases with each encounter
  - Big score bonus (500+ points) for defeating boss

- **New Achievements**:
  - 😼 **Boss Slayer**: Defeat the angry black cat boss
  - 🏰 **Boss Master**: Defeat 3 bosses

- **Visual Enhancements**:
  - Angry black cat with glowing red eyes and sharp claws
  - Animated tail swishing and raised threatening paws
  - Hit flash effect when boss takes damage
  - Defeated boss animation
  - Punch projectiles with motion trail effect
  - Boss health bar with color-coded health status

- **Audio**:
  - Ominous boss music when battle starts
  - Punch throwing sound effect
  - Boss hit sound effect
  - Victory fanfare when boss is defeated

### Changed
- Updated instructions to mention boss battles and punch power-up
- Updated subtitle to "A 4-World Adventure + Boss Battles!"

---

## [0.8.0] - 2026-01-02

### Added
- **Particle Effects System** - Visual feedback for all interactions:
  - ✨ Sparkles when collecting treats and power-ups
  - 💦 Splash particles when hitting puddles
  - ⚡ Spark particles when hitting hairdryer
  - Particles fade and fall with gravity

- **Screen Shake Effect** - Impact feedback:
  - Brief shake when Toby hits hazards
  - Intensity and duration based on damage

- **Combo System** - Chain collections for bonus points:
  - 🔥 Combo counter increases with consecutive treats
  - Combo bonus adds to score
  - 2-second window to continue combo
  - Combo resets when hit by hazard

- **New Power-Ups**:
  - ⚡ **Speed Boost**: 50% faster movement for 5 seconds
  - 🧲 **Magnet**: Attracts treats towards Toby for 8 seconds
  - ✨ **Double Points**: 2x points on all collectibles for 10 seconds
  - All power-ups show countdown timers on screen

- **Sound Toggle** - Mute controls:
  - 🔊 Sound effects toggle button
  - 🎵 Background music toggle button
  - Press M to quick-toggle mute
  - Settings saved between sessions

- **Difficulty Settings** - Choose your challenge:
  - 🟢 **Easy**: Slower speed, slower energy decay
  - 🟡 **Normal**: Standard gameplay
  - 🔴 **Hard**: Faster speed, faster energy decay, quicker spawns

- **Achievements System** - 14 unlockable achievements:
  - 🍖 First Bite: Collect first treat
  - 🔥 Combo King/Master: Get 5x/10x combos
  - 🏆 Treat Collector/Hoarder: 100/500 total treats
  - 🌸❄️🎢🚀 World completions
  - ✨ Untouchable: Complete level without damage
  - ⭐🌟 Score milestones (1000/5000)
  - 📅 Daily Warrior: Complete daily challenge
  - 🎨 Fashion Cat: Unlock all skins
  - Achievement notifications slide in when unlocked

- **Daily Challenge Mode**:
  - 📅 Same obstacle patterns for all players each day
  - Seeded random generation from date
  - Complete all 8 levels to earn rewards
  - Unlocks random skin on completion

- **Character Skins** - Customize Toby:
  - 🐱 Classic Toby (default, unlocked)
  - ✨ Golden Toby (unlock via achievements)
  - 🌙 Midnight Toby (unlock via achievements)
  - 🌈 Rainbow Toby (unlock via achievements)
  - 🚀 Space Toby (unlock via achievements)
  - Skin selector on home screen

- **Pause Feature**:
  - ⏸️ Pause button in HUD
  - Press ESC or P to pause/resume
  - Overlay shows pause state
  - Music stops when paused

- **Achievements Modal**:
  - View all achievements and progress
  - Shows locked/unlocked status
  - Progress counter (X/14)

### Changed
- Improved HUD with pause button
- Power-up indicators show remaining time
- All sounds now respect sound toggle setting
- Difficulty affects spawn rates and energy decay

### Fixed
- Energy decay now applies difficulty multiplier
- Level completion properly tracks damage for achievement

---

## [0.7.0] - 2026-01-02

### Added
- **Mobile Touch Controls** - Full mobile device support:
  - 📱 On-screen left/right arrow buttons for touch devices
  - 👆 Tap anywhere on screen to move (left half = move left, right half = move right)
  - 👉 Swipe gestures for continuous movement
  - Auto-detected on touch devices and small screens
  - Responsive layout that fills the screen on mobile

- **Dynamic Moving Scenery** - Static decorations now move with the game:
  - 🌸 **Garden World**: Detailed 6-petal flowers with stems/leaves, apple trees
  - 🌲 **Snow World**: Snow-covered pine trees, sparkling snow drifts
  - 🌳 **Park World**: Large leafy trees with roots, playground swing sets
  - ⭐ **Space World**: Twinkling star clusters, colorful ringed planets
  - All scenery scales and moves toward player for immersive 3D effect

### Changed
- **"Oww!" Pain Sound** - Changed from "Eeew" to "Oww":
  - New descending pain sound (500Hz → 200Hz → 150Hz)
  - More appropriate reaction when Toby hits hazards
  - Floating text now shows "Oww!" instead of "Eeew!"

### Improved
- Better visual variety with randomized flower colors
- Touch controls prevent page scrolling on mobile
- Full-screen game canvas on mobile devices

---

## [0.6.0] - 2026-01-02

### Added
- **Player Name Input** - Players can now enter their name before starting:
  - Input field on the home screen
  - Defaults to "Player 1" if left empty
  - Name is saved with high scores

- **Leaderboard System** - Top 10 high scores saved locally:
  - 🥇🥈🥉 Medal icons for top 3 positions
  - Displays player name and score
  - Persists between sessions using localStorage
  - Shown on home screen

- **Voice Sounds** - Toby now makes sounds when interacting:
  - 🎵 **"Yey!"** sound when eating treats or collecting shields
  - 🎵 **"Eeew!"** sound when hitting hazards
  - Cheerful rising tone for positive interactions
  - Descending disgusted tone for negative interactions

- **Moving Side Scenery** - Decorative objects move along the path borders:
  - 🌿 **Garden World**: Flower bushes, garden gnomes, butterflies, bird baths
  - ❄️ **Snow World**: Snowmen, grit bins, snow-covered lamp posts, ice cat sculptures
  - 🎢 **Park World**: Park benches, lamp posts, trash bins, flying birds
  - 🚀 **Space World**: Tumbling asteroids, satellites, glowing alien plants, space rocks
  - Objects spawn randomly on left/right sides
  - Scale and move toward the player for 3D depth effect

### Changed
- **Energy Reset** - Toby's energy now resets to FULL at the start of each level (was +20)
- Updated floating text messages: "Yey!" for shields, "Eeew!" for hazards, "Blocked!" when shield protects
- Minor UI improvements

---

## [0.5.0] - 2026-01-02

### Added
- **Toby's Expressions** - Toby now shows emotions when interacting with items:
  - 😊 **Happy Expression** when collecting treats (Chicken or Tuna):
    - Big smile on his face
    - Rosy pink blush on cheeks
    - Floating "Yum yum!" text in gold
  - 😢 **Sad Expression** when hitting hazards (Hair Dryer or Puddle):
    - Downturned frown
    - Sad eyebrows
    - Blue tear drops falling from eyes
    - Floating "Ouch!" text in red
  - 🛡️ **Protected** feedback when shield blocks a hazard:
    - Floating "Protected!" text in blue
- Expressions last for 1 second before returning to normal
- Floating text animates upward and fades out smoothly

---

## [0.4.0] - 2026-01-02

### Changed
- **Tuna Can** (🥫) replaces Nice Fish as the good treat item:
  - Detailed metallic can with silver gradient
  - Blue label with wave pattern and "TUNA" text
  - Small fish icon on label
  - Pull tab on top
  - Realistic shine highlights
- **Hair Dryer** restored as the bad item (reverted from Fish Skeleton):
  - Pink hairdryer with detailed design
  - Handle, nozzle, air blast lines
  - Power button and vent holes
- **World order reorganized**:
  - 🌿 Garden (Levels 1-2) - unchanged
  - ❄️ Snow (Levels 3-4) - moved earlier
  - 🎢 Park (Levels 5-6) - moved later
  - 🚀 Space (Levels 7-8) - now the final world

---

## [0.3.0] - 2026-01-02

### Added
- **Snow World** - Fourth themed world added after Space:
  - ❄️ Winter sky with gradient blues and pale horizon
  - Snow-capped mountains in the background
  - Animated falling snowflakes
  - Pine trees covered in snow along the path borders
  - Snow drifts with realistic shading
  - Sparkling snow path texture
- **Nice Fish** (🐟) - New treat item replacing Shrimp:
  - Beautifully detailed healthy fish graphic
  - Blue/teal gradient body with shimmer
  - Fins, scales pattern, and happy expression
  - Bubbles effect for realism

### Changed
- **World progression** now cycles through 4 worlds with 2 levels each:
  - 🌿 Garden (Levels 1-2)
  - 🎢 Park (Levels 3-4)
  - 🚀 Space (Levels 5-6)
  - ❄️ Snow (Levels 7-8)
- **Fish Skeleton** (🦴) replaces Hair Dryer as bad item:
  - Detailed skeleton graphic with bones, ribs, and spine
  - Spooky red eye for warning effect
  - Jaw with teeth details
  - More thematically appropriate for a cat game
- **Toby's eyes** updated to yellow/green color:
  - Radial gradient from yellow-green center to darker green edge
  - Vertical slit pupils for realistic cat appearance
  - Applied to all Toby graphics (game, start screen, game over)
- **Music completely redesigned** to be more atmospheric and cinematic:
  - Slower, more melodic compositions
  - Sine waves and filtered sounds instead of harsh square waves
  - Ambient pad layers for depth
  - World-specific themes:
    - Garden: Peaceful, nature-inspired minor key
    - Park: Adventurous, slightly tense
    - Space: Cosmic, mysterious ambient
    - Snow: Calm, crystalline, shimmering high pads
  - Longer loop duration (6 seconds) for less repetition
  - Lower volume and softer attack for pleasant listening

### Fixed
- Reduced overall game sound harshness with audio filtering
- Improved visual consistency across all game screens

---

## [0.2.0] - 2026-01-02

### Added
- **Three themed worlds** that cycle every 3 levels:
  - 🌻 **Garden** (Levels 1-3): Bright sunny day with flowers and hedges
  - 🎢 **Park** (Levels 4-6): Playground with swing sets, slides, trees, and bushes
  - 🚀 **Space** (Levels 7-9): Deep space with twinkling stars, planets, moon, and Saturn-like rings
- **Shield power-up** (🛡️):
  - 5% spawn chance when no shield is active
  - Provides 5 seconds of protection from hazards
  - Visual bubble effect around Toby with pulsing animation
  - Countdown timer displayed on screen
  - Bubble pop sound effect when shield expires
  - Magical sparkle sound when collected
- **Level completion system**:
  - Each level now explicitly completes with celebration screen
  - "Level X Complete!" message with fanfare sound
  - Preview of next world when transitioning
  - Brief pause between levels
- **World-specific music**:
  - Garden: Happy major key melody with bright chiptune feel
  - Park: Playful bouncy melody with fun arpeggios
  - Space: Mysterious ethereal pads and sine waves

### Changed
- **Hairdryer redesign**: Now shows actual pink hairdryer graphic instead of wind emoji
  - Detailed design with handle, body, nozzle, air blast lines
  - Pink color scheme with proper vents and power button
- **Flowers completely redesigned** with much more detail:
  - Multi-petal flowers (5-6 petals per flower)
  - Stems and leaves
  - Highlighted petals with 3D effect
  - Detailed yellow centers with orange dots
  - More variety in colors (7 different colors)
- **Game over screen** now shows correct white/grey/black Toby SVG
  - Sad expression with droopy eyebrows and frown
  - Consistent with start screen design
- **Music system improved**:
  - Different melodies per world
  - Added harmony/arpeggio layers
  - Better bass lines with variation
  - Space world uses ethereal sine wave pads

### Fixed
- Toby now appears with correct white/grey/black colors on game over screen
- Hairdryer no longer looks like a "cloud of gas"

---

## [0.1.0] - 2026-01-02

### Added
- Initial game release - "Toby Trek: A Garden Adventure"
- Player character: Toby the cat (white with black and grey markings)
- 3D tunnel/perspective view with objects approaching the player
- Beautiful garden background featuring:
  - Blue sky with gradient
  - Bright sun with glow effect
  - Fluffy white clouds
  - Green grass path with perspective shading
  - Colorful flower borders (pink, yellow, red, purple, orange)
  - Garden hedges on both sides
- Two collectible treats:
  - 🍗 Chicken Leg (+15 points, +energy)
  - 🦐 Shrimp (+20 points, +energy)
- Two hazards to avoid:
  - 💨 Hairdryer (-10 points, -energy)
  - 💧 Puddle (-10 points, -energy)
- Energy system that depletes over time
- Score tracking with level multiplier
- Level progression system (30 seconds per level)
- Speed increase at 50% of each level with visual indicator
- Play timer showing total time played (MM:SS format)
- Background chiptune music using Web Audio API
- Sound effects for collecting treats and hitting hazards
- Keyboard controls (Arrow keys or A/D)
- Start screen with instructions and legend
- Game over screen showing final stats (time, score, level)
- Responsive HUD with score, energy bar, level, and timer

### Game Balance
- Slower initial speed (0.008) for comfortable gameplay
- Gentle speed-up effect when level progresses past halfway
- Balanced energy gain (+15) and loss (-20) mechanics
- Progressive difficulty with each level

---

## In Memory of Toby 🐱

This game was created on January 2nd, 2026, in loving memory of Toby the cat.
Created by Emily Bird as a first experience with "Vibe Coding" using AI assistance.

*"Toby Trek" - helping Toby run through the garden forever* 💕
