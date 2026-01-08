"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function confirmSale(items: { id: string; quantity: number }[]) {
  try {
    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid items");
    }

    // Fetch all products and calculate total
    const products = await Promise.all(
      items.map((item) =>
        prisma.product.findUnique({
          where: { id: item.id },
        })
      )
    );

    // Validate all products exist and have sufficient stock
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const item = items[i];

      if (!product) {
        throw new Error(`Product ${item.id} not found`);
      }

      const newQuantity = Number(product.quantity) - item.quantity;

      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item, index) => {
      const product = products[index];
      return sum + Number(product!.price) * item.quantity;
    }, 0);

    // Create sale record with all items in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          totalAmount,
          items: {
            create: items.map((item, index) => {
              const product = products[index];
              return {
                productId: item.id,
                quantity: item.quantity,
                price: product!.price,
              };
            }),
          },
        },
      });

      // Update inventory for each item
      for (const item of items) {
        const product = products.find((p) => p?.id === item.id);
        const newQuantity = Number(product!.quantity) - item.quantity;

        await tx.product.update({
          where: { id: item.id },
          data: { quantity: newQuantity },
        });
      }

      return sale;
    });

    // Revalidate pages that show product and sales data
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/sell");
    revalidatePath("/statistics");

    return { success: true };
  } catch (error) {
    console.error("Error confirming sale:", error);
    throw error;
  }
}