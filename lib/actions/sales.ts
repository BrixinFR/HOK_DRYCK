"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "../auth";
import { revalidatePath } from "next/cache";

export async function confirmSale(
  items: { id: string; quantity: number }[],
  paymentMethod: "swish" | "account" = "swish"
) {
  try {
    const user = await getCurrentUser();

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid items");
    }

    const products = await Promise.all(
      items.map((item) =>
        prisma.product.findUnique({
          where: { id: item.id },
        })
      )
    );

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

    const totalAmount = items.reduce((sum, item, index) => {
      const product = products[index];
      return sum + Number(product!.price) * item.quantity;
    }, 0);

    if (paymentMethod === "account") {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { accountBalance: true },
      });

      const balance = Number(dbUser?.accountBalance || 0);

      if (balance < totalAmount) {
        throw new Error("Insufficient account balance");
      }
    }

    await prisma.$transaction(async (tx) => {
      if (paymentMethod === "account") {
        await tx.user.update({
          where: { id: user.id },
          data: {
            accountBalance: {
              decrement: totalAmount,
            },
          },
        });
      }

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