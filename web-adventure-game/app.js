// Scriptoria - Text Adventure Game
// Using JavaScript classes, objects, and lodash library

// ===============================
// GAME CLASSES
// ===============================

class Character {
    constructor(name, health, attackPower, isPlayer = false) {
        this.name = name;
        this.health = health;
        this.maxHealth = health;
        this.attackPower = attackPower;
        this.inventory = [];
        this.isPlayer = isPlayer;
        this.isAlive = true;
    }

    attack(target) {
        if (!this.isAlive) {
            return `${this.name} cannot attack - they are defeated!`;
        }
        
        const damage = Math.floor(Math.random() * this.attackPower) + 1;
        const result = target.takeDamage(damage);
        
        return `${this.name} attacks ${target.name} for ${damage} damage! ${result}`;
    }

    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            return `${this.name} has been defeated!`;
        }
        
        return `${this.name} has ${this.health} health remaining.`;
    }

    pickUpItem(item) {
        this.inventory.push(item);
        
        // Apply item effects if it's a weapon or healing item
        if (item.type === 'weapon') {
            this.attackPower += item.value;
            return `${this.name} picked up ${item.name}! Attack power increased by ${item.value}.`;
        } else if (item.type === 'healing') {
            this.health = Math.min(this.maxHealth, this.health + item.value);
            return `${this.name} used ${item.name} and restored ${item.value} health!`;
        } else {
            return `${this.name} picked up ${item.name}.`;
        }
    }

    viewInventory() {
        if (this.inventory.length === 0) {
            return `${this.name}'s inventory is empty.`;
        }
        
        const itemNames = this.inventory.map(item => `${item.name} (${item.type})`);
        return `${this.name}'s inventory: ${itemNames.join(', ')}`;
    }

    getStatus() {
        const healthBar = '█'.repeat(Math.floor((this.health / this.maxHealth) * 10));
        const emptyBar = '░'.repeat(10 - Math.floor((this.health / this.maxHealth) * 10));
        
        return `${this.name} | Health: ${this.health}/${this.maxHealth} [${healthBar}${emptyBar}] | Attack: ${this.attackPower}`;
    }
}

class Item {
    constructor(name, type, value, description = '') {
        this.name = name;
        this.type = type; // weapon, healing, quest, treasure
        this.value = value;
        this.description = description;
    }
}

class Location {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.characters = [];
        this.items = [];
        this.connectedLocations = [];
        this.visited = false;
        this.searched = false;
    }

    getAliveCharacters() {
        return _.filter(this.characters, 'isAlive');
    }

    enterLocation() {
        this.visited = true;
        let message = `\n=== ${this.name} ===\n${this.description}\n`;
        
        const aliveCharacters = this.getAliveCharacters();
        if (aliveCharacters.length > 0) {
            message += `\nCharacters here: ${aliveCharacters.map(c => c.name).join(', ')}`;
        }
        
        if (this.items.length > 0) {
            message += `\nItems here: ${this.items.map(i => i.name).join(', ')}`;
        }
        
        if (this.connectedLocations.length > 0) {
            message += `\nConnected areas: ${this.connectedLocations.map(l => l.name).join(', ')}`;
        }
        
        return message;
    }

    searchLocation() {
        const results = [];
        
        if (this.items.length > 0) {
            results.push(`Items found: ${this.items.map(i => `${i.name} (${i.type})`).join(', ')}`);
        }
        
        const aliveCharacters = this.getAliveCharacters();
        if (aliveCharacters.length > 0) {
            results.push(`Characters present: ${aliveCharacters.map(c => c.name).join(', ')}`);
        }
        
        // Hidden items or secrets (random chance)
        if (Math.random() < 0.3 && !this.searched) {
            const hiddenItems = [
                new Item('Ancient Coin', 'treasure', 50, 'A mysterious coin with strange markings'),
                new Item('Health Potion', 'healing', 25, 'A glowing red potion'),
                new Item('Magic Stone', 'quest', 0, 'A stone that pulses with magical energy')
            ];
            const randomItem = hiddenItems[Math.floor(Math.random() * hiddenItems.length)];
            this.items.push(randomItem);
            results.push(`🔍 You discovered a hidden ${randomItem.name}!`);
            this.searched = true;
        }
        
        return results.length > 0 ? results.join('\n') : 'You found nothing of interest.';
    }

    addCharacter(character) {
        this.characters.push(character);
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        _.pull(this.items, item);
    }

    connectTo(location) {
        this.connectedLocations.push(location);
    }
}

