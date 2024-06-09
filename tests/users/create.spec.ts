import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import createJWKSMock from "mock-jwks";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import request from "supertest";
import app from "../../src/app";
import { createTenant } from "../utils";
import { Tenant } from "../../src/entity/Tenant";

describe("POST /users", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    // Initialize DB connection before all test run
    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5000");
        connection = await AppDataSource.initialize();
    });

    // For each test case drop the DB and synchronize
    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(() => {
        jwks.stop();
    });

    // After all test case run destroy the DB connection
    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should persist the user in the database", async () => {
            //: Create tenant first
            const tenant = await createTenant(connection.getRepository(Tenant));

            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            });

            //: Register user
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
                tenantId: tenant.id,
                role: Roles.MANAGER,
            };

            //: Act  // Add token to cookie
            await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(userData);

            // console.log(response.body);

            //: Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].email).toBe(userData.email);
        });

        it("should create manager user", async () => {
            //: Create tenant first
            const tenant = await createTenant(connection.getRepository(Tenant));

            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            });

            //: Register user
            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
                tenantId: tenant.id,
                role: Roles.MANAGER,
            };

            //: Act  // Add token to cookie
            await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(userData);

            // console.log(response.body);

            //: Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].role).toBe(Roles.MANAGER);
        });

        it("should return 403 if non admin user tries to create a user", async () => {
            //: Create tenant first
            const tenant = await createTenant(connection.getRepository(Tenant));

            const managerToken = jwks.token({
                sub: "1",
                role: Roles.MANAGER,
            });

            const userData = {
                firstName: "Firoz",
                lastName: "Uddin",
                email: "uddin@gmail.com",
                password: "secret@123",
                tenantId: tenant.id,
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${managerToken}`])
                .send(userData);

            expect(response.statusCode).toBe(403);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(0);
        });
    });
});
