-- CreateTable
CREATE TABLE "ShippingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippingAddress" TEXT NOT NULL,
    "shippedDate" DATETIME,
    "trackingNumber" TEXT,
    CONSTRAINT "ShippingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippingRequestId" TEXT,
    "isShipped" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCard_shippingRequestId_fkey" FOREIGN KEY ("shippingRequestId") REFERENCES "ShippingRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserCard" ("cardId", "createdAt", "id", "userId") SELECT "cardId", "createdAt", "id", "userId" FROM "UserCard";
DROP TABLE "UserCard";
ALTER TABLE "new_UserCard" RENAME TO "UserCard";
CREATE INDEX "UserCard_userId_idx" ON "UserCard"("userId");
CREATE INDEX "UserCard_cardId_idx" ON "UserCard"("cardId");
CREATE INDEX "UserCard_shippingRequestId_idx" ON "UserCard"("shippingRequestId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
