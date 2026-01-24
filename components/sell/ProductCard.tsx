interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string | null;
}

interface ProductCardProps {
  product: Product;
  availableQuantity: number;
  onAddToCart: () => void;
}

export default function ProductCard({ product, availableQuantity, onAddToCart }: ProductCardProps) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#de3163] transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">{product.name}</h3>
          {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
        </div>
        <span className="text-lg font-bold text-[#de3163]">{product.price.toFixed(2)} kr</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Available: {availableQuantity}</span>
        <button
          onClick={onAddToCart}
          disabled={availableQuantity === 0}
          className="px-4 py-2 bg-[#de3163] text-white rounded-lg hover:bg-[#c72856] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm font-semibold"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}