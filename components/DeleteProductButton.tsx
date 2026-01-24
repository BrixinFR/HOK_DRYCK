'use client';

import { deleteProduct } from "@/lib/actions/products";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const handleDelete = async () => {
    if (confirm("Are you sure? This will delete all sale history for this product!")) {
      const form = new FormData();
      form.append('id', productId);
      await deleteProduct(form);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-900"
    >
      Delete
    </button>
  );
}