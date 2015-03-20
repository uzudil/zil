function Monster(category, shape, name, level, loiter_radius, ethereal) {
    this.category = category;
    this.shape = shape;
    this.name = name;
    this.level = level;
    this.loiter_radius = loiter_radius;
    this.ethereal = ethereal;

    this.key = null;
}

MONSTERS = {
    "bunny": new Monster("creatures", "bunny", "Rabbit", 0),
    "cow": new Monster("creatures", "cow", "Cow", 0),
    "monk": new Monster("creatures", "monk", "Monk", 0, 16),
    "man": new Monster("creatures", "man", "Man", 0, 16),
    "woman": new Monster("creatures", "woman", "Woman", 0, 16),
    "sage": new Monster("creatures", "sage", "Sage", 0, 16),
    "rat": new Monster("creatures", "rat", "Large Rat", 1),
    "gspider": new Monster("creatures", "spider", "Giant Spider", 2),
    "goblin": new Monster("creatures", "gnome", "Common Goblin", 2),
    "imp": new Monster("creatures", "imp", "Fire Imp", 3),
    "shade": new Monster("creatures", "shade", "Lesser Shade", 3, null, true),
    "demon": new Monster("creatures", "demon", "Bael Demon", 9)
};

for(var key in MONSTERS) {
    MONSTERS[key].key = key;
}