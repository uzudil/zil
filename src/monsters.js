function Monster(category, shape, name, level, loiter_radius) {
    this.category = category;
    this.shape = shape;
    this.name = name;
    this.level = level;
    this.key = null;
    this.loiter_radius = loiter_radius;
}

MONSTERS = {
    "bunny": new Monster("creatures", "bunny", "Rabbit", 0),
    "monk": new Monster("creatures", "monk", "Monk", 0, 16),
    "man": new Monster("creatures", "man", "Man", 0, 16),
    "woman": new Monster("creatures", "woman", "Woman", 0, 16),
    "sage": new Monster("creatures", "sage", "Sage", 0, 16),
    "rat": new Monster("creatures", "rat", "Large Rat", 1),
    "goblin": new Monster("creatures", "goblin", "Common Goblin", 1),
    "imp": new Monster("creatures", "imp", "Fire Imp", 3),
    "demon": new Monster("creatures", "demon", "Bael Demon", 9)
};

for(var key in MONSTERS) {
    MONSTERS[key].key = key;
}