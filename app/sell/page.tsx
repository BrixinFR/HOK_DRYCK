"use client";

import Sidebar from "@/components/sidebar";
import { confirmSale } from "@/lib/actions/sales";
import { addFunds, getAccountBalance } from "@/lib/actions/account";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { ShoppingCart, Trash2, Plus, Minus, QrCode, X, Wallet } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string | null;
}

interface CartItem extends Product {
  cartQuantity: number;
}

export default function SellPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [swishNumber, setSwishNumber] = useState("0730874001");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [accountBalance, setAccountBalance] = useState(0);
  const [fundsAmount, setFundsAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"swish" | "account">("swish");

  // Fetch products and balance on mount
  useEffect(() => {
    fetchProducts();
    fetchBalance();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      const processedData = data.map((product: any) => ({
        ...product,
        price: Number(product.price),
        quantity: Number(product.quantity),
      }));
      setProducts(processedData);
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

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add product to cart
  function addToCart(product: Product) {
    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.cartQuantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, cartQuantity: item.cartQuantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([...cart, { ...product, cartQuantity: 1 }]);
    }
  }

  // Update cart item quantity
  function updateQuantity(productId: string, delta: number) {
    setCart(
      cart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.cartQuantity + delta;
            return { ...item, cartQuantity: Math.min(newQuantity, item.quantity) };
          }
          return item;
        })
        .filter((item) => item.cartQuantity > 0)
    );
  }

  // Remove item from cart
  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.id !== productId));
  }

  // Calculate total
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.cartQuantity,
    0
  );

  // Generate Swish QR Code
  async function generateSwishQR() {
    if (!swishNumber.trim()) {
      alert("Please enter a Swish phone number");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const phoneNumber = swishNumber.replace(/\s/g, "").replace(/^\+46/, "");
    const amount = total.toFixed(2);
    const message = "";
    
    const swishQrData = `C${phoneNumber};${amount};${message};0`;

    try {
      const qr = await QRCode.toDataURL(swishQrData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      setQrCodeUrl(qr);
      setPaymentMethod("swish");
      setShowQrModal(true);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code");
    }
  }

  // Pay with account balance
  function payWithAccount() {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (accountBalance < total) {
      alert(`Insufficient balance. You need ${(total - accountBalance).toFixed(2)} kr more.`);
      return;
    }

    setPaymentMethod("account");
    setShowQrModal(true);
  }

  // Add funds to account
  async function handleAddFunds() {
    const amount = parseFloat(fundsAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await addFunds(amount);
      await fetchBalance();
      setShowAddFundsModal(false);
      setFundsAmount("");
      alert(`Successfully added ${amount.toFixed(2)} kr to your account!`);
    } catch (error) {
      console.error("Failed to add funds:", error);
      alert("Failed to add funds");
    }
  }

  // Confirm payment and update inventory
  async function confirmPayment() {
    setConfirming(true);
    
    try {
      await confirmSale(
        cart.map((item) => ({
          id: item.id,
          quantity: item.cartQuantity,
        })),
        paymentMethod
      );

      // Success! Clear cart and close modal
      setCart([]);
      setShowQrModal(false);
      setShowSuccessMessage(true);
      
      // Refresh products and balance
      fetchProducts();
      fetchBalance();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error: any) {
      console.error("Failed to confirm payment:", error);
      alert(error.message || "Failed to confirm payment. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-rose-50">
      <Sidebar currentPath="/sell" />

      {/* Success Message */}
      {showSuccessMessage && (
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
            <span className="font-semibold">Sale confirmed! Inventory updated.</span>
          </div>
        </div>
      )}

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Sell Products
              </h1>
              <p className="text-sm text-gray-600">
                Select products and generate Swish payment
              </p>
            </div>
            
            {/* Account Balance Display */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-[#de3163]" />
                <div>
                  <p className="text-xs text-gray-500">Account Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{accountBalance.toFixed(2)} kr</p>
                </div>
                <button
                  onClick={() => setShowAddFundsModal(true)}
                  className="ml-4 px-4 py-2 bg-[#de3163] text-white rounded-lg hover:bg-[#c72856] text-sm font-semibold"
                >
                  Add Funds
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all"
              />
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Available Products
              </h2>
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading products...</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => {
                    const inCart = cart.find((item) => item.id === product.id);
                    const availableQty = product.quantity - (inCart?.cartQuantity || 0);

                    return (
                      <div
                        key={product.id}
                        className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#de3163] transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {product.name}
                            </h3>
                            {product.sku && (
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            )}
                          </div>
                          <span className="text-lg font-bold text-[#de3163]">
                            {product.price.toFixed(2)} kr
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Available: {availableQty}
                          </span>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={availableQty === 0}
                            className="px-4 py-2 bg-[#de3163] text-white rounded-lg hover:bg-[#c72856] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="space-y-4">
            {/* Cart */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-[#de3163]" />
                <h2 className="text-lg font-bold text-gray-800">
                  Cart ({cart.length})
                </h2>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">
                  Cart is empty
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm text-gray-800">
                            {item.name}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-8 text-center">
                              {item.cartQuantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.cartQuantity >= item.quantity}
                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-[#de3163]">
                            {(item.price * item.cartQuantity).toFixed(2)} kr
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-gray-800">Total</span>
                      <span className="text-2xl font-bold text-[#de3163]">
                        {total.toFixed(2)} kr
                      </span>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-3">
                      <button
                        onClick={payWithAccount}
                        disabled={accountBalance < total}
                        className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <Wallet className="w-5 h-5" />
                        Pay with Account Balance
                        {accountBalance < total && (
                          <span className="text-xs">
                            (Need {(total - accountBalance).toFixed(2)} kr more)
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

                      {/* Swish Number Input */}
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
                        onClick={generateSwishQR}
                        className="w-full px-6 py-3 bg-[#de3163] text-white font-semibold rounded-lg hover:bg-[#c72856] transition-all flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-5 h-5" />
                        Generate Swish QR
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowAddFundsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Add Funds to Account
            </h2>
            <p className="text-gray-600 mb-6">
              Add money to your account balance for quick payments
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Amount (kr)
              </label>
              <input
                type="number"
                value={fundsAmount}
                onChange={(e) => setFundsAmount(e.target.value)}
                placeholder="200"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#de3163] focus:ring-2 focus:ring-[#de3163]/20 focus:outline-none transition-all text-lg"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddFunds}
                className="flex-1 px-6 py-3 bg-[#de3163] text-white font-semibold rounded-lg hover:bg-[#c72856] transition-all"
              >
                Add Funds
              </button>
              <button
                onClick={() => setShowAddFundsModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {paymentMethod === "account" ? "Pay with Account" : "Swish Payment"}
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {paymentMethod === "account" 
                ? "Confirm payment from your account balance" 
                : "Scan with Swish app to pay"}
            </p>

            {paymentMethod === "swish" && qrCodeUrl && (
              <div className="flex justify-center mb-6">
                <img src={qrCodeUrl} alt="Swish QR Code" className="rounded-lg" />
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-gray-900">{total.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Items:</span>
                <span className="font-bold text-gray-900">{cart.length}</span>
              </div>
              {paymentMethod === "account" && (
                <>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-bold text-gray-900">{accountBalance.toFixed(2)} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">After Payment:</span>
                    <span className="font-bold text-green-600">{(accountBalance - total).toFixed(2)} kr</span>
                  </div>
                </>
              )}
            </div>

            {paymentMethod === "swish" && (
              <p className="text-xs text-gray-500 text-center mb-6">
                Scan this QR code with the Swish app to complete payment.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirmPayment}
                disabled={confirming}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {confirming ? (
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
                    Confirming...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
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
                    Confirm Payment
                  </>
                )}
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                disabled={confirming}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}