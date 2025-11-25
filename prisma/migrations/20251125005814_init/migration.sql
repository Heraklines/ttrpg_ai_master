-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "adventureModule" TEXT,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "subclass" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "background" TEXT,
    "alignment" TEXT,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "dexterity" INTEGER NOT NULL DEFAULT 10,
    "constitution" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "wisdom" INTEGER NOT NULL DEFAULT 10,
    "charisma" INTEGER NOT NULL DEFAULT 10,
    "maxHp" INTEGER NOT NULL DEFAULT 10,
    "currentHp" INTEGER NOT NULL DEFAULT 10,
    "tempHp" INTEGER NOT NULL DEFAULT 0,
    "armorClass" INTEGER NOT NULL DEFAULT 10,
    "speed" INTEGER NOT NULL DEFAULT 30,
    "hitDiceType" INTEGER NOT NULL DEFAULT 8,
    "hitDiceTotal" INTEGER NOT NULL DEFAULT 1,
    "hitDiceRemaining" INTEGER NOT NULL DEFAULT 1,
    "deathSaveSuccesses" INTEGER NOT NULL DEFAULT 0,
    "deathSaveFailures" INTEGER NOT NULL DEFAULT 0,
    "savingThrowProficiencies" TEXT NOT NULL DEFAULT '[]',
    "skillProficiencies" TEXT NOT NULL DEFAULT '[]',
    "skillExpertise" TEXT NOT NULL DEFAULT '[]',
    "spellcastingAbility" TEXT,
    "spellSlots" TEXT NOT NULL DEFAULT '{}',
    "knownSpells" TEXT NOT NULL DEFAULT '[]',
    "preparedSpells" TEXT NOT NULL DEFAULT '[]',
    "classResources" TEXT NOT NULL DEFAULT '[]',
    "inventory" TEXT NOT NULL DEFAULT '[]',
    "equippedItems" TEXT NOT NULL DEFAULT '{}',
    "gold" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT NOT NULL DEFAULT '[]',
    "features" TEXT NOT NULL DEFAULT '[]',
    "backstory" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'exploration',
    "currentLocationId" TEXT,
    "exploredLocations" TEXT NOT NULL DEFAULT '[]',
    "gameDay" INTEGER NOT NULL DEFAULT 1,
    "gameHour" INTEGER NOT NULL DEFAULT 8,
    "gameMinute" INTEGER NOT NULL DEFAULT 0,
    "activeCombat" TEXT,
    "flags" TEXT NOT NULL DEFAULT '{}',
    "activeQuests" TEXT NOT NULL DEFAULT '[]',
    "completedQuests" TEXT NOT NULL DEFAULT '[]',
    "knownNpcs" TEXT NOT NULL DEFAULT '[]',
    "recentMessages" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameState_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "transcript" TEXT NOT NULL DEFAULT '[]',
    "summary" TEXT,
    "stateSnapshot" TEXT,
    CONSTRAINT "Session_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "geminiApiKey" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "diceAnimation" BOOLEAN NOT NULL DEFAULT true,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonsterCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SpellCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Character_campaignId_idx" ON "Character"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "GameState_campaignId_key" ON "GameState"("campaignId");

-- CreateIndex
CREATE INDEX "Session_campaignId_idx" ON "Session"("campaignId");

-- CreateIndex
CREATE INDEX "MonsterCache_name_idx" ON "MonsterCache"("name");

-- CreateIndex
CREATE INDEX "SpellCache_name_idx" ON "SpellCache"("name");
