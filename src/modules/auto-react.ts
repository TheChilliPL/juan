////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Auto React Module                                                                                                  //
//--------------------------------------------------------------------------------------------------------------------//
// Automatically adds reactions to messages in a channel.                                                             //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//TODO: Finish support for regex

import * as Discord from "discord.js";
import {BotModule} from "../modules";
import {getLocaleFor, getString, localizeObject} from "../localization";
import {client, scheduler} from "../bot";
import {JsonVault} from "../vault";
import {getEmotes} from "../utils";
import {generateMessages} from "../messageGenerator";
import {PriorityConstants} from "../concurrency/scheduler";

interface AutoReactVaultData {
    autoReacts?: {
        [channel: Discord.Snowflake]: {
            reaction: string,
            regex?: string
        }[]
    }
}

export class AutoReactModule extends BotModule {
    constructor() {
        super("AutoReactModule");
    }

    vault = new JsonVault<AutoReactVaultData>("auto-reacts");

    async addReactions(channel: Discord.TextChannel, reactions: string[], regex?: RegExp) {
        await this.vault.load();
        if (!this.vault.data.autoReacts) this.vault.data.autoReacts = {};
        if (!this.vault.data.autoReacts[channel.id]) this.vault.data.autoReacts[channel.id] = [];
        this.vault.data.autoReacts[channel.id].push(...reactions.map(reaction => ({reaction, regex: regex?.source})));
        await this.vault.save();
    }

    async removeReactions(channel: Discord.TextChannel, reactions?: string[]): Promise<Boolean> {
        await this.vault.load();
        if(!this.vault.data.autoReacts) return false;
        if(!this.vault.data.autoReacts[channel.id]) return false;
        let count = this.vault.data.autoReacts[channel.id].length;
        if(reactions) {
            this.vault.data.autoReacts[channel.id] = this.vault.data.autoReacts[channel.id].filter(reaction => !reactions.includes(reaction.reaction));
            await this.vault.save();
            return this.vault.data.autoReacts[channel.id].length < count;
        } else {
            delete this.vault.data.autoReacts[channel.id];
            await this.vault.save();
            return true;
        }
    }

    async retroactiveAddReactions(
        channel: Discord.TextChannel,
        reactions: string[],
        regex?: RegExp
    ): Promise<number> {
        // let messages = await channel.messages.fetch({
        //     limit: 200
        // });
        let messages = generateMessages(channel.messages, {
            filter: message => {
                return regex?.test(message.content) ?? true;
            }
        });
        let reactionCount = 0;
        for await(let message of messages) {
            for (let reaction of reactions) {
                await scheduler.schedule(() => message.react(reaction), PriorityConstants.Idle);
                reactionCount++;
            }
        }

        return reactionCount;
    }

    async retroactiveRemoveReactions(
        channel: Discord.TextChannel,
        reactions?: string[],
        regex?: RegExp,
        removeAllUsers: boolean = false
    ): Promise<number> {
        let messages = generateMessages(channel.messages, {
            filter: message => {
                return regex?.test(message.content) ?? true;
            }
        });
        let reactionCount = 0;
        for await(let message of messages) {
            if(reactions) {
                for (let reaction of reactions) {
                    if(removeAllUsers) {
                        const r = message.reactions.resolve(reaction);
                        if(r != null) {
                            await scheduler.schedule(() => r.remove(), PriorityConstants.Idle);
                            reactionCount += r.count ?? 0;
                        }
                    } else {
                        const r = message.reactions.resolve(reaction);
                        if(r && r.me) {
                            // r?.remove() would remove all users
                            await scheduler.schedule(() => r.users.remove(client.user), PriorityConstants.Idle);
                            reactionCount++;
                        }
                    }
                }
            } else {
                if(removeAllUsers) {
                    let r = message.reactions;
                    reactionCount += r.valueOf().map(reaction => reaction.count).reduce((a, b) => a + b, 0);
                    await scheduler.schedule(() => r.removeAll(), PriorityConstants.Idle)
                } else {
                    let r = message.reactions.valueOf().filter(reaction => reaction.users.cache.has(client.user.id));
                    await Promise.all(
                        r.map(reaction => () => reaction.users.remove(client.user))
                            .map(func => scheduler.schedule(func, PriorityConstants.Idle))
                    );
                    reactionCount += r.size;
                }
            }
        }

        return reactionCount;
    }

