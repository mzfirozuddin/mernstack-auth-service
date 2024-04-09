import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { AppDataSource } from "../../src/config/data-source";
import { truncateTables } from "../utils";

describe("POST /auth/register", () => {
    let connection: DataSource;

    // Create DB connection before all the test run
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    // truncate table for each testcase
    beforeEach(async () => {
        // Database truncate
        await truncateTables(connection);
    });

    // Destroy DB connection after all the test run
    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return 201 status code", async () => {
            // follow AAA rules (Arrange, Act, Assert)
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );

            //: If any error occure then use this (here we typecast the response.header)
            // expect(
            //     (response.headers as Record<string, string>)["content-type"],
            // ).toEqual(expect.stringContaining("json"));
        });

        it("should persist the user in the database", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret",
            };

            //: Act
            await request(app).post("/auth/register").send(userData);

            //: Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });

        it("should return an id of the created user", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // eslint-disable-next-line no-console

            //: Assert
            expect(response.body).toHaveProperty("id");
            const repository = connection.getRepository(User);
            const users = await repository.find();
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            );
        });
    });
    describe("Fields are missing", () => {});
});
