import Pagination from "@/components/Pagination";
import Sidebar from "@/components/sidebar";
import DeleteProductButton from "@/components/DeleteProductButton";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Add type for Product matching Prisma schema
interface Product {
    id: string;
    name: string;
    userId: string;
    sku: string | null;
    price: Decimal;
    quantity: number;
    lowStockAt: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export default async function InventoryPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string, page?: string}>;
}) {

    const user = await getCurrentUser();
    const isUserAdmin = await isAdmin();

    const pageSize = 10;
    const params = await searchParams;
    const q = (params.q ?? "").trim();
    const page = Math.max(1, Number(params.page ?? 1));

    const where = {
        ...( q ? {name: {contains: q, mode: "insensitive" as const} } : {}),
    };

    const [totalCount, items] = await Promise.all([
        prisma.product.count({where}),
        prisma.product.findMany({ 
            where,
            orderBy: {createdAt: "desc"},
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount/pageSize));

    return(
    <div className="min-h-screen bg-gray-50">
        <Sidebar currentPath="/inventory" />
            <main className="ml-64 p-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Inventory
                            </h1>
                            <p className="text-sm text-gray-500">
                                Manage your products and track inventory levels.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* Search */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <form className="flex gap-2" action="/inventory" method="GET">
                            <input type="text" 
                                name="q"
                                defaultValue={q}
                                placeholder="Search products..." 
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-transparent"
                            />
                            <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                Search
                            </button>
                        </form>
                    </div>

                    {/*Products Table*/}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>   
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock At</th>
                                    {isUserAdmin && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    )}
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((product: Product, key: number) => (
                                    <tr key={key} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-s text-gray-500">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 text-s text-gray-500">
                                            {product.sku || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-s text-gray-500">
                                            {Number(product.price).toFixed(2)} kr
                                        </td>
                                        <td className="px-6 py-4 text-s text-gray-500">
                                            {product.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-s text-gray-500">
                                            {product.lowStockAt || "-"}
                                        </td>
                                        {isUserAdmin && (
                                            <td className="px-6 py-4 text-s text-gray-500">
                                                <DeleteProductButton productId={product.id} />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>  

                    {totalPages > 1 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <Pagination 
                                currentPage={page} 
                                totalPages={totalPages}
                                baseUrl="/inventory"
                                searchParams={{
                                    q,
                                    pageSize: String(pageSize),
                                }}
                            />
                        </div>
                    )}
                </div>

            </main>
        </div>
    )    
}