"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { prisma } from "../prisma";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().nonnegative("Price must be non-negative"),
  quantity: z.coerce.number().int().min(0, "Quantity must be non-negative"),
  sku: z.string().optional(),
  lowStockAt: z.coerce.number().int().min(0).optional(),
});

export async function deleteProduct(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") || "");

  await prisma.product.deleteMany({
    where: { id: id, userId: user.id },
  });
  
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();

  const parsed = ProductSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    sku: formData.get("sku") || undefined,
    lowStockAt: formData.get("lowStockAt") || undefined,
  });

  if (!parsed.success) {
    throw new Error("Validation failed");
  }

  try {
    // Check if a product with this exact name already exists (case-insensitive)
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: parsed.data.name,
          mode: "insensitive",
        },
      },
    });

    if (existingProduct) {
      // Product exists - add to the existing quantity
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          quantity: existingProduct.quantity + parsed.data.quantity,
          price: parsed.data.price, // Update to new price
          ...(parsed.data.sku && { sku: parsed.data.sku }),
          ...(parsed.data.lowStockAt && { lowStockAt: parsed.data.lowStockAt }),
        },
      });
    } else {
      // Product doesn't exist - create new one
      await prisma.product.create({
        data: { ...parsed.data, userId: user.id },
      });
    }
    
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Actual error:", error);
    throw new Error("Failed to create product.");
  }
}