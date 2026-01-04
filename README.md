# 🐱 Toby Trek - The Cat Game

A browser-based endless runner game created in memory of our beloved cat **Toby** (2026). Built entirely through "vibe coding" with AI assistance.

**Current Version:** v1.1.1

## 🎮 Play the Game

Simply open `index.html` in any modern web browser to play! Works on desktop and mobile devices.

**🌐 Play Online:** [GitHub Pages Link] *(if deployed)*

### Controls
- **← / →** Arrow keys or **A / D** keys to move Toby
- **SPACE** to throw punches (boss battles)
- **P** or **ESC** to pause the game
- **M** to toggle sound mute
- On mobile: Use buttons to move, 👊 to throw punches

## 🌟 Features

### Gameplay
- **4 Themed Worlds** that cycle every 2 levels:
  - 🌿 **Garden** (Levels 1-2): Sunny garden with flowers and hedges
  - ❄️ **Snow** (Levels 3-4): Winter wonderland with pine trees and mountains
  - 🎢 **Park** (Levels 5-6): Playground with swings, slides, and trees
  - 🚀 **Space** (Levels 7-8): Deep space with stars, planets, and nebulae

- **🏰 Boss Battles Every 6 Levels!**
  - Face **4 different bosses** in a dark, stormy castle:
    - 😼 **Dave the Angry Cat** - The original fierce feline
    - 🧹 **Big Bad Hoover** - A menacing vacuum cleaner
    - 🥒 **Creepy Crazy Cucumber** - An evil sentient vegetable
    - 🐕 **Dangerous Dougie the Dog** - The final "big boss" puppy!
  - Collect 👊 punch power-ups during normal levels
  - Throw punches to defeat the boss and earn big bonus points!
  - Earn **50 Kitty Coins** per boss defeated!

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
| 👊 Punch | Boss Ammo | Collect to throw at bosses! |

### Items
| Item | Type | Effect |
|------|------|--------|
| 🍗 Chicken | Treat | +15 points, restores energy |
| 🥫 Tuna Can | Treat | +20 points, restores energy |
| 💨 Hair Dryer | Hazard | -10 points, drains energy |
| 💧 Puddle | Hazard | -10 points, drains energy |

### � Boss Battles
Every 6 levels (6, 12, 18...), Toby faces one of **4 rotating bosses** in a spooky castle!

| Boss | Name | Description |
|------|------|-------------|
| 😼 | Dave the Angry Cat | The original fierce feline with sharp claws |
| 🧹 | Big Bad Hoover | A menacing vacuum with glowing red eyes |
| 🥒 | Creepy Crazy Cucumber | An evil veggie with spinning spiral eyes |
| 🐕 | Dangerous Dougie | The "big boss" puppy with extra health! |

- Boss has a health bar that increases with each encounter
- Press **SPACE** to throw collected punches
- Dodge the hairdryers the boss throws at you
- Defeat the boss for **500+ bonus points**!

### Achievements (16 total)
Unlock achievements for milestones like:
- 🏆 Collecting treats (1, 100, 500)
- 🔥 Getting combos (5x, 10x)
- ⭐ Reaching score milestones (1000, 5000)
- 🌍 Completing each world
- ✨ Perfect levels (no damage)
- 📅 Daily challenges
- 😼 **Boss Slayer** - Defeat the angry black cat
- 🏰 **Boss Master** - Defeat 3 bosses

### 🪙 Kitty Coins & Shop
Earn **Kitty Coins** to purchase items in the shop:
- **1 coin** per treat collected
- **10 coins** per level completed
- **50 coins** per boss defeated

### 🏪 Kitty Shop
The shop features **3 categories** with sorting options and preview animations:

#### 🐱 Character Skins
| Skin | Price | Colors |
|------|-------|--------|
| Classic Toby | Free | White/Black |
| Golden Toby | 100 🪙 | Gold/Brown |
| Midnight Toby | 150 🪙 | Dark Blue |
| Rainbow Toby | 200 🪙 | Pink/Purple |
| Space Toby | 250 🪙 | Purple/Cyan |
| Tiger Toby | 300 🪙 | Orange/Brown |
| Ghost Toby | 350 🪙 | Light Gray |
| Neon Toby | 400 🪙 | Green/Magenta |

