# 🐱 Toby Trek - The Cat Game

A browser-based endless runner game created in memory of our beloved cat **Toby** (2026). Built entirely through "vibe coding" with AI assistance.

## 🎮 Play the Game

Simply open `index.html` in any modern web browser to play!

### Controls
- **← / →** Arrow keys to move Toby left and right
- Collect treats, avoid hazards, and survive as long as you can!

## 🌟 Features

### Gameplay
- **4 Themed Worlds** that cycle every 2 levels:
  - 🌿 **Garden** (Levels 1-2): Sunny garden with flowers and hedges
  - 🎢 **Park** (Levels 3-4): Playground with swings, slides, and trees
  - 🚀 **Space** (Levels 5-6): Deep space with stars, planets, and nebulae
  - ❄️ **Snow** (Levels 7-8): Winter wonderland with pine trees and mountains

- **3D Tunnel Perspective**: Objects approach from the horizon creating depth
- **Speed Up Challenge**: Game accelerates halfway through each level
- **Energy System**: Collect treats to maintain energy, or Toby gets tired!
- **Shield Power-up**: Temporary protection bubble (🛡️)

### Items
| Item | Type | Effect |
|------|------|--------|
| 🍗 Chicken | Treat | +15 points, restores energy |
| 🐟 Nice Fish | Treat | +20 points, restores energy |
| 🦴 Fish Skeleton | Hazard | -10 points, drains energy |
| 💧 Puddle | Hazard | -10 points, drains energy |
| 🛡️ Shield | Power-up | 5 seconds of protection |

### Audio
- **Atmospheric Music**: Each world has unique ambient soundtrack
- **Sound Effects**: Collect sounds, hit sounds, shield effects, level complete fanfare

## 🛠️ Technical Details

- **Pure JavaScript** - No frameworks or dependencies
- **HTML5 Canvas** - All graphics drawn programmatically
- **Web Audio API** - Procedurally generated music and sound effects
- **Responsive Design** - Adapts to different screen sizes

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

Toby was a white cat with grey and black markings, featuring distinctive yellow-green eyes. This game captures his spirit - running through gardens, avoiding things cats dislike (water and bad fish!), and collecting tasty treats.

## 📜 Version History

- **v0.3.0** - Added Snow world, fish skeleton & nice fish items, yellow-green eyes, atmospheric music
- **v0.2.0** - Added Park & Space worlds, shield power-up, level completion system
- **v0.1.0** - Initial release with Garden world

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## 🤖 Created With AI

This game was created as a "vibe coding" experiment - using AI (GitHub Copilot with Claude) to generate all code from natural language prompts. See `Claude_Opus_Prompts.md` for the conversation that built this game.

## 📄 License

Created with ❤️ in memory of Toby (2026)