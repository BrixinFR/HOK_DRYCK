
import { X } from "lucide-react";
import { useState } from "react";

interface AccountModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => void; // Add password parameter
  mode: "payment" | "add_funds";
  amount: number;
  itemCount?: number;
  currentBalance?: number;
  qrCodeUrl?: string | null;
  confirming: boolean;
}

export default function AccountModal({
  show,
  onClose,
  onConfirm,
  mode,
  amount,
  itemCount,
  currentBalance = 0,
  qrCodeUrl,
  confirming,
}: AccountModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!show) return null;

  const isPayment = mode === "payment";
  const isAddFunds = mode === "add_funds";

  function handleConfirm() {
    if (isPayment) {
      if (!password) {
        setError("Password is required");
        return;
      }
      // Remove hardcoded password check - let server validate
      setError("");
      onConfirm(password); // Pass password to parent
    } else {
      onConfirm(); // Add funds doesn't need password
    }
  }

  function handleClose() {
    setPassword("");
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {isAddFunds ? "Add Funds" : "Pay with Account"}
        </h2>

        {isAddFunds && qrCodeUrl && (
          <div className="flex justify-center mb-6">
            <img src={qrCodeUrl} alt="Swish QR Code" className="rounded-lg" />
          </div>
        )}

        <div className={`${isAddFunds ? 'bg-purple-50' : 'bg-gray-50'} rounded-lg p-4 mb-6`}>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">
              {isAddFunds ? "Amount to Add:" : "Amount:"}
            </span>
            <span className={`font-bold ${isAddFunds ? 'text-purple-600' : 'text-gray-900'}`}>
              {amount.toFixed(2)} kr
            </span>
          </div>
          
          {isPayment && itemCount !== undefined && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Items:</span>
              <span className="font-bold text-gray-900">{itemCount}</span>
            </div>
          )}
          
          {isPayment && (
            <>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-bold text-gray-900">{currentBalance.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">After Payment:</span>
                <span className="font-bold text-green-600">{(currentBalance - amount).toFixed(2)} kr</span>
              </div>
            </>
          )}
        </div>

        {isPayment && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Account Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter password"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                error 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-gray-200 focus:border-purple-600 focus:ring-purple-600/20'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
        )}

        {isAddFunds && (
          <p className="text-xs text-gray-500 text-center mb-6">
            Scan this QR code with the Swish app, then confirm below.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {confirming ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isPayment ? "Processing..." : "Confirming..."}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isAddFunds ? "Confirm Funds Added" : "Confirm Payment"}
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={confirming}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}