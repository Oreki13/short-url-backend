import { PrismaClient } from '@prisma/client'
const Xprisma = new PrismaClient({ log: ['query', 'info'] })

export default Xprisma