#### 🎀 Accessories
| Accessory | Price | Description |
|-----------|-------|-------------|
| Royal Crown 👑 | 150 🪙 | Feel like royalty! |
| Cute Bow 🎀 | 75 🪙 | Pretty in pink! |
| Top Hat 🎩 | 125 🪙 | Very distinguished! |
| Cool Shades 😎 | 100 🪙 | Too cool for school! |
| Flower Crown 🌸 | 80 🪙 | Spring vibes! |
| Angel Halo 😇 | 200 🪙 | Heavenly kitty! |

#### ⚡ Power-up Boosts (Consumables)
| Power-up | Price | Effect |
|----------|-------|--------|
| Extra Life ❤️ | 50 🪙 | Start with +20 energy |
| Head Start 🚀 | 75 🪙 | Begin at level 2 |
| Coin Magnet 🧲 | 100 🪙 | Double coin earnings |
| Lucky Charm 🍀 | 125 🪙 | More power-up spawns |

### 📊 Difficulty Score Multipliers
Choose your challenge level - harder difficulties earn more points!
| Difficulty | Speed | Score Multiplier |
|------------|-------|------------------|
| Easy | Slower | 0.5x points |
| Normal | Standard | 1x points |
| Hard | Faster | 2x points |

### Audio
- **Atmospheric Music**: Each world has unique ambient soundtrack
- **Sound Effects**: Collect sounds, hit sounds, shield effects, level complete fanfare
- **Voice Sounds**: "Yey!" for treats, "Oww!" for hazards

### Visual Effects
- **Animated Toby**: Running legs, bobbing body, wagging tail
- **Particle Effects**: Sparkles when collecting items
- **Screen Shake**: Impact feedback when hitting hazards
- **Floating Text**: Combo counters, damage indicators

## 🛠️ Technical Details

- **Pure JavaScript** - No frameworks or dependencies
- **HTML5 Canvas** - All graphics drawn programmatically
- **Web Audio API** - Procedurally generated music and sound effects
- **Responsive Design** - Full mobile support with touch controls
- **localStorage** - Saves local leaderboard, achievements, settings, and skins
- **Firebase Realtime Database** - Global leaderboard shared across all players

## 🌐 Global Leaderboard

Compete with players worldwide! High scores are saved to Firebase and sync in real-time across all devices. See the 🌐 indicator for global leaderboard status, or 💾 for local-only mode.

## 📁 Project Structure

```
TobyTrekGame/
├── index.html          # Main HTML file (includes Firebase SDK)
├── styles.css          # Game styling
├── game.js             # Game logic and rendering
├── CHANGELOG.md        # Version history
├── Claude_Opus_Prompts.md  # AI prompts used to create the game
└── README.md           # This file
```

## 🎨 About Toby

Toby was a white cat with grey and black markings, featuring distinctive yellow-green eyes. This game captures his spirit - running through gardens, avoiding things cats dislike (water and loud hairdryers!), and collecting tasty treats.

## 📜 Version History

- **v0.9.6** - Multiple Bosses: 4 unique boss types (Dave, Hoover, Cucumber, Dougie), boss indicator auto-hide fix
- **v0.9.5** - Running Animation: Animated legs, body bobbing, tail wagging, whisker wiggle
- **v0.9.4** - Gameplay Fixes: Improved music, easier difficulty, boss every 6 levels, mobile energy bar fix, mobile punch button
- **v0.9.3** - Kitty Coins: Currency system, shop interface, 3 new skins (Tiger, Ghost, Neon)
- **v1.0.1** - Mobile UX: Moved touch controls and energy bar higher for better portrait mode play
- **v1.0.0** - Major Release: Redesigned Kitty Shop with categories, accessories, power-up boosts, difficulty multipliers
- **v0.9.8** - iOS Safari fixes, puddle graphic improvement
- **v0.9.2** - Modern UI: Dark theme, collapsible panels, cleaner home screen
- **v0.9.1** - Global Leaderboard: Firebase integration for worldwide high scores, real-time updates
- **v0.9.0** - Boss Battle System: Angry black cat boss, castle world, punch combat, new achievements
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

Copyright (c) 2026 - Jessica, Emily and Abigail Bird

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