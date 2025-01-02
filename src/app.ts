import "reflect-metadata";

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth";
import tenantRouter from "./routes/tenant";
import userRouter from "./routes/user";
import { Config } from "./config";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

const app = express();
app.use(
    cors({
        origin: [Config.CLIENT_URI as string],
        credentials: true,
    }),
);

app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

app.get("/", async (req, res) => {
    res.send("Hello from express Server");
});

//: Register routes
app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

//: Global Error handler middleware
app.use(globalErrorHandler);

//- ================ Global Error handler ==================
//! Improved error handling and shift this code to a separate file (globalErrorHandler.ts),
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/* 
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    // console.log(err);
    logger.error(err.message);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: "",
                location: "",
            },
        ],
    });
}); 
*/
//- ================================================

export default app;
