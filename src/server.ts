import app from "./app";
import { Config } from "./config";
import { AppDataSource } from "./config/data-source";
import logger from "./config/logger";

const startServer = async () => {
    try {
        //: Database connection
        await AppDataSource.initialize();
        logger.info("Database connected successfully.");
        //: server listen
        app.listen(Config.PORT, () =>
            logger.info(`Listening on port ${Config.PORT}`),
        );
    } catch (err: unknown) {
        if (err instanceof Error) {
            logger.error(err.message);

            setTimeout(() => {
                process.exit(1);
            }, 1000);
        }
    }
};

startServer();
