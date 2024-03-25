import app from "./app";
import { Config } from "./config";

const startServer = () => {
    try {
        // eslint-disable-next-line no-console
        app.listen(Config.PORT, () =>
            // eslint-disable-next-line no-console
            console.log(`Listening on port ${Config.PORT}`),
        );
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        process.exit(1);
    }
};

startServer();
