import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
    const user = await stackServerApp.getUser();
    if (!user) {
        redirect("/sign-in");
    }
    return user;
}

export async function syncAndGetUser() {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return null;
    
    await prisma.user.upsert({
        where: { id: stackUser.id },
        update: { 
            email: stackUser.primaryEmail || '',
            updatedAt: new Date() 
        },
        create: { 
            id: stackUser.id, 
            email: stackUser.primaryEmail || '',
            role: 'USER'
        },
    });
    
    return stackUser;
}

export async function isAdmin() {
    try {
        const stackUser = await stackServerApp.getUser();
        if (!stackUser) return false;
        
        await syncAndGetUser();
        
        const dbUser = await prisma.user.findUnique({
            where: { id: stackUser.id },
            select: { role: true }
        });
        
        return dbUser?.role === 'ADMIN';
    } catch {
        return false;
    }
}