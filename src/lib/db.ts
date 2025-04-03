// import { PrismaClient } from "@prisma/client";

// declare global {
//   var prisma: PrismaClient | undefined;
// }

// export const db = globalThis.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// --- Prisma Middleware: Sync role change from DB to Clerk ---
prisma.$use(async (params, next) => {
  // Only listen to User model updates
  if (params.model === "User" && params.action === "update") {
    const previous = await prisma.user.findUnique({ where: params.args.where });

    const result = await next(params); // Continue with the update

    if (previous?.role !== result.role) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(result.id, {
          privateMetadata: {
            role: result.role,
            origin: "database_sync", // optional: used to prevent webhook loops
          },
        });
        console.log(`[Clerk Sync] Updated Clerk metadata for user ${result.id}`);
      } catch (err) {
        console.error("[Clerk Sync] Failed to sync role to Clerk:", err);
      }
    }

    return result;
  }

  return next(params);
});

export const db = prisma;
