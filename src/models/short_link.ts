import { DataUrl } from "@prisma/client"
import Xprisma from "../_prisma"

const ShortLinkModels = {
    getAll: (page: number, limit: number, userId: string) => {
        return Xprisma.dataUrl.findMany({
            select: {
                id: true,
                title: true,
                back_half: true,
                count_clicks: true,
                createdAt: true,
                destination: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                is_deleted: false
            },
            skip: page * limit,
            take: limit,
            where: { is_deleted: 0, user_id: userId },
            orderBy: {
                createdAt: 'asc'
            }

        })
    },
    store: (data: DataUrl) => {
        return Xprisma.dataUrl.create({
            data: data
        })
    },
    count: () => {
        return Xprisma.dataUrl.count({
            where: { is_deleted: 0 }
        })
    }
}

export default ShortLinkModels