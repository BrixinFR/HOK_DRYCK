import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const demoUserId = "5b3d749b-8d79-494c-8f6a-673b0c7e08b4";

    // Create sample products
    await prisma.product.createMany({
        data: Array.from({ length: 25 }).map((_, i) => ({
            userId: demoUserId,
            name: `Product ${i + 1}`,
            price: (Math.random() * 90 + 10).toFixed(2),
            quantity: Math.floor(Math.random() * 20),
            lowStockAt: 5,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i * 5)),
        })),
    });

    console.log("Seed data created successfully!");
    console.log(`Created 25 products for user ID: ${demoUserId}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });