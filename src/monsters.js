function Monster(category, shape, name, level) {
    this.category = category;
    this.shape = shape;
    this.name = name;
    this.level = level;
    this.key = null;
}

MONSTERS = {
    "bunny": new Monster("creatures", "bunny", "Rabbit", 0),
    "rat": new Monster("creatures", "rat", "Large Rat", 1),
    "goblin": new Monster("creatures", "goblin", "Common Goblin", 1),
    "imp": new Monster("creatures", "imp", "Fire Imp", 3),
    "demon": new Monster("creatures", "demon", "Bael Demon", 9)
};

for(var key in MONSTERS) {
    MONSTERS[key].key = key;
}