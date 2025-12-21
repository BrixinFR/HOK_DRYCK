"use client";

import Sidebar from "@/components/sidebar";
import { createProduct } from "@/lib/actions/products";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function AddProductPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createProduct(formData);
        
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);

      } catch (error) {
        console.error("Failed to add product:", error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-rose-50">
      <Sidebar currentPath="/add-product" />

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-semibold">Product added successfully!</span>
          </div>
        </div>
      )}

      <main className="ml-64 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Add Product
              </h1>
              <p className="text-sm text-gray-600">
                Add a new product to your inventory
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <form className="space-y-6" action={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-800 mb-2"
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  disabled={isPending}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Enter Product Name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="0"
                    required
                    disabled={isPending}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Price *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    step="0.01"
                    min="0"
                    required
                    disabled={isPending}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="sku"
                  className="block text-sm font-semibold text-gray-800 mb-2"
                >
                  SKU (optional)
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  disabled={isPending}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <label
                  htmlFor="lowStockAt"
                  className="block text-sm font-semibold text-gray-800 mb-2"
                >
                  Low Stock At (optional)
                </label>
                <input
                  type="number"
                  id="lowStockAt"
                  name="lowStockAt"
                  min="0"
                  disabled={isPending}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Enter low stock threshold"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-8 py-3 bg-[#de3163] text-white font-semibold rounded-lg hover:bg-[#c72856] active:bg-[#b01f4a] shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    "Add Product"
                  )}
                </button>
                <Link
                  href="/inventory"
                  className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 border-2 border-gray-200 transition-all duration-200"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}