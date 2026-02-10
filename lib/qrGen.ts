import { useState } from "react";
import QRCode from "qrcode";

export function useSwishQR() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  async function generateQR(phoneNumber: string, amount: number): Promise<boolean> {
    if (!phoneNumber.trim()) {
      alert("Please enter a Swish phone number");
      return false;
    }

    if (amount <= 0) {
      alert("Amount must be greater than 0");
      return false;
    }

    const cleanNumber = phoneNumber.replace(/\s/g, "").replace(/^\+46/, "");
    const swishQrData = `C${cleanNumber};${amount.toFixed(2)};;0`;

    try {
      const qr = await QRCode.toDataURL(swishQrData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      setQrCodeUrl(qr);
      return true;
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code");
      return false;
    }
  }

  function clearQR() {
    setQrCodeUrl(null);
  }

  return {
    qrCodeUrl,
    generateQR,
    clearQR,
  };
}