// ===============================
// GAME STATE AND DATA
// ===============================

class Game {
    constructor() {
        this.player = null;
        this.currentLocation = null;
        this.locations = [];
        this.gameWon = false;
        this.gameOver = false;
        this.treasuresFound = 0;
        this.enemiesDefeated = 0;
    }

    initializeGame() {
        // Create player
        this.player = new Character('Adventurer', 100, 15, true);
        
        // Create items
        const items = [
            new Item('Iron Sword', 'weapon', 10, 'A sturdy blade that gleams in the light'),
            new Item('Health Potion', 'healing', 30, 'A red potion that restores vitality'),
            new Item('Ancient Key', 'quest', 0, 'An ornate key with mysterious engravings'),
            new Item('Silver Dagger', 'weapon', 7, 'A quick, lightweight blade'),
            new Item('Magic Scroll', 'quest', 0, 'A scroll containing ancient magic'),
            new Item('Golden Chalice', 'treasure', 100, 'A valuable treasure of Scriptoria')
        ];

        // Create characters (NPCs and enemies)
        const characters = [
            new Character('Goblin Warrior', 40, 12),
            new Character('Ancient Guardian', 80, 20),
            new Character('Wise Hermit', 60, 5),
            new Character('Shadow Beast', 60, 18),
            new Character('Treasure Keeper', 50, 15)
        ];

        // Create locations
        const forestEntrance = new Location('Forest Entrance', 
            'You stand at the edge of a mysterious forest. Ancient trees tower above you, their branches creating a canopy that filters the sunlight into dancing shadows.');
        
        const ancientRuins = new Location('Ancient Ruins', 
            'Crumbling stone structures rise from the earth, covered in moss and strange symbols. The air here feels heavy with forgotten magic.');
        
        const hiddenCave = new Location('Hidden Cave', 
            'A dark cave extends deep into the mountainside. The sound of dripping water echoes from within, and you sense something valuable lies in the depths.');
        
        const mysticalGrove = new Location('Mystical Grove', 
            'A circular clearing surrounded by silver trees that seem to glow with inner light. This place radiates powerful magic.');

        const treasureChamber = new Location('Treasure Chamber', 
            'A magnificent chamber filled with ancient treasures. Golden light reflects off precious gems and artifacts. This is the heart of Scriptoria!');

        // Connect locations
        forestEntrance.connectTo(ancientRuins);
        forestEntrance.connectTo(mysticalGrove);
        ancientRuins.connectTo(forestEntrance);
        ancientRuins.connectTo(hiddenCave);
        hiddenCave.connectTo(ancientRuins);
        hiddenCave.connectTo(treasureChamber);
        mysticalGrove.connectTo(forestEntrance);
        mysticalGrove.connectTo(treasureChamber);
        treasureChamber.connectTo(hiddenCave);
        treasureChamber.connectTo(mysticalGrove);

        // Place characters in locations
        forestEntrance.addCharacter(characters[2]); // Wise Hermit
        ancientRuins.addCharacter(characters[0]); // Goblin Warrior
        ancientRuins.addCharacter(characters[1]); // Ancient Guardian
        hiddenCave.addCharacter(characters[3]); // Shadow Beast
        treasureChamber.addCharacter(characters[4]); // Treasure Keeper

        // Place items in locations
        forestEntrance.addItem(items[1]); // Health Potion
        ancientRuins.addItem(items[0]); // Iron Sword
        ancientRuins.addItem(items[2]); // Ancient Key
        hiddenCave.addItem(items[3]); // Silver Dagger
        mysticalGrove.addItem(items[4]); // Magic Scroll
        treasureChamber.addItem(items[5]); // Golden Chalice

        // Set up locations array and starting location
        this.locations = [forestEntrance, ancientRuins, hiddenCave, mysticalGrove, treasureChamber];
        this.currentLocation = forestEntrance;

        return this.currentLocation.enterLocation();
    }

