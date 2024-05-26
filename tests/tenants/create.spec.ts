import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import app from "../../src/app";
import { Tenant } from "../../src/entity/Tenant";

describe("POST /tenants", () => {
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
        it("should return a 201 status code", async () => {
            const tenantData = {
                name: "Tenant name",
                address: "Tenant address",
            };

            const response = await request(app)
                .post("/tenants")
                .send(tenantData);

            expect(response.statusCode).toBe(201);
        });

        it("should create a tenent in the database", async () => {
            const tenantData = {
                name: "Tenant name",
                address: "Tenant address",
            };

            await request(app).post("/tenants").send(tenantData);

            const tenentRepository = connection.getRepository(Tenant);
            const tenants = await tenentRepository.find();

            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe(tenantData.name);
            expect(tenants[0].address).toBe(tenantData.address);
        });
    });
});
