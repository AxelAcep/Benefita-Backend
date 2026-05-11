-- CreateTable
CREATE TABLE "benefita"."DeviceTrusted" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceTrusted_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."OtpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTrusted_userId_deviceHash_key" ON "benefita"."DeviceTrusted"("userId", "deviceHash");

-- AddForeignKey
ALTER TABLE "benefita"."DeviceTrusted" ADD CONSTRAINT "DeviceTrusted_userId_fkey" FOREIGN KEY ("userId") REFERENCES "benefita"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "benefita"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
