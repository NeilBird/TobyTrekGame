# 🐱 Toby Trek - The Cat Game

A browser-based endless runner game created in memory of our beloved cat **Toby** (2026). Built entirely through "vibe coding" with AI assistance.

## 🎮 Play the Game

Simply open `index.html` in any modern web browser to play! Works on desktop and mobile devices.

### Controls
- **← / →** Arrow keys or **A / D** keys to move Toby
- **P** or **ESC** to pause the game
- **M** to toggle sound mute
- On mobile: Tap screen sides or use on-screen buttons

## 🌟 Features

### Gameplay
- **4 Themed Worlds** that cycle every 2 levels:
  - 🌿 **Garden** (Levels 1-2): Sunny garden with flowers and hedges
  - ❄️ **Snow** (Levels 3-4): Winter wonderland with pine trees and mountains
  - 🎢 **Park** (Levels 5-6): Playground with swings, slides, and trees
  - 🚀 **Space** (Levels 7-8): Deep space with stars, planets, and nebulae

- **3D Tunnel Perspective**: Objects approach from the horizon creating depth
- **Speed Up Challenge**: Game accelerates halfway through each level
- **Energy System**: Collect treats to maintain energy, or Toby gets tired!
- **Combo System**: Chain treat collections for bonus points!
- **Difficulty Settings**: Easy, Normal, or Hard mode
- **Daily Challenge**: Same obstacle patterns each day for competitive play

### Power-Ups
| Item | Type | Effect |
|------|------|--------|
| 🛡️ Shield | Protection | 5 seconds of invincibility |
| ⚡ Speed Boost | Movement | Faster movement for 5 seconds |
| 🧲 Magnet | Attraction | Attracts treats towards Toby for 8 seconds |
| ✨ Double Points | Bonus | 2x points for 10 seconds |

### Items
| Item | Type | Effect |
|------|------|--------|
| 🍗 Chicken | Treat | +15 points, restores energy |
| 🥫 Tuna Can | Treat | +20 points, restores energy |
| 💨 Hair Dryer | Hazard | -10 points, drains energy |
| 💧 Puddle | Hazard | -10 points, drains energy |

### Achievements
Unlock achievements for milestones like:
- 🏆 Collecting treats (1, 100, 500)
- 🔥 Getting combos (5x, 10x)
- ⭐ Reaching score milestones (1000, 5000)
- 🌍 Completing each world
- ✨ Perfect levels (no damage)
- 📅 Daily challenges

### Character Skins
Unlock and customize Toby with different skins:
- Classic Toby (default)
- Golden Toby
- Midnight Toby
- Rainbow Toby
- Space Toby

### Audio
- **Atmospheric Music**: Each world has unique ambient soundtrack
- **Sound Effects**: Collect sounds, hit sounds, shield effects, level complete fanfare
- **Voice Sounds**: "Yey!" for treats, "Oww!" for hazards

### Visual Effects
- **Particle Effects**: Sparkles when collecting items
- **Screen Shake**: Impact feedback when hitting hazards
- **Floating Text**: Combo counters, damage indicators

## 🛠️ Technical Details

- **Pure JavaScript** - No frameworks or dependencies
- **HTML5 Canvas** - All graphics drawn programmatically
- **Web Audio API** - Procedurally generated music and sound effects
- **Responsive Design** - Full mobile support with touch controls
- **localStorage** - Saves leaderboard, achievements, settings, and skins

## 📁 Project Structure

```
TobyTrekGame/
├── index.html          # Main HTML file
├── styles.css          # Game styling
├── game.js             # Game logic and rendering
├── CHANGELOG.md        # Version history
├── Claude_Opus_Prompts.md  # AI prompts used to create the game
└── README.md           # This file
```

## 🎨 About Toby

Toby was a white cat with grey and black markings, featuring distinctive yellow-green eyes. This game captures his spirit - running through gardens, avoiding things cats dislike (water and loud hairdryers!), and collecting tasty treats.

## 📜 Version History

- **v0.8.0** - Major feature update: Particle effects, screen shake, combo system, new power-ups (speed, magnet, double points), pause, sound/music toggles, difficulty settings, achievements, character skins, daily challenges
- **v0.7.0** - Mobile support, dynamic scenery, "Oww!" sound
- **v0.6.0** - Leaderboard, player names, voice sounds, side scenery
- **v0.5.0** - Toby's expressions (happy/sad)
- **v0.4.0** - Tuna can, world reordering

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## 🤖 Created With AI

This game was created as a "vibe coding" experiment - using AI (GitHub Copilot with Claude) to generate all code from natural language prompts. See `Claude_Opus_Prompts.md` for the conversation that built this game.

## 📄 License

This project is licensed under the **MIT License** - see below for details.

Created with ❤️ in memory of Toby (2026)

---

MIT License

Copyright (c) 2026 Emily Bird

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.