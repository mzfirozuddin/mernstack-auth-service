import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        errorMessage: "Email is required!",
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: "Email must be a valid email address",
        },
    },
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
    password: {
        errorMessage: "Password is required!",
        notEmpty: true,
        trim: true,
        isLength: {
            options: {
                min: 8,
            },
            errorMessage: "Password length should be at least 8 chars!",
        },
    },
    role: {
        errorMessage: "Role is required!",
        notEmpty: true,
        trim: true,
    },
});
