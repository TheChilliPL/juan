import * as Discord from "discord.js";
import {ApplicationCommandData} from "discord.js";
import {Logger} from "./logger";
import {client, logManager} from "./index";

export class BotModuleManager {
    protected logger: Logger = new Logger(logManager, "ModuleManager");

    readonly modules: BotModule[] = [];

    registerModule(module: BotModule) {
        this.modules.push(module);
    }

    registerModules(...modules: BotModule[]) {
        for(let module of modules) {
            this.registerModule(module);
        }
    }

    async registerCommands(guild?: Discord.Snowflake) {
        this.logger.info("Registering commands...");

        const commands = (await Promise.all(this.modules.map(module => module.createCommands()))).flat();

        this.logger.verbose("Commands: {0}", commands);

        if (guild) {
            await client.application.commands.set(commands, guild!);
        } else {
            await client.application.commands.set(commands);
        }
    }

    async removeCommands(guild?: Discord.Snowflake) {
        this.logger.info("Removing commands...");

        if (guild) {
            await client.application.commands.set([], guild!);
        } else {
            await client.application.commands.set([]);
        }
    }

    init() {
        this.logger.info("Initializing modules...");

        return Promise.all(this.modules.map(async module => {
            this.logger.info("Initializing module {0}...", module);
            await module.init();
        }));
    }
}

export abstract class BotModule {
    protected constructor(name: string) {
        this.name = name;
        this.logger = new Logger(logManager, this.name);

        this.logger.info("Constructed module {0}.", this.name);
    }

    readonly name: string;
    readonly logger: Logger;

    abstract createCommands(): Promise<ApplicationCommandData[]>;

    abstract init(): Promise<void>;
}
