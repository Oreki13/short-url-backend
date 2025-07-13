import supertest from "supertest";
import { web } from "../src/application/web";
import { logger } from "../src/application/logger";
import { AuthUserTest, RoleUserTest, UserTest } from "./test_util";


describe("GET /api/v1/user/", () => {
    beforeAll(async () => {
        await UserTest.createUser();
    });

    afterAll(async () => {
        await UserTest.deleteMultipleUser();
    });

    it("Should be error with no header", async () => {
        const response = await supertest(web)
            .get("/api/v1/user/")

        logger.debug(response.body)
        expect(response.status).toBe(401);
        expect(response.body.code).toBe("UNAUTHORIZED");
    })

    it("Should be error because login as user", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("user@mail.com");
        const response = await supertest(web)
            .get("/api/v1/user/")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .query({
                page: "1",
                limit: "5",
                sort: "asc",
            });

        logger.debug(response.body)
        expect(response.status).toBe(401);
        expect(response.body.code).toBe("UNAUTHORIZED");
        expect(response.body.message).toBe("Only admin can access this feature");
    })

    it("Should success get with login as admin", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const response = await supertest(web)
            .get("/api/v1/user")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .query({
                page: "1",
                limit: "5",
                sort: "asc",
            });

        logger.debug(response.body);
        expect(response.status).toBe(200)
        expect(response.body.data.paging.current_page).toBe(1)
        expect(response.body.data.paging.size).toBe(5)
        expect(response.body.data.data[0].name).toBe("Admin")
    })

    it("Should be get 5 user and ascending", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const response = await supertest(web)
            .get("/api/v1/user")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .query({
                page: "1",
                limit: "5",
                sort: "asc",
            });

        logger.debug(response.body);
        expect(response.status).toBe(200)
        expect(response.body.data.paging.current_page).toBe(1)
        expect(response.body.data.paging.size).toBe(5)
        expect(response.body.data.data[0].name).toBe("Admin")
    })

    it("Should be get 5 user and descending", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const response = await supertest(web)
            .get("/api/v1/user")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .query({
                page: "1",
                limit: "5",
                sort: "desc",
            });

        logger.debug(response.body);
        expect(response.status).toBe(200)
        expect(response.body.data.paging.current_page).toBe(1)
        expect(response.body.data.paging.size).toBe(5)
        expect(response.body.data.data[0].name).toBe("user_test_9")
    })

    it("Should be get 1 user with name user_test_9", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("superadmin@mail.com");
        const response = await supertest(web)
            .get("/api/v1/user")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .query({
                keyword: "user_test_9",
                page: "1",
                limit: "5",
                sort: "asc",
            });

        logger.debug(response.body);
        expect(response.status).toBe(200)
        expect(response.body.data.paging.current_page).toBe(1)
        expect(response.body.data.paging.size).toBe(5)
        expect(response.body.data.paging.total_data).toBe(1)
        expect(response.body.data.data[0].name).toBe("user_test_9")
    })
})

describe("POST /api/v1/user/create", () => {

    afterAll(async () => {
        await UserTest.deleteUser();
    })

    it("Should be error with no header", async () => {
        const { id, csrfToken, cookie } = await AuthUserTest.login('admin@mail.com');
        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "")
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.code).toBe("UNAUTHORIZED");
    })

    it("Should be error because login as user", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("user@mail.com");
        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.code).toBe("UNAUTHORIZED");
        expect(response.body.message).toBe("Only admin can access this feature");
    })

    it("Should be success because login as admin", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("ERROR_VALIDATION");
    })

    it("Should be error with no body", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.info(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("ERROR_VALIDATION");
    })

    it("Should be error with no input name", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                name: "",
                email: "test@example.com",
                password: "123",
                role_id: "123"
            })

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("ERROR_VALIDATION");
    })

    it("Should be error with no input email", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                name: "test",
                email: "",
                password: "123",
                role_id: "123"
            })

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("ERROR_VALIDATION");
    })

    it("Should be error with no input password", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                name: "test",
                email: "test@example.com",
                password: "",
                role_id: "123"
            })

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("ERROR_VALIDATION");
    })

    it("Should be error with no input roleid", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                name: "test",
                email: "test@example.com",
                password: "123",
                role_id: ""
            })

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("ERROR_VALIDATION");
    })

    it("Should be error with no roleid exist", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");

        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                name: "testxx",
                email: "testxx@example.com",
                password: "123",
                role_id: "xxx!@1@"
            })

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("ROLE_NOT_EXIST");
    })

    it("Should be success add user", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");

        const roleId = await RoleUserTest.findRoleName("user")

        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                name: "user_unit_test",
                email: "user_unit_test@example.com",
                password: "123",
                role_id: roleId!.id
            })

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.code).toBe("SUCCESS");
    })

    it("Should be failed add user because duplicate", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");

        const roleId = await RoleUserTest.findRoleName("user")
        const response = await supertest(web)
            .post("/api/v1/user/create")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)
            .send({
                name: "user_unit_test",
                email: "user_unit_test@example.com",
                password: "123",
                role_id: roleId!.id
            })

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("USER_ALREADY_EXISTS");
    })
})

