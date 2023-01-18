import * as Discord from "discord.js";
import {Logger} from "./logger";
import {logManager} from "./index";

export interface MessageGeneratorOptions {
    limit?: number;
    before?: Discord.Snowflake;
    after?: Discord.Snowflake;
    cache?: boolean;
    filter?: (message: Discord.Message) => boolean;
}

export async function* generateMessages(manager: Discord.MessageManager, options: MessageGeneratorOptions = {}): AsyncGenerator<Discord.Message, void, void> {
    let logger: Logger = new Logger(logManager, "MessageGenerator");

    logger.debug("Generating messages with options: {0}", options);

    let remaining = options.limit ?? Infinity;
    let before = options.before;
    let after = options.after;
    let cache = options.cache ?? false;
    let filter = options.filter ?? (() => true);

    while (remaining > 0) {
        let fetchOptions: Discord.FetchMessagesOptions = {
            limit: Math.min(remaining, 100),
            before,
            after,
            cache
        };
        logger.verbose("Fetching messages with options: {0}", fetchOptions);
        let messages = await manager.fetch(fetchOptions);
        logger.verbose("Fetched {0} messages", messages.size);

        if (messages.size === 0) return;

        let first = messages.first();
        let last = messages.last();

        if (first === undefined || last === undefined) return;

        if(after)
            after = last.id;
        else
            before = last.id;

        for (let message of messages.values()) {
            if (!filter(message)) continue;

            yield message;
            remaining--;
        }
    }
}
