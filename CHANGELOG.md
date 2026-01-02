# Changelog

All notable changes to Toby Trek will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
