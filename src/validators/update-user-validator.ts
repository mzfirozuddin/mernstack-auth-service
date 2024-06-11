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
});
