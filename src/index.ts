import * as Discord from "discord.js";
import {logHelp, Parameter, parseArguments} from "./arguments";
import {initLocales} from "./localization";
import {addCommandListeners, registerCommands, removeCommands} from "./commands";
import * as dotenv from "dotenv";
dotenv.config();

export let client: Discord.Client<true>;

/**
 * Loads the config file and initializes the client.
 */
async function init() {
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
            "Guilds", "GuildVoiceStates"
        ]
    });

    await client.login(token);

    if(shouldRegisterCommands) {
        console.info("Registering commands");
        if(guilds.length > 0) console.info("Guild ID-s: " + guilds);
        for(let guild of guilds)
            await registerCommands(guild);
        if(guilds.length == 0) {
            console.info("All guilds");
            await registerCommands();
        }
        client.destroy();
        return;
    } else if(shouldRemoveCommands) {
        console.info("Removing commands");
        if(guilds.length > 0) console.info("Guild ID-s: " + guilds);
        for(let guild of guilds)
            await removeCommands(guild);
        if(guilds.length == 0) await removeCommands();
        client.destroy();
        return;
    }

    await addCommandListeners();

    console.info("Ready");
}

init().catch(console.error);