    processCommand(command) {
        if (this.gameOver) {
            return 'Game is over. Please refresh to start a new adventure.';
        }

        const cmd = command.toLowerCase().trim();
        const words = cmd.split(' ');
        const action = words[0];
        const target = words.slice(1).join(' ');

        switch (action) {
            case 'look':
            case 'examine':
                return this.currentLocation.enterLocation();

            case 'search':
                return this.currentLocation.searchLocation();

            case 'move':
            case 'go':
            case 'travel':
                return this.moveToLocation(target);

            case 'pick':
            case 'take':
            case 'get':
                return this.pickUpItem(target);

            case 'attack':
            case 'fight':
                return this.attackCharacter(target);

            case 'talk':
            case 'speak':
                return this.talkToCharacter(target);

            case 'inventory':
            case 'inv':
                return this.player.viewInventory();

            case 'status':
            case 'health':
                return this.player.getStatus();

            case 'help':
                return this.getHelp();

            case 'locations':
                return this.listVisitedLocations();

            default:
                return `Unknown command: "${command}". Type "help" for available commands.`;
        }
    }

    moveToLocation(locationName) {
        const targetLocation = _.find(this.currentLocation.connectedLocations, 
            location => location.name.toLowerCase().includes(locationName.toLowerCase()));

        if (targetLocation) {
            this.currentLocation = targetLocation;
            return this.currentLocation.enterLocation();
        } else {
            const availableLocations = this.currentLocation.connectedLocations.map(l => l.name).join(', ');
            return `Cannot find location "${locationName}". Available locations: ${availableLocations}`;
        }
    }

    getNotFoundMessage(type, searchTerm, availableItems) {
        if (!availableItems.length) {
            return `There are no ${type} here.`;
        }
        const list = availableItems.map(item => item.name).join(', ');
        return `Cannot find ${type} "${searchTerm}". Available: ${list}`;
    }

    pickUpItem(itemName) {
        const item = _.find(this.currentLocation.items, 
            item => item.name.toLowerCase().includes(itemName.toLowerCase()));

        if (!item) {
            return this.getNotFoundMessage('items', itemName, this.currentLocation.items);
        }

        this.currentLocation.removeItem(item);
        const result = this.player.pickUpItem(item);
        
        // Check for treasure collection
        if (item.type === 'treasure') {
            this.treasuresFound++;
            if (this.treasuresFound >= 2) {
                this.gameWon = true;
                this.gameOver = true;
                return result + '\n\n🎉 CONGRATULATIONS! You have collected enough treasures and won the game! 🎉';
            }
        }
        
        return result;
    }

    attackCharacter(characterName) {
        const aliveCharacters = this.currentLocation.getAliveCharacters();
        const character = _.find(aliveCharacters, 
            char => char.name.toLowerCase().includes(characterName.toLowerCase()));

        if (!character) {
            return this.getNotFoundMessage('targets', characterName, aliveCharacters);
        }

        if (character.name === 'Wise Hermit') {
            return 'The Wise Hermit raises his hand peacefully. "I mean you no harm, young adventurer. Perhaps we should talk instead."';
        }

        let result = this.player.attack(character);
        
        if (character.isAlive) {
            // Character counterattacks
            result += '\n' + character.attack(this.player);
            
            if (!this.player.isAlive) {
                this.gameOver = true;
                result += '\n\n💀 GAME OVER! Your adventure ends here... 💀';
            }
        } else {
            this.enemiesDefeated++;
            result += `\n${character.name} has been defeated!`;
            
            // Chance to drop an item when defeated
            if (Math.random() < 0.6) {
                const dropItems = [
                    new Item('Health Potion', 'healing', 20, 'A healing potion dropped by your enemy'),
                    new Item('Battle Trophy', 'treasure', 30, 'A valuable trophy from your victory')
                ];
                const droppedItem = dropItems[Math.floor(Math.random() * dropItems.length)];
                this.currentLocation.addItem(droppedItem);
                result += `\n${character.name} dropped ${droppedItem.name}!`;
            }
        }
        
        return result;
    }

