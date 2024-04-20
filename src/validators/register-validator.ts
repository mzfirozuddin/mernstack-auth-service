import { checkSchema } from "express-validator";

// export default [body("email").notEmpty().withMessage("Email is required!")];

//: Here we can use another syntax (schema validation)
export default checkSchema({
    email: {
        errorMessage: "Email is required!",
        notEmpty: true,
        trim: true,
    },
});
