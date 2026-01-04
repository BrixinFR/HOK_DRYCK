"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function confirmSale(items: { id: string; quantity: number }[]) {
  try {
    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid items");
    }

    // Update inventory for each item
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
      });

      if (!product) {
        throw new Error(`Product ${item.id} not found`);
      }

      const newQuantity = Number(product.quantity) - item.quantity;

      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      await prisma.product.update({
        where: { id: item.id },
        data: { quantity: newQuantity },
      });
    }

    // Revalidate pages that show product data
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/sell");

    return { success: true };
  } catch (error) {
    console.error("Error confirming sale:", error);
    throw error;
  }
}