    talkToCharacter(characterName) {
        const aliveCharacters = this.currentLocation.getAliveCharacters();
        const character = _.find(aliveCharacters, 
            char => char.name.toLowerCase().includes(characterName.toLowerCase()));

        if (!character) {
            return this.getNotFoundMessage('characters', characterName, aliveCharacters);
        }

        const dialogues = {
            'Wise Hermit': 'The hermit speaks softly: "Welcome to Scriptoria, brave soul. Seek the treasures hidden in the ancient places, but beware the guardians that protect them. The Ancient Key you seek lies in these very ruins."',
            'Goblin Warrior': 'The goblin snarls: "You dare enter our territory? Leave now or face our wrath!"',
            'Ancient Guardian': 'The guardian speaks in an ancient voice: "I have protected these ruins for centuries. Prove your worth in battle, or leave this sacred place."',
            'Shadow Beast': 'The shadow beast whispers menacingly: "The darkness calls for your soul... but perhaps you seek what lies deeper in the cave?"',
            'Treasure Keeper': 'The keeper guards the treasures: "These treasures have been mine for ages! You must defeat me to claim them!"'
        };

        return dialogues[character.name] || `${character.name} looks at you but says nothing.`;
    }

    listVisitedLocations() {
        const visitedLocations = _.filter(this.locations, 'visited');
        if (visitedLocations.length === 0) {
            return 'You have not yet explored any locations.';
        }
        
        return 'Visited locations:\n' + visitedLocations.map(loc => 
            `• ${loc.name} - ${loc.description.substring(0, 60)}...`
        ).join('\n');
    }

    getHelp() {
        return `
🗡️ SCRIPTORIA COMMANDS 🗡️

Movement:
• move [location] / go [location] - Travel to a connected location
• look / examine - Look around current location

Items:
• pick [item] / take [item] - Pick up an item
• search - Search for hidden items
• inventory / inv - View your inventory

Combat:
• attack [character] / fight [character] - Attack a character
• talk [character] / speak [character] - Talk to a character

Status:
• status / health - View your current status
• locations - List visited locations
• help - Show this help message

🎯 GOAL: Collect treasures and explore the mysterious land of Scriptoria!
        `;
    }

    getGameStatus() {
        return `${this.player.getStatus()} | Treasures: ${this.treasuresFound} | Enemies Defeated: ${this.enemiesDefeated}`;
    }
}

// ===============================
// GAME INTERFACE AND MAIN LOOP
// ===============================

const game = new Game();

function updateDisplay(message) {
    const outputElement = document.getElementById('gameOutput');
    const statusElement = document.getElementById('playerStatus');
    
    if (outputElement) {
        outputElement.innerHTML = `<pre>${message}</pre>`;
    }
    
    if (statusElement && game.player) {
        statusElement.innerHTML = `<strong>Status:</strong> ${game.getGameStatus()}`;
    }
}

function startGame() {
    const welcomeMessage = game.initializeGame();
    updateDisplay(welcomeMessage);
    setTimeout(gameLoop, 1000);
}

function gameLoop() {
    if (game.gameOver) {
        const endMessage = game.gameWon 
            ? '\n\n🎉 Congratulations! You have mastered Scriptoria! 🎉'
            : '\n\n💀 Game Over! Refresh the page to try again. 💀';
        updateDisplay(document.getElementById('gameOutput').textContent + endMessage);
        return;
    }

    const command = prompt('What would you like to do? (type "help" for commands)');
    
    if (command === null) {
        updateDisplay(document.getElementById('gameOutput').textContent + '\n\nThanks for playing Scriptoria!');
        return;
    }
    
    if (command.trim() === '') {
        gameLoop();
        return;
    }

    const result = game.processCommand(command);
    updateDisplay(result);
    setTimeout(gameLoop, 500);
}

function showHelp() {
    alert(game.getHelp());
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay('Welcome to Scriptoria! Click "Start Game" to begin your adventure.');
});