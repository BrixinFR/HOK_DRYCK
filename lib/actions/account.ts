"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { prisma } from "../prisma";

export async function addFunds(amount: number) {
  const user = await getCurrentUser();
  
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accountBalance: {
        increment: amount
      }
    }
  });

  revalidatePath("/sell");
}

export async function getAccountBalance() {
  const user = await getCurrentUser();
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { accountBalance: true }
  });

  return Number(dbUser?.accountBalance || 0);
}