import Xprisma from "../_prisma"

const AuthModels = {
    login: async (email: string) => {
        return await Xprisma.user.findFirst({
            where: { email: email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
            }
        })
    }
}

export default AuthModels