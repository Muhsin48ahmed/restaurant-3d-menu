import { Prisma } from "@prisma/client";
import { generateCode } from "@/lib/codes";

const MAX_CODE_ATTEMPTS = 5;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Runs a create with a fresh public code, retrying on the rare collision. */
export async function withUniqueCode<T>(prefix: string, create: (code: string) => Promise<T>) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await create(generateCode(prefix));
    } catch (error) {
      if (!isUniqueViolation(error) || attempt >= MAX_CODE_ATTEMPTS) throw error;
    }
  }
}
