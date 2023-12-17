import * as Discord from "discord.js";
import {Partials} from "discord.js";
import * as dotenv from "dotenv";

import {logHelp, Parameter, parseArguments} from "./arguments";
import {initLocales} from "./localization";
import {Logger, logManager} from "./logger";
import {DeepLModule} from "./modules/deepl";
import {BotModuleManager} from "./modules";
import {VCMoveModule} from "./modules/vcmove";
import {RemoveCategoryModule} from "./modules/remove-category";
import {TimestampModule} from "./modules/timestamp";
import {VCNotificationsModule} from "./modules/vcnotifications";
import {AutoReactModule} from "./modules/auto-react";
import {Scheduler} from "./concurrency/scheduler";
import {SimpleScheduler} from "./concurrency/simpleScheduler";

export let client: Discord.Client<true>;

export let rootLogger = new Logger(logManager, "Root");

export let moduleManager = new BotModuleManager();
export let scheduler: Scheduler = new SimpleScheduler();

/**
 * Loads the config file and initializes the client.
 */
export async function init() {
    dotenv.config();

    let logger = new Logger(logManager, "Initializer");

    let stopExecution = false;
    let shouldRegisterCommands = false;
    let shouldRemoveCommands = false;
    let guilds: Discord.Snowflake[] = [];
    const parameters: Parameter[] = [
        {
            name: "help",
            description: "Shows help dialog",
            aliases: ["h", "?"],
            execute: () => { logHelp(parameters); stopExecution = true; }
        },
        {
            name: "register-commands",
            aliases: ["C"],
            execute: () => { shouldRegisterCommands = true; }
        },
        {
            name: "remove-commands",
            execute: () => { shouldRemoveCommands = true; }
        },
        {
            name: "g",
            execute: g => guilds.push(g)
        }
    ];
    parseArguments(parameters);

    if(stopExecution) return;

    let token = process.env.TOKEN;
    if(!token) {
        throw new Error("No token found in environment variable TOKEN.");
    }

    await initLocales();

    client = new Discord.Client({
        intents: [
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.GuildVoiceStates,
            Discord.GatewayIntentBits.DirectMessages,
            Discord.GatewayIntentBits.GuildMessages
        ],
        partials: [
            Partials.Message,
            Partials.Reaction
        ]
    });

    await client.login(token);

    moduleManager.registerModules(
        new VCMoveModule(),
        new RemoveCategoryModule(),
        new TimestampModule(),
        new DeepLModule(),
        new VCNotificationsModule(),
        new AutoReactModule()
    );

    if(shouldRegisterCommands) {
        logger.info("Registering commands");
        if(guilds.length > 0) console.debug("Guild ID-s: " + guilds);
        for(let guild of guilds)
            await moduleManager.registerCommands(guild);
        if(guilds.length == 0) {
            logger.debug("All guilds");
            await moduleManager.registerCommands();
        }
        client.destroy();
        return;
    } else if(shouldRemoveCommands) {
        logger.info("Removing commands");
        if(guilds.length > 0) console.debug("Guild ID-s: " + guilds);
        for(let guild of guilds)
            await moduleManager.removeCommands(guild);
        if(guilds.length == 0) await moduleManager.removeCommands();
        client.destroy();
        return;
    }

    await moduleManager.init();

    logger.info("Ready and logged as @{0} (ID: {1}).", client.user.tag, client.user.id);
}
