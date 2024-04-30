import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import bcrypt from "bcrypt";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import request from "supertest";
import app from "../../src/app";
import { isJwt } from "../utils";

describe("POST /auth/login", () => {
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
        it("should return access token and refresh token inside a cookie", async () => {
            //: Arrange
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
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password });

            //: Assert
            interface Headers {
                ["set-cookie"]: string[];
            }

            let accessToken = null;
            let refreshToke = null;

            const cookies =
                (response.headers as unknown as Headers)["set-cookie"] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                }

                if (cookie.startsWith("refreshToke=")) {
                    refreshToke = cookie.split(";")[0].split("=")[1];
                }
            });

            expect(accessToken).not.toBeNull();
            expect(refreshToke).not.toBeNull();

            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToke)).toBeTruthy();
        });

        it("should return 400 status code if email or password is wrong", async () => {
            //: Arrange
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
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: "wrongPassword" });

            //: Assert
            expect(response.statusCode).toBe(400);
        });
    });
});
