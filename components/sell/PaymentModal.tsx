import { X } from "lucide-react";

interface UnifiedPaymentModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mode: "payment" | "add_funds";
  paymentMethod: "swish" | "account";
  qrCodeUrl: string | null;
  amount: number;
  itemCount?: number;
  accountBalance?: number;
  confirming: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordError: string;
}

const STANDARD_PASSWORD = "1234"; // Standard password for all users

export default function UnifiedPaymentModal({
  show,
  onClose,
  onConfirm,
  mode,
  paymentMethod,
  qrCodeUrl,
  amount,
  itemCount,
  accountBalance = 0,
  confirming,
  password,
  onPasswordChange,
  passwordError,
}: UnifiedPaymentModalProps) {
  if (!show) return null;

  const isAddFunds = mode === "add_funds";
  const isAccountPayment = paymentMethod === "account" && !isAddFunds;

  const title = isAddFunds 
    ? "Add Funds" 
    : paymentMethod === "account" 
      ? "Pay with Account" 
      : "Swish Payment";

  const description = isAddFunds
    ? "Scan with Swish to add funds to your account"
    : paymentMethod === "account"
      ? "Confirm payment from your account balance"
      : "Scan with Swish app to pay";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{title}</h2>
        <p className="text-gray-600 text-center mb-6">{description}</p>

        {/* Show QR Code for Swish payments or Add Funds */}
        {(paymentMethod === "swish" || isAddFunds) && qrCodeUrl && (
          <div className="flex justify-center mb-6">
            <img src={qrCodeUrl} alt="Swish QR Code" className="rounded-lg" />
          </div>
        )}

        {/* Payment/Funds Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-gray-900">{amount.toFixed(2)} kr</span>
          </div>
          
          {!isAddFunds && itemCount !== undefined && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Items:</span>
              <span className="font-bold text-gray-900">{itemCount}</span>
            </div>
          )}
          
          {isAccountPayment && (
            <>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-bold text-gray-900">{accountBalance.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">After Payment:</span>
                <span className="font-bold text-green-600">{(accountBalance - amount).toFixed(2)} kr</span>
              </div>
            </>
          )}
        </div>

        {/* Password Input for Account Payments */}
        {isAccountPayment && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Account Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter password (hint: 1234)"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                passwordError 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-gray-200 focus:border-[#de3163] focus:ring-[#de3163]/20'
              }`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Standard password for all users: 1234
            </p>
          </div>
        )}

        {/* Instructions for Swish */}
        {(paymentMethod === "swish" || isAddFunds) && (
          <p className="text-xs text-gray-500 text-center mb-6">
            {isAddFunds 
              ? "Scan this QR code with the Swish app, then confirm below."
              : "Scan this QR code with the Swish app to complete payment."}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {confirming ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Confirming...
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
            onClick={onClose}
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

export { STANDARD_PASSWORD };