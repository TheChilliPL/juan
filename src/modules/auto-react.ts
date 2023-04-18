////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Auto React Module                                                                                                  //
//--------------------------------------------------------------------------------------------------------------------//
// Automatically adds reactions to messages in a channel.                                                             //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//TODO: Finish support for regex

import * as Discord from "discord.js";
import {BotModule} from "../modules";
import {getLocaleFor, getString, localizeObject} from "../localization";
import {client} from "../bot";
import {channel} from "diagnostics_channel";
import {JsonVault} from "../vault";
import {getEmotes} from "../utils";
import {generateMessages} from "../messageGenerator";

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

    async retroactiveAddReactions(channel: Discord.TextChannel, reactions: string[], regex?: RegExp): Promise<number> {
        // let messages = await channel.messages.fetch({
        //     limit: 200
        // });
        let messages = generateMessages(channel.messages, {
            filter: message => {
                return regex?.test(message.content) ?? true;
            }
        });
        let promises: Promise<void>[] = [];
        for await(let message of messages) {
            promises.push(new Promise<void>(async resolve => {
                for (let reaction of reactions) {
                    await message.react(reaction);
                }
                resolve();
            }));
        }
        await Promise.all(promises);
        return promises.length;
    }

    async retroactiveRemoveReactions(channel: Discord.TextChannel, reactions?: string[], regex?: RegExp, removeAllUsers: boolean = false): Promise<number> {
        let messages = generateMessages(channel.messages, {
            filter: message => {
                return regex?.test(message.content) ?? true;
            }
        });
        let promises: Promise<void>[] = [];
        for await(let message of messages) {
            promises.push(new Promise<void>(async (resolve) => {
                if(reactions) {
                    for (let reaction of reactions) {
                        if(removeAllUsers)
                            await message.reactions.resolve(reaction)?.remove();
                        else
                            await message.reactions.resolve(reaction)?.users?.remove(client.user);
                    }
                } else {
                    if(removeAllUsers)
                        await message.reactions.removeAll();
                    else
                        await Promise.all(message.reactions.valueOf().map(reaction => reaction.users.remove(client.user)))
                }
                resolve();
            }));
        }

        await Promise.all(promises);
        return promises.length;
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

                    this.logger.info("{0}", reactions);

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

                    await this.retroactiveAddReactions(channel, reactions);

                    await interaction.followUp({
                        content: getString("messages.auto-react.retroactive.finished", getLocaleFor(interaction))!,
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

                    await this.retroactiveRemoveReactions(channel, reactions, undefined, removeAllUsers);

                    await interaction.followUp({
                        content: getString("messages.auto-react.retroactive-remove.finished", getLocaleFor(interaction))!,
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
