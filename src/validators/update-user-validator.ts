import { checkSchema } from "express-validator";

export default checkSchema({
    firstName: {
        errorMessage: "FirstName is required!",
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: "LastName is required!",
        notEmpty: true,
        trim: true,
    },
    role: {
        errorMessage: "Role is required!",
        notEmpty: true,
        trim: true,
    },
    tenantId: {
        // notEmpty: true,
        // errorMessage: "Tenant is required!",
        // trim: true,
        custom: {
            options: (value: string, { req }) => {
                const role = req.body.role;
                if (role === "admin") {
                    return true;
                } else {
                    if (value === "") {
                        throw new Error("Tenant is required!");
                    }
                    return !!value;
                }
            },
        },
    },
});
