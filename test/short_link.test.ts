import supertest from "supertest";
import { web } from "../src/application/web";
import { logger } from "../src/application/logger";
import jwt from "jsonwebtoken";
import { AuthUserTest, ShortLinkTest } from "./test_util";
import { prismaClient } from "../src/application/database";

describe("POST /api/v1/short/", () => {
    afterAll(async () => {
        await ShortLinkTest.deleteMultiple();
    })

    it("should be reject store if header is invalid", async () => {
        const res = await supertest(web)
            .post("/api/v1/short/")
            .set("authorization", "")
            .set("x-control-user", "")
            .send({
                title: "",
                destination: "",
                path: "",
            });

        logger.info(res.body);
        expect(res.status).toBe(401)
        expect(res.body.status).toBe("ERROR")
        expect(res.body.code).toBe("UNAUTHORIZED")
    })

    it("should be reject store if body is invalid", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const response = await supertest(web)
            .post("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                title: "",
                destination: "",
                path: "",
            });
        expect(response.status).toBe(400)
        expect(response.body.status).toBe("ERROR")
        expect(response.body.code).toBe("ERROR_VALIDATION")
    })

    it("should be success store", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                title: "test_unit_test",
                destination: "https://google.com/",
                path: "tess",
            });

        logger.debug(response.body);
        expect(response.status).toBe(200)
        expect(response.body.status).toBe("OK")
        expect(response.body.code).toBe("SUCCESS_ADD_LINK")
    })

    it("should be failed store duplicate endpoint", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                title: "test_unit_test",
                destination: "https://google.com/",
                path: "tess",
            });

        logger.debug(response.body);
        expect(response.status).toBe(400)
        expect(response.body.status).toBe("ERROR")
        expect(response.body.code).toBe("DATA_ALREADY_EXIST")
    })

    it("should be failed store because title already exist", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                title: "test_unit_test",
                destination: "https://google.com/",
                path: "tess_2",
            });

        logger.info(response.body);
        expect(response.status).toBe(400)
        expect(response.body.status).toBe("ERROR")
        expect(response.body.code).toBe("DATA_ALREADY_EXIST")
    })

    it("should be failed store because path already exist", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const response = await supertest(web)
            .post("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                title: "test_unit_test_2",
                destination: "https://google.com/",
                path: "tess",
            });

        logger.info(response.body);
        expect(response.status).toBe(400)
        expect(response.body.status).toBe("ERROR")
        expect(response.body.code).toBe("DATA_ALREADY_EXIST")
    })

    it("should be success store other data", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const response = await supertest(web)
            .post("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                title: "test_unit_test_2",
                destination: "https://google.com/",
                path: "tess_2",
            });

        logger.info(response.body);
        expect(response.status).toBe(200)
        expect(response.body.status).toBe("OK")
        expect(response.body.code).toBe("SUCCESS_ADD_LINK")
    })
})

describe("GET /api/v1/short/", () => {
    beforeAll(async () => {
        await ShortLinkTest.addMultipleData();
    })
    afterAll(async () => {
        await ShortLinkTest.deleteMultiple();
    })

    it("should be reject get if header is invalid", async () => {
        const res = await supertest(web)
            .get("/api/v1/short/")
            .set("authorization", "")
            .set("x-control-user", "")
            .send({
                page: "",
                limit: "",
            });

        logger.debug(res.body);
        expect(res.status).toBe(401)
        expect(res.body.status).toBe("ERROR")
        expect(res.body.code).toBe("UNAUTHORIZED")
    })

    it("should be success get with 5 limit and page 1", async () => {
        const { id, token } = await AuthUserTest.login("superadmin@mail.com");
        const res = await supertest(web)
            .get("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .query({
                page: 1,
                limit: 5,
            });

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS")
        expect(res.body.data.paging.current_page).toBe(1)
        expect(res.body.data.paging.size).toBe(5)
        expect(res.body.data.paging.total_page).toBe(2)
        expect(res.body.data.data.length).toBe(5)
    })

    it("should be success get with 5 limit and page 2", async () => {
        const { id, token } = await AuthUserTest.login("superadmin@mail.com");
        const res = await supertest(web)
            .get("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .query({
                page: 2,
                limit: 5,
            });

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS")
        expect(res.body.data.paging.current_page).toBe(2)
        expect(res.body.data.paging.size).toBe(5)
        expect(res.body.data.paging.total_page).toBe(2)
        expect(res.body.data.data.length).toBe(5)
    })

    it("should be success get with 10 limit and page 1", async () => {
        const { id, token } = await AuthUserTest.login("superadmin@mail.com");
        const res = await supertest(web)
            .get("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .query({
                page: 1,
                limit: 10,
            });

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS")
        expect(res.body.data.paging.current_page).toBe(1)
        expect(res.body.data.paging.size).toBe(10)
        expect(res.body.data.paging.total_page).toBe(1)
        expect(res.body.data.data.length).toBe(10)
    })

    it("should be success get with 10 limit and page 2", async () => {
        const { id, token } = await AuthUserTest.login("superadmin@mail.com");
        const res = await supertest(web)
            .get("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .query({
                page: 2,
                limit: 10,
            });

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS")
        expect(res.body.data.paging.current_page).toBe(2)
        expect(res.body.data.paging.size).toBe(10)
        expect(res.body.data.paging.total_page).toBe(1)
        expect(res.body.data.data.length).toBe(0)
    })

    it("should be success search title", async () => {
        const { id, token } = await AuthUserTest.login("superadmin@mail.com");
        const res = await supertest(web)
            .get("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .query({
                page: 1,
                limit: 10,
                keyword: "test_unit_test 1",
            });

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS")
        expect(res.body.data.paging.current_page).toBe(1)
        expect(res.body.data.paging.size).toBe(10)
        expect(res.body.data.paging.total_page).toBe(1)
        expect(res.body.data.data.length).toBe(1)
    })

    it("should be success sort asc", async () => {
        const { id, token } = await AuthUserTest.login("superadmin@mail.com");
        const res = await supertest(web)
            .get("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .query({
                page: 1,
                limit: 10,
                sort: "asc",
            });

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS")
        expect(res.body.data.paging.current_page).toBe(1)
        expect(res.body.data.paging.size).toBe(10)
        expect(res.body.data.paging.total_page).toBe(1)
        expect(res.body.data.data.length).toBe(10)
        expect(res.body.data.data[0].title).toBe("test_unit_test 0")
    })

    it("should be success sort desc", async () => {
        const { id, token } = await AuthUserTest.login("superadmin@mail.com");
        const res = await supertest(web)
            .get("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .query({
                page: 1,
                limit: 10,
                sort: "desc",
            });

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS")
        expect(res.body.data.paging.current_page).toBe(1)
        expect(res.body.data.paging.size).toBe(10)
        expect(res.body.data.paging.total_page).toBe(1)
        expect(res.body.data.data.length).toBe(10)
        expect(res.body.data.data[0].title).toBe("test_unit_test 9")
    })
})

