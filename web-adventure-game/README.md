# 🗡️ SCRIPTORIA - Text Adventure Game 🗡️

## 📖 Game Story

Welcome to **Scriptoria**, a mysterious land filled with ancient magic, forgotten treasures, and dangerous creatures. You are a brave adventurer who has stumbled upon this enchanted realm, and now you must explore its secrets, battle fierce enemies, and collect valuable treasures to prove your worth.

The land of Scriptoria consists of five mystical locations:
- **Forest Entrance** - Your starting point, where a wise hermit offers guidance
- **Ancient Ruins** - Crumbling structures protected by goblins and guardians
- **Hidden Cave** - A dark cavern where shadow beasts lurk
- **Mystical Grove** - A magical clearing with silver trees
- **Treasure Chamber** - The heart of Scriptoria, where the greatest treasures await

## 🎮 Gameplay Mechanics

### Character System
- **Health Points (HP)**: Your life force - when it reaches 0, the game ends
- **Attack Power**: Determines how much damage you deal in combat
- **Inventory**: Stores items you collect during your adventure

### Item Types
- **🗡️ Weapons**: Increase your attack power permanently
- **🧪 Healing**: Restore your health when picked up
- **🗝️ Quest Items**: Special items needed for progression
- **💎 Treasures**: Valuable items that contribute to winning the game

### Combat System
- Turn-based combat where you and enemies alternate attacks
- Damage is randomized based on attack power
- Some characters are friendly and shouldn't be attacked
- Defeated enemies may drop valuable items

### Win Conditions
- Collect 2 or more treasure items to win the game
- Survive encounters with dangerous creatures
- Explore all locations to find hidden secrets

## 🕹️ How to Play

### Starting the Game
1. Open `index.html` in your web browser
2. Click the "Start Game" button
3. Use the browser prompts to enter commands

### Available Commands

#### Movement
- `move [location name]` or `go [location name]` - Travel to connected locations
- `look` or `examine` - Look around your current location

#### Items
- `pick [item name]` or `take [item name]` - Pick up items
- `search` - Search for hidden items (30% chance to find secrets)
- `inventory` or `inv` - View items in your possession

#### Combat & Interaction
- `attack [character name]` or `fight [character name]` - Engage in combat
- `talk [character name]` or `speak [character name]` - Communicate with NPCs

#### Information
- `status` or `health` - Check your current health and stats
- `locations` - List all locations you've visited
- `help` - Display all available commands

### Example Commands
```
move ancient ruins
pick iron sword
attack goblin warrior
talk wise hermit
search
inventory
```

## 🛠️ Technical Implementation

### JavaScript Classes Used
- **Character Class**: Manages player and NPC attributes, combat, and inventory
- **Item Class**: Represents all items with types and values
- **Location Class**: Handles areas, connections, and location-based actions
- **Game Class**: Controls overall game state and command processing

### Lodash Integration
The game uses the Lodash library for efficient data management:
- `_.filter()` - Find alive characters and specific item types
- `_.find()` - Locate specific characters and items by name
- `_.pull()` - Remove items from locations when picked up
- `_.sortBy()` - Sort characters by health or other attributes
- `_.groupBy()` - Organize inventory items by type
- `_.maxBy()` - Find strongest characters

### Game Features
- **Dynamic Combat System**: Turn-based with randomized damage
- **Interactive Dialogue**: NPCs provide hints and story elements
- **Hidden Items**: Secret discoveries through searching
- **Progressive Difficulty**: Enemies get stronger in later areas
- **Visual Interface**: Retro terminal-style design with health bars

## 📁 File Structure
```
game/
├── index.html          # Main HTML file with game interface
├── app.js             # Complete JavaScript implementation
└── README.md          # This documentation file
```

## 🚀 Getting Started

1. **Clone or download** the game files
2. **Open `index.html`** in any modern web browser
3. **Click "Start Game"** to begin your adventure
4. **Enter commands** in the browser prompts to play

No additional setup or installation required! The game runs entirely in the browser.

## 🎯 Tips for Success

1. **Talk to the Wise Hermit** at the Forest Entrance for valuable guidance
2. **Search every location** to find hidden treasures and items
3. **Pick up weapons** early to increase your combat effectiveness
4. **Use healing potions** strategically during tough battles
5. **Explore thoroughly** - some areas connect in unexpected ways
6. **Be strategic** about which enemies to fight first

## 🏆 Victory Conditions

- **Primary Goal**: Collect 2 treasure items to achieve victory
- **Secondary Goals**: Defeat all enemies and explore every location
- **Survival**: Keep your health above 0 throughout the adventure

## 🎮 Game Statistics Tracked

- Treasures found
- Enemies defeated
- Locations visited
- Current health and attack power
- Inventory contents

## 🔧 Technical Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for Lodash CDN)
- No additional software or plugins required

## 🌟 Advanced Features

- **Dynamic item drops** from defeated enemies
- **Random hidden item discovery** through searching
- **Health visualization** with ASCII health bars
- **Contextual responses** based on game state
- **Multiple ending scenarios** based on player choices

---

**Enjoy your adventure in Scriptoria!** 🗡️✨

*Created as a demonstration of JavaScript classes, objects, and library integration.*