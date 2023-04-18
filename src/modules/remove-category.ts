import * as Discord from "discord.js";
import {client} from "../bot";
import {getLocaleFor, getString, localizeObject} from "../localization";
import {BotModule} from "../modules";
import {ApplicationCommandData} from "discord.js";

export class RemoveCategoryModule extends BotModule {
    constructor() {
        super("RemoveCategoryModule");
    }

    override async createCommands(): Promise<ApplicationCommandData[]> {
        return [
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
            }
        ]
    }


    override async init() {
        client.on("interactionCreate", async interaction => {
            if (!interaction.isChatInputCommand()) return;
            if (interaction.commandName != "remove-category") return;

            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: getString("messages.remove-category.no_permissions", getLocaleFor(interaction))!,
                    ephemeral: true
                });
                return;
            }

            let category = interaction.options.getChannel("category", true) as Discord.CategoryChannel;

            let buttonUnlockMs = 10000;
            let buttonUnlockTime = new Date(Date.now() + buttonUnlockMs);
            let buttonUnlockTimestamp = Discord.time(buttonUnlockTime, Discord.TimestampStyles.RelativeTime);

            interaction.reply({
                content: getString("messages.remove-category.confirmation.question_countdown", getLocaleFor(interaction), {
                    placeholders: {
                        CATEGORY: category.name,
                        COUNT: category.children.cache.size.toString(),
                        BUTTON_UNLOCK_TIMESTAMP: buttonUnlockTimestamp
                    }
                }),
                components: [
                    {
                        type: Discord.ComponentType.ActionRow,
                        components: [
                            {
                                customId: "remove-category;",
                                type: Discord.ComponentType.Button,
                                emoji: "🗑",
                                label: getString("messages.remove-category.confirmation.yes", getLocaleFor(interaction))!,
                                style: Discord.ButtonStyle.Danger,
                                disabled: true
                            }
                        ]
                    }
                ],
                ephemeral: true
            }).then(/* ignore */);

            setTimeout(async () => {
                await interaction.editReply({
                    content: getString("messages.remove-category.confirmation.question", getLocaleFor(interaction), {
                        placeholders: {
                            CATEGORY: category.name,
                            COUNT: category.children.cache.size.toString()
                        }
                    }),
                    components: [
                        {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    customId: `remove-category;${category.id}`,
                                    type: Discord.ComponentType.Button,
                                    emoji: "🗑",
                                    label: getString("messages.remove-category.confirmation.yes", getLocaleFor(interaction))!,
                                    style: Discord.ButtonStyle.Danger
                                }
                            ]
                        }
                    ]
                });
            }, buttonUnlockMs);
        });

        client.on("interactionCreate", async interaction => {
            if (!interaction.isButton()) return;
            if (!interaction.customId.startsWith("remove-category;")) return;

            let categoryId = interaction.customId.split(";")[1];
            let category = client.channels.cache.get(categoryId) as Discord.CategoryChannel;

            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.Administrator)) {
                await interaction.update({
                    content: getString("messages.remove-category.no_permissions", getLocaleFor(interaction))!,
                    components: []
                });
                return;
            }

            await interaction.update({
                content: getString("messages.remove-category.start", getLocaleFor(interaction))!,
                components: []
            });

            // Remove every channel from the category
            let channels = Array.from(category.children.cache.values());
            await Promise.all(channels.map(async channel => channel.delete()));

            await category.delete();

            await interaction.editReply({
                content: getString("messages.remove-category.success", getLocaleFor(interaction))!,
            });
        })
    }
}
