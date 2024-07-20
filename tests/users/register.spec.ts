import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { AppDataSource } from "../../src/config/data-source";
import { Roles } from "../../src/constants";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";

describe("POST /auth/register", () => {
    let connection: DataSource;

    // Create DB connection before all the test run
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    // drop table and synchronize for each testcase
    beforeEach(async () => {
        // Database drop and synchronize
        await connection.dropDatabase();
        await connection.synchronize();
    });

    // Destroy DB connection after all the test run
    afterAll(async () => {
        await connection.destroy();
    });

    // Happy path
    describe("Given all fields", () => {
        it("should return 201 status code", async () => {
            // follow AAA rules (Arrange, Act, Assert)
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
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
                password: "secret@123",
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
                password: "secret@123",
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
                password: "secret@123",
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

        it("should assign a customer role", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
            };

            //: Act
            await request(app).post("/auth/register").send(userData);

            //: Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0]).toHaveProperty("role");
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it("should store the hashed password in the database", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
            };

            //: Act
            await request(app).post("/auth/register").send(userData);

            //: Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find({ select: ["password"] });
            // console.log(users[0].password);
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2[a|b]\$\d+\$/);
        });

        it("should return 400 status code if email is already exists", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            const users = await userRepository.find();

            //: Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });

        it("should return access token and refresh token inside a cookie", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            interface Headers {
                ["set-cookie"]: string[];
            }

            let accessToken = null;
            let refreshToken = null;

            const cookies =
                (response.headers as unknown as Headers)["set-cookie"] || [];
            // const cookies: string[] = (response.headers["set-cookie"] ||
            //     []) as string[];

            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                }

                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0].split("=")[1];
                }
            });

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();

            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });

        it("should store refresh token in the database", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            const refreshTokenRepo = connection.getRepository(RefreshToken);
            // const tokens = await refreshTokenRepo.find();
            //! OR
            const tokens = await refreshTokenRepo
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    //?  :userId -> placeholder
                    // userId: (response.body as Record<string, string>).id,
                    userId: response.body.id,
                })
                .getMany();
            expect(tokens).toHaveLength(1);
        });
    });

    // Sad path
    describe("Fields are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "",
                password: "secret@123",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            // console.log(response.body);
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if firstName field is missing", async () => {
            //: Arrange
            const userData = {
                firstName: "",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            // console.log(response.body);
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if lastName field is missing", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "",
                email: "uddin@gmail.com",
                password: "secret@123",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if password field is missing", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            // console.log(response.body);
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
    });

    describe("Fields are not in proper format", () => {
        it("should trim the email field", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: " uddin@gmail.com ",
                password: "secret@123",
            };

            //: Act
            await request(app).post("/auth/register").send(userData);

            //: Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            const user = users[0];
            expect(user.email).toBe("uddin@gmail.com");
        });

        it("should return 400 status code if email is not a valid email", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin_gmail.com", // Invalid Email
                password: "secret@123",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if password length is less than 8 characters", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret", // Less than 8 char
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return an array of error messages if email is missing", async () => {
            //: Arrange
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "",
                password: "secret@123",
            };

            //: Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //: Assert
            // console.log(response.body);
            expect(response.body).toHaveProperty("error");
            expect(
                (response.body as Record<string, string>).error.length,
            ).toBeGreaterThan(0);
        });
    });
});
