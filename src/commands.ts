import * as Discord from "discord.js";
import {ApplicationCommandData} from "discord.js";
import {client} from "./index";
import {localizeObject} from "./localization";
import {initVcmove} from "./commands/vcmove";
import {initRemoveCategory} from "./commands/remove-category";
import {initTimestamp} from "./commands/timestamp";
import {getDeepLCommands, initDeepLCommand} from "./commands/deepl";

export async function registerCommands(guild?: Discord.Snowflake) {
    const commands: ApplicationCommandData[] = [
        {
            name: "vcmove",
            ...localizeObject("commands.vcmove"),
            defaultMemberPermissions: Discord.PermissionFlagsBits.MoveMembers,
            options: [
                {
                    type: Discord.ApplicationCommandOptionType.Channel,
                    name: "from",
                    required: true,
                    ...localizeObject("commands.vcmove.options.from"),
                    channelTypes: [Discord.ChannelType.GuildVoice]
                },
                {
                    type: Discord.ApplicationCommandOptionType.Channel,
                    name: "to",
                    required: true,
                    ...localizeObject("commands.vcmove.options.to"),
                    channelTypes: [Discord.ChannelType.GuildVoice]
                }
            ]
        },
        {
            name: "remove-category",
            ...localizeObject("commands.remove-category"),
            defaultMemberPermissions: Discord.PermissionFlagsBits.Administrator,
            options: [
                {
                    type: Discord.ApplicationCommandOptionType.Channel,
                    name: "category",
                    required: true,
                    ...localizeObject("commands.remove-category.options.category"),
                    channelTypes: [Discord.ChannelType.GuildCategory]
                }
            ]
        },
        {
            name: "timestamp",
            ...localizeObject("commands.timestamp"),
            options: [
                {
                    type: Discord.ApplicationCommandOptionType.String,
                    name: "timestamp",
                    required: true,
                    ...localizeObject("commands.timestamp.options.timestamp")
                }
            ]
        },
        ...await getDeepLCommands()
    ];

    if (guild) {
        await client.application.commands.set(commands, guild!);
    } else {
        await client.application.commands.set(commands);
    }
}

export async function removeCommands(guild?: Discord.Snowflake) {
    if (guild) {
        await client.application.commands.set([], guild!);
    } else {
        await client.application.commands.set([]);
    }
}

export async function addCommandListeners() {
    await initVcmove();
    await initRemoveCategory();
    await initTimestamp();
    await initDeepLCommand();
}