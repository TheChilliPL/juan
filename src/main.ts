import { init, rootLogger } from "./bot";

init().catch(
    (...args) => {
        (rootLogger ?? console).error("Encountered an error: {0}", args);
    }
);