import * as Discord from "discord.js";
import {BotModule} from "../modules";
import {ApplicationCommandData, DiscordAPIError} from "discord.js";
import {getLocaleFor, getString, localizeObject} from "../localization";
import {client} from "../index";

export class ServerLangModule extends BotModule {
    constructor() {
        super("ServerLangModule");
    }

    static readonly locales = [
        {
            "locale": "id",
            "name": "Indonesian",
            "englishName": "Bahasa Indonesia"
        },
        {
            "locale": "da",
            "name": "Danish",
            "englishName": "Dansk"
        },
        {
            "locale": "de",
            "name": "German",
            "englishName": "Deutsch"
        },
        {
            "locale": "en-GB",
            "name": "English, UK",
            "englishName": "English, UK"
        },
        {
            "locale": "en-US",
            "name": "English, US",
            "englishName": "English, US"
        },
        {
            "locale": "es-ES",
            "name": "Spanish",
            "englishName": "Español"
        },
        {
            "locale": "fr",
            "name": "French",
            "englishName": "Français"
        },
        {
            "locale": "hr",
            "name": "Croatian",
            "englishName": "Hrvatski"
        },
        {
            "locale": "it",
            "name": "Italian",
            "englishName": "Italiano"
        },
        {
            "locale": "lt",
            "name": "Lithuanian",
            "englishName": "Lietuviškai"
        },
        {
            "locale": "hu",
            "name": "Hungarian",
            "englishName": "Magyar"
        },
        {
            "locale": "nl",
            "name": "Dutch",
            "englishName": "Nederlands"
        },
        {
            "locale": "no",
            "name": "Norwegian",
            "englishName": "Norsk"
        },
        {
            "locale": "pl",
            "name": "Polish",
            "englishName": "Polski"
        },
        {
            "locale": "pt-BR",
            "name": "Portuguese, Brazilian",
            "englishName": "Português do Brasil"
        },
        {
            "locale": "ro",
            "name": "Romanian, Romania",
            "englishName": "Română"
        },
        {
            "locale": "fi",
            "name": "Finnish",
            "englishName": "Suomi"
        },
        {
            "locale": "sv-SE",
            "name": "Swedish",
            "englishName": "Svenska"
        },
        {
            "locale": "vi",
            "name": "Vietnamese",
            "englishName": "Tiếng Việt"
        },
        {
            "locale": "tr",
            "name": "Turkish",
            "englishName": "Türkçe"
        },
        {
            "locale": "cs",
            "name": "Czech",
            "englishName": "Čeština"
        },
        {
            "locale": "el",
            "name": "Greek",
            "englishName": "Ελληνικά"
        },
        {
            "locale": "bg",
            "name": "Bulgarian",
            "englishName": "български"
        },
        {
            "locale": "ru",
            "name": "Russian",
            "englishName": "Pусский"
        },
        {
            "locale": "uk",
            "name": "Ukrainian",
            "englishName": "Українська"
        },
        {
            "locale": "hi",
            "name": "Hindi",
            "englishName": "हिन्दी"
        },
        {
            "locale": "th",
            "name": "Thai",
            "englishName": "ไทย"
        },
        {
            "locale": "zh-CN",
            "name": "Chinese, China",
            "englishName": "中文"
        },
        {
            "locale": "ja",
            "name": "Japanese",
            "englishName": "日本語"
        },
        {
            "locale": "zh-TW",
            "name": "Chinese, Taiwan",
            "englishName": "繁體中文"
        },
        {
            "locale": "ko",
            "name": "Korean",
            "englishName": "한국어"
        }
    ];

    override async createCommands(): Promise<ApplicationCommandData[]> {
        return [
            {
                name: "server-lang",
                ...localizeObject("commands.server-lang"),
                defaultMemberPermissions: Discord.PermissionFlagsBits.ManageGuild,
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        name: "get",
                        ...localizeObject("commands.server-lang.subcommands.get")
                    },
                    {
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        name: "set",
                        ...localizeObject("commands.server-lang.subcommands.set"),
                        options: [
                            {
                                type: Discord.ApplicationCommandOptionType.String,
                                name: "lang",
                                required: true,
                                ...localizeObject("commands.server-lang.subcommands.set.options.lang"),
                                autocomplete: true
                            }
                        ]
                    }
                ]
            }
        ]
    }

    override async init() {
        client.on("interactionCreate", async interaction => {
            if (!interaction.isChatInputCommand()) return;
            if (interaction.commandName != "server-lang") return;

            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.ManageGuild)) {
                await interaction.reply({
                    content: getString("messages.no_permission", getLocaleFor(interaction)),
                    ephemeral: true
                });
                return;
            }

            switch(interaction.options.getSubcommand()) {
                case "get":
                    await interaction.reply({
                        content: getString("messages.server-lang.get.response", getLocaleFor(interaction), {
                            placeholders: {
                                LANG: interaction.guild?.preferredLocale?.toString() ?? "null"
                            }
                        }),
                        ephemeral: true
                    });
                    break;

                case "set":
                    let lang = interaction.options.getString("lang", true);

                    try {
                        await interaction.guild?.setPreferredLocale(lang as Discord.Locale);
                    } catch(e) {
                        if(e instanceof DiscordAPIError) {
                            await interaction.reply({
                                content: getString("messages.api_error", getLocaleFor(interaction), {
                                    placeholders: {
                                        ERROR_CODE: e.code.toString(),
                                        ERROR_NAME: e.name,
                                        ERROR_MESSAGE: e.message
                                    }
                                }),
                                ephemeral: true
                            });
                            return;
                        }
                    }

                    await interaction.reply({
                        content: getString("messages.server-lang.set.success", getLocaleFor(interaction), {
                            placeholders: {
                                LANG: lang
                            }
                        }),
                        ephemeral: true
                    });

                    break;
            }
        });

        client.on("interactionCreate", async interaction => {
            if(!interaction.isAutocomplete()) return;
            if(interaction.commandName != "server-lang") return;
            let focusedOption = interaction.options.getFocused(true);
            if(focusedOption.name != "lang") return;

            await interaction.respond(
                ServerLangModule.locales
                    .map(
                        locale => {
                            return { value: locale.locale, name: `${locale.name} (${locale.englishName})` }
                        }
                    )
                    .filter(
                        locale => locale.value.toLowerCase().includes(focusedOption.value.toLowerCase())
                            || locale.name.toLowerCase().includes(focusedOption.value.toLowerCase())
                    )
                    .slice(0, 25)
            )
        });
    }
}
