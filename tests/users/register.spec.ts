import request from "supertest";
import app from "../../src/app";

describe("POST /auth/register", () => {
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
    });
    describe("Fields are missing", () => {});
});
