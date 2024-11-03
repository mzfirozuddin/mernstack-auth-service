import { checkSchema } from "express-validator";

export default checkSchema(
    {
        currentPage: {
            // in: ["query"], //: If you mention in checkSchema's second parameter then no need to tell here
            // '2', undefined, 'jhgyufgh'
            customSanitizer: {
                options: (value) => {
                    const parsedValue = Number(value);
                    return Number.isNaN(parsedValue) ? 1 : parsedValue;
                },
            },
        },

        perPage: {
            customSanitizer: {
                // '2', undefined, 'jhgyufgh'
                options: (value) => {
                    const parsedValue = Number(value);
                    return Number.isNaN(parsedValue) ? 6 : parsedValue;
                },
            },
        },
    },
    ["query"],
);
