"use client";

import Sidebar from "@/components/sidebar";
import { confirmSale } from "@/lib/actions/sales";
import { addFunds, getAccountBalance } from "@/lib/actions/account";
import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Wallet } from "lucide-react";
import ProductCard from "@/components/sell/ProductCard";
import CartItem from "@/components/sell/CartItem";
import UnifiedPaymentModal, { STANDARD_PASSWORD } from "@/components/sell/PaymentModal";
import { useSwishQR } from "@/components/sell/qrGen";

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

export default function SellPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"payment" | "add_funds">("payment");
  const [swishNumber, setSwishNumber] = useState("0730874001");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [accountBalance, setAccountBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"swish" | "account">("swish");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  );

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0),
    [cart]
  );

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

  async function initiateSwishPayment() {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const success = await swishQR.generateQR(swishNumber, total);
    if (success) {
      setPaymentMethod("swish");
      setModalMode("payment");
      setShowModal(true);
    }
  }

  function initiateAccountPayment() {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    if (accountBalance < total) {
      alert(`Insufficient balance. Need ${(total - accountBalance).toFixed(2)} kr more.`);
      return;
    }
    setPaymentMethod("account");
    setModalMode("payment");
    setPassword("");
    setPasswordError("");
    setShowModal(true);
  }

  async function initiateAddFunds() {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const success = await swishQR.generateQR(swishNumber, amount);
    if (success) {
      setModalMode("add_funds");
      setPaymentMethod("swish");
      setShowModal(true);
    }
  }

  async function handleConfirm() {
    if (modalMode === "add_funds") {
      // Add funds
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
      if (paymentMethod === "account") {
        if (!password) {
          setPasswordError("Password is required");
          return;
        }
        if (password !== STANDARD_PASSWORD) {
          setPasswordError("Incorrect password");
          return;
        }
      }

      setConfirming(true);
      try {
        await confirmSale(
          cart.map((item) => ({ id: item.id, quantity: item.cartQuantity })),
          paymentMethod
        );
        setCart([]);
        setShowModal(false);
        setPassword("");
        setPasswordError("");
        swishQR.clearQR();
        setShowSuccessMessage(true);
        fetchProducts();
        fetchBalance();
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error: any) {
        alert(error.message || "Payment failed");
      } finally {
        setConfirming(false);
      }
    }
  }

  function closeModal() {
    setShowModal(false);
    setPassword("");
    setPasswordError("");
    swishQR.clearQR();
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-rose-50">
      <Sidebar currentPath="/sell" />

      {/* Floating Add Funds Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="w-6 h-6 text-[#de3163]" />
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
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all text-sm"
            />
            <button
              onClick={initiateAddFunds}
              className="w-full px-4 py-2 bg-[#de3163] text-white rounded-lg hover:bg-[#c72856] text-sm font-semibold transition-all"
            >
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Sale confirmed! Inventory updated.</span>
          </div>
        </div>
      )}

      <main className="ml-64 p-8 pb-32">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Sell Products</h1>
          <p className="text-sm text-gray-600">Select products and generate Swish payment</p>
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all"
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-[#de3163]" />
              <h2 className="text-lg font-bold text-gray-800">Cart ({cart.length})</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>

                <div className="border-t-2 border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-[#de3163]">{total.toFixed(2)} kr</span>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={initiateAccountPayment}
                      disabled={accountBalance < total}
                      className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-5 h-5" />
                      Pay with Account
                      {accountBalance < total && (
                        <span className="text-xs ml-1">
                          (Need {(total - accountBalance).toFixed(2)} kr)
                        </span>
                      )}
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Swish Number
                      </label>
                      <input
                        type="text"
                        value={swishNumber}
                        onChange={(e) => setSwishNumber(e.target.value)}
                        placeholder="07XXXXXXXX"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all"
                      />
                    </div>

                    <button
                      onClick={initiateSwishPayment}
                      className="w-full px-6 py-3 bg-[#de3163] text-white font-semibold rounded-lg hover:bg-[#c72856] transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z"/>
                      </svg>
                      Generate Swish QR
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Unified Modal */}
      <UnifiedPaymentModal
        show={showModal}
        onClose={closeModal}
        onConfirm={handleConfirm}
        mode={modalMode}
        paymentMethod={paymentMethod}
        qrCodeUrl={swishQR.qrCodeUrl}
        amount={modalMode === "add_funds" ? parseFloat(addFundsAmount) : total}
        itemCount={cart.length}
        accountBalance={accountBalance}
        confirming={confirming}
        password={password}
        onPasswordChange={setPassword}
        passwordError={passwordError}
      />
    </div>
  );
}