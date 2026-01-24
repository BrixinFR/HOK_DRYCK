import { Trash2, Plus, Minus } from "lucide-react";

interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    cartQuantity: number;
  };
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm text-gray-800">{item.name}</span>
        <button onClick={() => onRemove(item.id)} className="text-red-500 hover:text-red-700">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-semibold w-8 text-center">{item.cartQuantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
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
  );
}