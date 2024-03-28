import request from "supertest";
import { calculateDiscount } from "./src/util";
import app from "./src/app";

describe("App", () => {
    // test("should work", () => {});
    //- We can use "it" instead of test
    it("should calculate the discount", () => {
        const result = calculateDiscount(100, 10);
        expect(result).toBe(10);
        // .toBe() is a matcher, result should be match with 10.
    });

    it("should return 200 status", async () => {
        const response = await request(app).get("/").send();
        expect(response.statusCode).toBe(200);
    });
});