    override async createCommands(): Promise<Discord.ApplicationCommandData[]> {
        return [
            {
                name: "auto-react",
                ...localizeObject("commands.auto-react"),
                defaultMemberPermissions: Discord.PermissionFlagsBits.ManageChannels,
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        name: "add",
                        ...localizeObject("commands.auto-react.subcommands.add"),
                        options: [
                            {
                                type: Discord.ApplicationCommandOptionType.Channel,
                                name: "channel",
                                required: true,
                                ...localizeObject("commands.auto-react.subcommands.add.options.channel"),
                                channelTypes: [Discord.ChannelType.GuildText]
                            },
                            {
                                type: Discord.ApplicationCommandOptionType.String,
                                name: "reactions",
                                required: true,
                                ...localizeObject("commands.auto-react.subcommands.add.options.reactions")
                            },
                            // {
                            //     type: Discord.ApplicationCommandOptionType.String,
                            //     name: "regex",
                            //     required: false,
                            //     ...localizeObject("commands.auto-react.subcommands.add.options.regex")
                            // }
                        ]
                    },
                    {
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        name: "remove",
                        ...localizeObject("commands.auto-react.subcommands.remove"),
                        options: [
                            {
                                type: Discord.ApplicationCommandOptionType.Channel,
                                name: "channel",
                                required: true,
                                ...localizeObject("commands.auto-react.subcommands.remove.options.channel"),
                                channelTypes: [Discord.ChannelType.GuildText]
                            },
                            {
                                type: Discord.ApplicationCommandOptionType.String,
                                name: "reactions",
                                required: false,
                                ...localizeObject("commands.auto-react.subcommands.remove.options.reactions")
                            }
                        ]
                    },
                    {
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        name: "retro-add",
                        ...localizeObject("commands.auto-react.subcommands.retro-add"),
                        options: [
                            {
                                type: Discord.ApplicationCommandOptionType.Channel,
                                name: "channel",
                                required: true,
                                ...localizeObject("commands.auto-react.subcommands.retro-add.options.channel"),
                                channelTypes: [Discord.ChannelType.GuildText]
                            },
                            {
                                type: Discord.ApplicationCommandOptionType.String,
                                name: "reactions",
                                required: true,
                                ...localizeObject("commands.auto-react.subcommands.retro-add.options.reactions")
                            },
                            // {
                            //     type: Discord.ApplicationCommandOptionType.String,
                            //     name: "regex",
                            //     required: false,
                            //     ...localizeObject("commands.auto-react.subcommands.retro-add.options.regex")
                            // }
                        ]
                    },
                    {
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        name: "retro-remove",
                        ...localizeObject("commands.auto-react.subcommands.retro-remove"),
                        options: [
                            {
                                type: Discord.ApplicationCommandOptionType.Channel,
                                name: "channel",
                                required: true,
                                ...localizeObject("commands.auto-react.subcommands.retro-remove.options.channel"),
                                channelTypes: [Discord.ChannelType.GuildText]
                            },
                            {
                                type: Discord.ApplicationCommandOptionType.String,
                                name: "reactions",
                                required: false,
                                ...localizeObject("commands.auto-react.subcommands.retro-remove.options.reactions")
                            },
                            // {
                            //     type: Discord.ApplicationCommandOptionType.String,
                            //     name: "regex",
                            //     required: false,
                            //     ...localizeObject("commands.auto-react.subcommands.retro-remove.options.regex")
                            // },
                            {
                                type: Discord.ApplicationCommandOptionType.Boolean,
                                name: "remove-all-users",
                                required: false,
                                ...localizeObject("commands.auto-react.subcommands.retro-remove.options.remove-all-users")
                            }
                        ]
                    }
                ]
            }
        ];
    }

    override async init() {
        client.on("interactionCreate", async interaction => {
            if(!interaction.isChatInputCommand()) return;
            if(interaction.commandName != "auto-react") return;

            switch(interaction.options.getSubcommand()) {
                case "add": {
                    let channel = interaction.options.getChannel("channel", true) as Discord.TextChannel;
                    let reactionsStr = interaction.options.getString("reactions", true);

                    let reactions = getEmotes(reactionsStr);

                    await this.addReactions(channel, reactions);

                    await interaction.reply({
                        content: getString("messages.auto-react.added", getLocaleFor(interaction))!,
                        ephemeral: true
                    });

                    break;
                }
                case "remove": {
                    let channel = interaction.options.getChannel("channel", true) as Discord.TextChannel;
                    let reactionsStr = interaction.options.getString("reactions", false);

                    let reactions = reactionsStr ? getEmotes(reactionsStr) : undefined;

                    if (await this.removeReactions(channel, reactions)) {
                        await interaction.reply({
                            content: getString("messages.auto-react.removed", getLocaleFor(interaction))!,
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: getString("messages.auto-react.not-found", getLocaleFor(interaction))!,
                            ephemeral: true
                        });
                    }

                    break;
                }
                case "retro-add": {
                    let channel = interaction.options.getChannel("channel", true) as Discord.TextChannel;
                    let reactionsStr = interaction.options.getString("reactions", true);

                    let reactions = getEmotes(reactionsStr);

                    await interaction.reply({
                        content: getString("messages.auto-react.retroactive.started", getLocaleFor(interaction))!,
                        ephemeral: true
                    });

                    let added = await this.retroactiveAddReactions(channel, reactions);

                    await interaction.followUp({
                        content: getString("messages.auto-react.retroactive.finished", getLocaleFor(interaction), {
                            placeholders: {
                                ADDED: added.toString()
                            }
                        })!,
                        ephemeral: true
                    });

                    break;
                }
                case "retro-remove": {
                    let channel = interaction.options.getChannel("channel", true) as Discord.TextChannel;
                    let reactionsStr = interaction.options.getString("reactions", false);

                    let reactions = reactionsStr ? getEmotes(reactionsStr) : undefined;

                    let removeAllUsers = interaction.options.getBoolean("remove-all-users", false) ?? undefined;

                    await interaction.reply({
                        content: getString("messages.auto-react.retroactive-remove.started", getLocaleFor(interaction))!,
                        ephemeral: true
                    });

                    let removed = await this.retroactiveRemoveReactions(channel, reactions, undefined, removeAllUsers);

                    await interaction.followUp({
                        content: getString("messages.auto-react.retroactive-remove.finished", getLocaleFor(interaction), {
                            placeholders: {
                                REMOVED: removed.toString()
                            }
                        })!,
                        ephemeral: true
                    });

                    break;
                }
            }
        });

        client.on("messageCreate", async message => {
            if(message.author.bot) return;

            await this.vault.load();

            let autoReacts = this.vault.data?.autoReacts?.[message.channel.id];

            if(!autoReacts) return;

            for(let autoReact of autoReacts) {
                await message.react(autoReact.reaction);
            }
        });
    }
}
