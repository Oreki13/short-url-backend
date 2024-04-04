import {prismaClient} from "../src/application/database";

export class ShortLinkTest {
    static async deleteAddedShortLink() {
        const checkIfAvail = await prismaClient.dataUrl.findUnique({
            where: {
                title: "test_unit_test",
                user: {
                    email: "superadmin@mail.com"
                }
            }
        })

        if (checkIfAvail !== null) {
            await prismaClient.dataUrl.delete({
                where: {
                    title: "test_unit_test",
                    user: {
                        email: "superadmin@mail.com"
                    }
                }
            })
        }
    }
}