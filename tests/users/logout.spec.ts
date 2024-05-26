//! This code giving me error!

import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import bcrypt from "bcrypt";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";

describe("POST /auth/logout", () => {
    let connection: DataSource;

    // Initialize DB connection before all test run
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    // For each test case drop the DB and synchronize
    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    // After all test case run destroy the DB connection
    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should logout the user", async () => {
            //: Arrange
            //- First, login to establish a session
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            //: Act
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.message).toBe("Login Successful.");

            // console.log(
            //     "Login Response Cookies: ",
            //     loginResponse.headers["set-cookie"],
            // );

            //- Logout using the same session
            /* const logoutResponse = await request(app)
                .post("/auth/logout")
                .set("Cookie", loginResponse.headers["set-cookie"]);

            // console.log("Logout Response: ", logoutResponse.body);

            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body.message).toBe("Logged out"); */
        });

        // it("should handle logout without an active session", async () => {
        //     const response = await request(app).post("/logout");
        //     expect(response.status).toBe(200);
        //     // expect(response.body.message).toBe("Logged out");
        // });
    });
});

//! This code giving me error!
