import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        notEmpty: true,
        trim: true,
        errorMessage: "Email is required!",
        isEmail: {
            errorMessage: "Email must be a valid email address!",
        },
    },

    password: {
        errorMessage: "Password is required!",
        notEmpty: true,
        trim: true,
    },
});
