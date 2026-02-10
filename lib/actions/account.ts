"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { prisma } from "../prisma";

export async function addFunds(amountOrUserId: number | string, amount?: number) {
  // Support both old and new signatures
  let userId: string;
  let fundsToAdd: number;

  if (typeof amountOrUserId === 'string' && amount !== undefined) {
    // New signature: addFunds(userId, amount)
    userId = amountOrUserId;
    fundsToAdd = amount;
  } else if (typeof amountOrUserId === 'number') {
    // Old signature: addFunds(amount)
    const user = await getCurrentUser();
    userId = user.id;
    fundsToAdd = amountOrUserId;
  } else {
    throw new Error("Invalid parameters");
  }
  
  if (fundsToAdd <= 0) {
    throw new Error("Amount must be positive");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      accountBalance: {
        increment: fundsToAdd
      }
    }
  });

  revalidatePath("/sell");
  revalidatePath("/account-payment");
}

export async function getAccountBalance(userId?: string) {
  let targetUserId: string;

  if (userId) {
    // New signature: getAccountBalance(userId)
    targetUserId = userId;
  } else {
    // Old signature: getAccountBalance() - use current user
    const user = await getCurrentUser();
    targetUserId = user.id;
  }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { accountBalance: true }
  });

  return Number(dbUser?.accountBalance || 0);
}