describe("DELETE /api/v1/user/:id", () => {
    beforeAll(async () => {
        await UserTest.createOneUser();
    })

    afterAll(async () => {
        await UserTest.deleteUser();
    })

    it("Should be error with no header", async () => {
        const response = await supertest(web)
            .delete("/api/v1/user/wref")

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.code).toBe("UNAUTHORIZED");
    })

    it("Should be error because login as user", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("user@mail.com");
        const response = await supertest(web)
            .delete("/api/v1/user/wref")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.code).toBe("UNAUTHORIZED");
        expect(response.body.message).toBe("Only admin can access this feature");
    })

    it("Should be success login because login as admin", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const response = await supertest(web)
            .delete("/api/v1/user/wref")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.code).toBe("USER_NOT_EXIST");
    })

    it("Should be error because id not exist", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const response = await supertest(web)
            .delete("/api/v1/user/unknown")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.code).toBe("USER_NOT_EXIST");
    })

    it("Should be success delete user", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const findUser = await UserTest.findUserByEmail("user_unit_test@example.com")
        const response = await supertest(web)
            .delete("/api/v1/user/" + findUser!.id)
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.code).toBe("SUCCESS");
        expect(response.body.message).toBe("test_unit_test has been successfully deleted.");

        const findUserAfterDelete = await UserTest.findUserByEmail("user_unit_test@example.com")
        expect(findUserAfterDelete).toBe(null);
    })
})

describe("GET /api/v1/user/:id", () => {
    beforeAll(async () => {
        await UserTest.createOneUser();
    })
    afterAll(async () => {
        await UserTest.deleteUser();
    })

    it("Should be error with no header", async () => {
        const response = await supertest(web)
            .get("/api/v1/user/wref")

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.code).toBe("UNAUTHORIZED");
    })

    it("Should be error because login as user", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("user@mail.com");
        const response = await supertest(web)
            .get("/api/v1/user/wref")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.code).toBe("UNAUTHORIZED");
        expect(response.body.message).toBe("Only admin can access this feature");
    })

    it("Should be success login because login as user", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const response = await supertest(web)
            .get("/api/v1/user/wref")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.code).toBe("USER_NOT_EXIST");
    })

    it("Should be error because id not exist", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const response = await supertest(web)
            .get("/api/v1/user/unknown")
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.code).toBe("USER_NOT_EXIST");
    })

    it("Should be success find user", async () => {
        const { id, token, csrfToken, cookie } = await AuthUserTest.login("admin@mail.com");
        const findUser = await UserTest.findUserByEmail("user_unit_test@example.com")
        const response = await supertest(web)
            .get("/api/v1/user/" + findUser!.id)
            .set("authorization", "Bearer " + token)
            .set("x-control-user", id)
            .set("X-CSRF-Token", csrfToken)
            .set("Cookie", cookie)

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.code).toBe("SUCCESS");
        expect(response.body.data.name).toBe("test_unit_test");
        expect(response.body.data.email).toBe("user_unit_test@example.com");
    })
})