"use client";

import Sidebar from "@/components/sidebar";
import { confirmSale } from "@/lib/actions/sales";
import { addFunds, getAccountBalance } from "@/lib/actions/account";
import { useState, useEffect } from "react";
import { ShoppingCart, Wallet, DollarSign, User } from "lucide-react";
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

interface UserAccount {
  id: string;
  email: string;
  accountBalance: number;
}

export default function AccountPaymentPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"payment" | "add_funds">("payment");
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [accountBalance, setAccountBalance] = useState(0);
  const [addFundsAmount, setAddFundsAmount] = useState("");

  const swishQR = useSwishQR();

  useEffect(() => {
    fetchProducts();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchBalance();
    }
  }, [selectedUserId]);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/get-users");
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        alert(`Failed to fetch users: ${errorData.error || response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log("Users fetched:", data);
      
      if (!Array.isArray(data)) {
        console.error("Invalid response format:", data);
        alert("Invalid response format from server");
        return;
      }
      
      setUsers(data.map((u: any) => ({
        ...u,
        accountBalance: Number(u.accountBalance),
      })));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert(`Error fetching users: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingUsers(false);
    }
  }

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
    if (!selectedUserId) return;
    try {
      const balance = await getAccountBalance(selectedUserId);
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
    if (!selectedUserId) {
      alert("Please select a user account first");
      return;
    }
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
    if (!selectedUserId) {
      alert("Please select a user account first");
      return;
    }
    if (cart.length === 0) return;
    if (accountBalance < total) {
      alert(`Insufficient balance. Need ${(total - accountBalance).toFixed(2)} kr more.`);
      return;
    }
    setModalMode("payment");
    setShowModal(true);
  }

  async function initiateAddFunds() {
    if (!selectedUserId) {
      alert("Please select a user account first");
      return;
    }
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

  async function handleConfirm(password?: string) {
    if (!selectedUserId) return;

    if (modalMode === "add_funds") {
      const amount = parseFloat(addFundsAmount);
      setConfirming(true);
      try {
        await addFunds(selectedUserId, amount);
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
      // Process payment with password verification
      if (!password) {
        alert("Password is required");
        return;
      }

      setConfirming(true);
      try {
        await confirmSale(
          cart.map((item) => ({ id: item.id, quantity: item.cartQuantity })),
          "account",
          selectedUserId,
          password
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

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50">
      <Sidebar currentPath="/account-payment" />

      {/* User Selection & Balance Display */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 mb-4">
          {/* User Selector */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <User className="w-4 h-4" />
              Select Account
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setCart([]); // Clear cart when switching users
              }}
              disabled={loadingUsers}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none transition-all text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingUsers ? "Loading users..." : "-- Choose User --"}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            {!loadingUsers && users.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No users found in database</p>
            )}
          </div>

          {selectedUserId && (
            <>
              {/* Balance Display */}
              <div className="flex items-center gap-3 mb-3">
                <Wallet className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Account Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{accountBalance.toFixed(2)} kr</p>
                </div>
              </div>
              
              {/* Add Funds */}
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
            </>
          )}
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
          <p className="text-sm text-gray-600">
            {selectedUser ? `Paying with ${selectedUser.email}'s account` : 'Select a user account to continue'}
          </p>
        </div>

        {!selectedUserId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <User className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Select a User Account</h3>
                <p className="text-sm text-blue-700">
                  Please select a user account from the panel on the right to start shopping.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                disabled={!selectedUserId}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Available Products</h2>
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : !selectedUserId ? (
                <p className="text-gray-500 text-center py-8">Select a user account to view products</p>
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
                    disabled={cart.length === 0 || accountBalance < total || !selectedUserId}
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