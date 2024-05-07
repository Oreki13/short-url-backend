import supertest from "supertest"
import {web} from "../src/application/web";
import {logger} from "../src/application/logger";
import {expect} from "@jest/globals";

describe("POST /auth/login", ()=>{
    it("should be reject login if request is invalid", async ()=>{
        const response = await supertest(web)
            .post("/auth/login")
            .send({
                "email": "",
                "password": ""
            });

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("ERROR_VALIDATION")
    })

    it("should be user unregister", async ()=>{
        const response = await supertest(web)
            .post("/auth/login")
            .send({
                "email": "tes@mail.com",
                "password": "tes",
            });

        logger.debug(response.body);
        expect(response.status).toBe(404)
        expect(response.body.code).toBe("INVALID_CREDENTIAL")
    })

    it("should be invalid password", async ()=>{
        const response = await supertest(web)
            .post("/auth/login")
            .send({
                "email": "superadmin@mail.com",
                "password": "tes",
            });

        logger.debug(response.body);
        expect(response.status).toBe(404)
        expect(response.body.code).toBe("INVALID_CREDENTIAL")
    })

    it("should be success login", async ()=>{
        const response = await supertest(web)
            .post("/auth/login")
            .send({
                "email": "superadmin@mail.com",
                "password": "123",
            });

        logger.debug(response.body);
        expect(response.status).toBe(200)
        expect(response.body.code).toBe("LOGIN_SUCCESS")
    })
})