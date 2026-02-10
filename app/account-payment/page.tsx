"use client";

import Sidebar from "@/components/sidebar";
import { confirmSale } from "@/lib/actions/sales";
import { addFunds, getAccountBalance } from "@/lib/actions/account";
import { useState, useEffect } from "react";
import { ShoppingCart, Wallet, DollarSign } from "lucide-react";
import ProductCard from "@/components/sell/ProductCard";
import CartItem from "@/components/sell/CartItem";
import AccountModal from "@/components/sell/AccountPayment";
import { useSwishQR } from "@/lib/qrGen";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string | null;
}

interface CartItemType extends Product {
  cartQuantity: number;
}

export default function AccountPaymentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"payment" | "add_funds">("payment");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [accountBalance, setAccountBalance] = useState(0);
  const [addFundsAmount, setAddFundsAmount] = useState("");

  const swishQR = useSwishQR();

  useEffect(() => {
    fetchProducts();
    fetchBalance();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data.map((p: any) => ({
        ...p,
        price: Number(p.price),
        quantity: Number(p.quantity),
      })));
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBalance() {
    try {
      const balance = await getAccountBalance();
      setAccountBalance(balance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }

  const filteredProducts = products.filter((p) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  function addToCart(product: Product) {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.cartQuantity < product.quantity) {
        setCart(cart.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { ...product, cartQuantity: 1 }]);
    }
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(
      cart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.cartQuantity + delta;
            return { ...item, cartQuantity: Math.min(newQty, item.quantity) };
          }
          return item;
        })
        .filter((item) => item.cartQuantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.id !== productId));
  }

  function initiatePayment() {
    if (cart.length === 0) return;
    if (accountBalance < total) {
      alert(`Insufficient balance. Need ${(total - accountBalance).toFixed(2)} kr more.`);
      return;
    }
    setModalMode("payment");
    setShowModal(true);
  }

  async function initiateAddFunds() {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const success = await swishQR.generateQR("0730874001", amount);
    if (success) {
      setModalMode("add_funds");
      setShowModal(true);
    }
  }

  async function handleConfirm() {
    if (modalMode === "add_funds") {
      const amount = parseFloat(addFundsAmount);
      setConfirming(true);
      try {
        await addFunds(amount);
        await fetchBalance();
        setShowModal(false);
        swishQR.clearQR();
        setAddFundsAmount("");
        alert(`Successfully added ${amount.toFixed(2)} kr to your account!`);
      } catch (error) {
        alert("Failed to add funds");
      } finally {
        setConfirming(false);
      }
    } else {
      // Process payment
      setConfirming(true);
      try {
        await confirmSale(
          cart.map((item) => ({ id: item.id, quantity: item.cartQuantity })),
          "account"
        );
        setCart([]);
        setShowModal(false);
        setShowSuccess(true);
        fetchProducts();
        fetchBalance();
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error: any) {
        alert(error.message || "Payment failed");
      } finally {
        setConfirming(false);
      }
    }
  }

  function closeModal() {
    setShowModal(false);
    swishQR.clearQR();
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50">
      <Sidebar currentPath="/account-payment" />

      {/* Balance Display */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Account Balance</p>
              <p className="text-2xl font-bold text-gray-900">{accountBalance.toFixed(2)} kr</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <input
              type="number"
              value={addFundsAmount}
              onChange={(e) => setAddFundsAmount(e.target.value)}
              placeholder="Amount to add"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none transition-all text-sm"
            />
            <button
              onClick={initiateAddFunds}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Payment confirmed! Inventory updated.</span>
          </div>
        </div>
      )}

      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Account Payment</h1>
          <p className="text-sm text-gray-600">Pay with your account balance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none transition-all"
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Available Products</h2>
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => {
                    const inCart = cart.find((item) => item.id === product.id);
                    const available = product.quantity - (inCart?.cartQuantity || 0);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        availableQuantity={available}
                        onAddToCart={() => addToCart(product)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-8 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-800">Cart ({cart.length})</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Current Balance</span>
                    <span className="text-sm font-semibold text-gray-900">{accountBalance.toFixed(2)} kr</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-purple-600">{total.toFixed(2)} kr</span>
                  </div>

                  {accountBalance < total && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-800">
                        <strong>Insufficient balance</strong><br />
                        Need {(total - accountBalance).toFixed(2)} kr more
                      </p>
                    </div>
                  )}

                  <button
                    onClick={initiatePayment}
                    disabled={cart.length === 0 || accountBalance < total}
                    className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    Pay with Account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <AccountModal
        show={showModal}
        onClose={closeModal}
        onConfirm={handleConfirm}
        mode={modalMode}
        amount={modalMode === "add_funds" ? parseFloat(addFundsAmount) || 0 : total}
        itemCount={cart.length}
        currentBalance={accountBalance}
        qrCodeUrl={swishQR.qrCodeUrl}
        confirming={confirming}
      />
    </div>
  );
}