describe("PUT /api/v1/short/:id", () => {
    beforeAll(async () => {
        await ShortLinkTest.addMultipleData();
    })
    afterAll(async () => {
        await ShortLinkTest.deleteMultiple();
    })

    it("Should be failed no header", async () => {
        const res = await supertest(web)
            .put("/api/v1/short/tes")

        logger.debug(res.body);
        expect(res.status).toBe(401)
        expect(res.body.status).toBe("ERROR")
        expect(res.body.code).toBe("UNAUTHORIZED")
    })

    it("Should be failed no param send on endpoint", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");

        const res = await supertest(web)
            .put("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(res.body);
        expect(res.status).toBe(404)
    })

    it("Should be failed no data found", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");

        const res = await supertest(web)
            .put("/api/v1/short/tes")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                "title": "tes"
            })

        logger.debug(res.body);
        expect(res.status).toBe(404)
        expect(res.body.status).toBe("ERROR")
        expect(res.body.code).toBe("DATA_NOT_EXIST")
    })

    it("Should be failed no data found because deleted", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const findData = await prismaClient.dataUrl.findFirst({
            where: {
                title: "test_unit_test 1"
            },
            select: {
                id: true,
            }
        })
        await supertest(web)
            .delete("/api/v1/short/" + findData!.id)
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        const res = await supertest(web)
            .put("/api/v1/short/" + findData!.id)
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                "title": "tes"
            })

        logger.debug(res.body);
        expect(res.status).toBe(404)
        expect(res.body.status).toBe("ERROR")
        expect(res.body.code).toBe("DATA_NOT_EXIST")
    })

    it("Should be success edited", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const findData = await prismaClient.dataUrl.findFirst({
            where: {
                title: "test_unit_test 0"
            },
            select: {
                id: true,
            }
        })
        const res = await supertest(web)
            .put("/api/v1/short/" + findData!.id)
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                title: "test_unit_test_edited",
            })

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS_EDIT_LINK")

        const findDataEdited = await prismaClient.dataUrl.findFirst({
            where: {
                title: "test_unit_test_edited"
            },
            select: {
                title: true
            }
        })

        expect(findDataEdited!.title).toBe("test_unit_test_edited");
    })
})

describe("DELETE /api/v1/short/:id", () => {
    beforeAll(async () => {
        await ShortLinkTest.addMultipleData();
    });
    afterAll(async () => {
        await ShortLinkTest.deleteMultiple();
    })

    it("Should be failed no header", async () => {
        const res = await supertest(web)
            .delete("/api/v1/short/")

        logger.debug(res.body);
        expect(res.status).toBe(401)
        expect(res.body.status).toBe("ERROR")
        expect(res.body.code).toBe("UNAUTHORIZED")
    })

    it("Should be failed no param send on endpoint", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");

        const res = await supertest(web)
            .delete("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(res.body);
        expect(res.status).toBe(404)
    })

    it("Should be failed no data found", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");

        const res = await supertest(web)
            .delete("/api/v1/short/tes")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(res.body);
        expect(res.status).toBe(404)
        expect(res.body.status).toBe("ERROR")
        expect(res.body.code).toBe("DATA_NOT_EXIST")
    })

    it("Should be success delete data", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const findData = await prismaClient.dataUrl.findFirst({
            where: {
                title: "test_unit_test 0"
            },
            select: {
                id: true,
            }
        })

        const res = await supertest(web)
            .delete("/api/v1/short/" + findData!.id)
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(res.body);
        expect(res.status).toBe(200)
        expect(res.body.status).toBe("OK")
        expect(res.body.code).toBe("SUCCESS_DELETE_LINK")

        const resAfterDelete = await supertest(web)
            .delete("/api/v1/short/" + findData!.id)
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(resAfterDelete.body);
        expect(resAfterDelete.status).toBe(404)
        expect(resAfterDelete.body.status).toBe("ERROR")
        expect(resAfterDelete.body.code).toBe("DATA_NOT_EXIST")
    })

    it("should be success store deleted data", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/short/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                title: "test_unit_test 0",
                destination: "https://google.com/",
                path: "test_unit_test_path_0",
            });

        logger.debug(response.body);
        expect(response.status).toBe(200)
        expect(response.body.status).toBe("OK")
        expect(response.body.code).toBe("SUCCESS_ADD_LINK")
    })


})