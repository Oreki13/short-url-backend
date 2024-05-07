import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()
import bcrypt from 'bcrypt';
import {prismaClient} from "../src/application/database";

async function main() {
    const salt = await bcrypt.genSalt(10)
    const password = await bcrypt.hash('123', salt);
    const roleSuperAdmin = await prisma.roleUser.upsert({
        where: {name: 'superAdmin'},
        update: {},
        create: {
            name: "superAdmin",
        },
    })

    const roleAdmin = await prismaClient.roleUser.upsert({
        where:{
            name: "admin",
        },
        update:{},
        create:{
            name: "admin",
        }
    });

    const roleUser = await prismaClient.roleUser.upsert({
        where:{
            name: "user",
        },
        update:{},
        create:{
            name: "user",
        }
    });

    await prismaClient.user.upsert({
        where:{
            email: "admin@mail.com",
        },
        update:{},
        create:{
            email: "admin@mail.com",
            name: "Admin",
            password: password,
            is_deleted: 0,
            role_id: roleAdmin.id
        }
    });

    await prismaClient.user.upsert({
        where:{
            email: "user@mail.com",
        },
        update:{},
        create:{
            email: "user@mail.com",
            name: "User",
            password: password,
            is_deleted: 0,
            role_id: roleUser.id
        }
    });

    await prisma.user.upsert({
        where: {email: 'superadmin@mail.com'},
        update: {},
        create: {
            email: "superadmin@mail.com",
            name: "Super Admin",
            password: password,
            is_deleted: 0,
            role_id: roleSuperAdmin.id
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