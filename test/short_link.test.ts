import supertest from "supertest";
import {web} from "../src/application/web";
import {logger} from "../src/application/logger";
import {afterAll, expect} from "@jest/globals";
import jwt from "jsonwebtoken";
import {ShortLinkTest} from "./test_util";

describe("POST /short/user", () => {
    afterAll(async ()=>{
        await ShortLinkTest.deleteAddedShortLink();
    })
    it("should be reject store if header is invalid", async () => {
        const res = await supertest(web)
            .post("/short/user")
            .set("authorization", "")
            .set("x-control-user", "")
            .send({
                title: "",
                destination: "",
                backHalf: "",
            });

        logger.debug(res.body);
        expect(res.status).toBe(401)
        expect(res.body.status).toBe("ERROR")
        expect(res.body.code).toBe("UNAUTHORIZED")
    })

    it("should be reject store if body is invalid", async () => {
        const loginResponse = await supertest(web)
            .post("/auth/login")
            .send({
                email: "superadmin@mail.com",
                password: "123"
            });
        const decode: any = jwt.decode(loginResponse.body.data)

        const response = await supertest(web)
            .post("/short/user")
            .set("authorization", "Bearer " + loginResponse.body.data)
            .set("x-control-user", decode!.id)
            .send({
                title: "",
                destination: "",
                backHalf: "",
            });

        logger.debug(response.body);
        expect(response.status).toBe(400)
        expect(response.body.status).toBe("ERROR")
        expect(response.body.code).toBe("ERROR_VALIDATION")
    })

    it("should be success store", async () => {
        const loginResponse = await supertest(web)
            .post("/auth/login")
            .send({
                email: "superadmin@mail.com",
                password: "123"
            });
        const decode: any = jwt.decode(loginResponse.body.data)

        const response = await supertest(web)
            .post("/short/user")
            .set("authorization", "Bearer " + loginResponse.body.data)
            .set("x-control-user", decode!.id)
            .send({
                title: "test_unit_test",
                destination: "https://google.com/",
                backHalf: "tess",
            });

        logger.debug(response.body);
        expect(response.status).toBe(200)
        expect(response.body.status).toBe("OK")
        expect(response.body.code).toBe("SUCCESS_ADD_LINK")
    })

    it("should be failed store duplicate endpoint", async () => {
        const login = await supertest(web)
            .post("/auth/login")
            .send({
                email: "superadmin@mail.com",
                password: "123"
            });
        const decode: any = jwt.decode(login.body.data)

        const response = await supertest(web)
            .post("/short/user")
            .set("authorization", "Bearer " + login.body.data)
            .set("x-control-user", decode!.id)
            .send({
                title: "test_unit_test",
                destination: "https://google.com/",
                backHalf: "tess",
            });

        logger.debug(response.body);
        expect(response.status).toBe(400)
        expect(response.body.status).toBe("ERROR")
        expect(response.body.code).toBe("DATA_ALREADY_EXIST")
    })
})