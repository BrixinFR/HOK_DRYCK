'use client';

import Link from 'next/link';
import { BarChart3, Package, Plus, Settings, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import { UserButton } from '@stackframe/stack';
import { useEffect, useState } from 'react';

export default function Sidebar({
    currentPath = "/dashboard",
}: {
    currentPath: string;
}) {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetch('/api/check-admin')
            .then(res => res.json())
            .then(data => setIsAdmin(data.isAdmin))
            .catch(() => setIsAdmin(false));
    }, []);

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: BarChart3, adminOnly: false },
        { name: "Inventory", href: "/inventory", icon: Package, adminOnly: true },
        { name: "Add Product", href: "/add-product", icon: Plus, adminOnly: true },
        { name: "Sell Products", href: "/sell", icon: ShoppingCart, adminOnly: false },
        { name: "Account Payment", href: "/account-payment", icon: Wallet, adminOnly: false },
        { name: "Statistics", href: "/statistics", icon: TrendingUp, adminOnly: true },
        { name: "Settings", href: "/settings", icon: Settings, adminOnly: false },
    ];

    const visibleNavigation = navigation.filter(item => !item.adminOnly || isAdmin);

    return (
        <div className="fixed left-0 top-0 bg-gray-900 text-white w-64 min-h-screen p-6 z-10">
            <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-7 h-7"/>
                    <span className='text-lg font-semibold'>HØK DRYCK</span>
                </div>
            </div>
            <nav className='space-y-1'>
                <div className='text-xs font-semibold text-gray-400 uppercase mb-2'> 
                    Inventory 
                </div>

                {visibleNavigation.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = currentPath === item.href;
                    return (
                        <Link 
                            href={item.href} 
                            key={item.href} 
                            className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors ${
                                isActive 
                                    ? "bg-purple-600 text-white" 
                                    : "hover:bg-gray-800 text-gray-300"
                            }`}
                        >
                            <IconComponent className='w-5 h-5'/>
                            <span className='text-sm'>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className='absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700'>
                <div className='flex items-center justify-between'>
                    <UserButton showUserInfo/>
                </div>
            </div>
        </div>
    );
}