import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import bcrypt from 'bcrypt';

async function main() {
    const salt = await bcrypt.genSalt(10)
    const password = await bcrypt.hash('123', salt);
    const role = await prisma.roleUser.upsert({
        where: { id: '01' },
        update: {},
        create: {
            name: "superAdmin",
        }
    })

    await prisma.user.upsert({
        where: { email: 'superadmin@mail.com' },
        update: {},
        create: {
            email: "superadmin@mail.com",
            name: "Super Admin",
            password: password,
            is_deleted: 0,
            role_id: role.id
        }
    })
}

main().then(async () => {
    await prisma.$disconnect()
}).catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})