import * as Discord from 'discord.js';
import {ApplicationCommandData} from "discord.js";
import {getLocaleFor, getString, localizeObject} from "../localization";
import {JsonVault} from "../vault";
import {Nullable} from "../utils";
import {client} from "../bot";
import * as deepl from "deepl-node";
import {SourceLanguageCode, TargetLanguageCode} from "deepl-node";
import {BotModule} from "../modules";

interface DeepLApiVaultData {
    apiKeys?: {
        [guild: Discord.Snowflake]: string
    }
}

export class DeepLModule extends BotModule {
    constructor() {
        super("DeepLModule");
    }

    deepLApiVault = new JsonVault<DeepLApiVaultData>("deepl-api");
    translators = new Map<Discord.Snowflake, deepl.Translator>();

    async getDeepLApiKey(guild: Discord.Guild): Promise<Nullable<string>> {
        await this.deepLApiVault.load();
        return this.deepLApiVault.data.apiKeys?.[guild.id] ?? null;
    }

    async setDeepLApiKey(guild: Discord.Guild, key: string) {
        await this.deepLApiVault.load();
        if(!this.deepLApiVault.data.apiKeys) this.deepLApiVault.data.apiKeys = {};
        this.deepLApiVault.data.apiKeys[guild.id] = key;
        await this.deepLApiVault.save();
    }

    async getTranslator(guild: Discord.Guild): Promise<Nullable<deepl.Translator>> {
        if (this.translators.has(guild.id)) return this.translators.get(guild.id)!;

        const key = await this.getDeepLApiKey(guild);
        if (key) {
            const translator = new deepl.Translator(key);
            this.translators.set(guild.id, translator);
            return translator;
        }

        return null;
    }

    async setTranslator(guild: Discord.Guild, translator: deepl.Translator) {
        this.translators.set(guild.id, translator);
    }

    override async createCommands(): Promise<ApplicationCommandData[]> {
        return [
            {
                name: "deepl",
                ...localizeObject("commands.deepl"),
                dmPermission: false,
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: "text",
                        required: true,
                        ...localizeObject("commands.deepl.options.text")
                    },
                    {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: "target",
                        required: true,
                        ...localizeObject("commands.deepl.options.target"),
                        autocomplete: true
                    },
                    {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: "source",
                        ...localizeObject("commands.deepl.options.source"),
                        autocomplete: true
                    }
                ]
            },
            {
                name: "deepl-config",
                ...localizeObject("commands.deepl-config"),
                dmPermission: false,
                defaultMemberPermissions: Discord.PermissionFlagsBits.ManageGuild,
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: "key",
                        required: false,
                        ...localizeObject("commands.deepl-config.options.key")
                    }
                ]
            }
        ];
    }

    override async init() {
        client.on("interactionCreate", async interaction => {
            if(!interaction.isChatInputCommand()) return;
            if(interaction.commandName !== "deepl-config") return;

            const guild = interaction.guild;
            if(!guild) return;
            const keyInput = interaction.options.getString("key");

            if(!keyInput) {
                let translator = await this.getTranslator(guild);

                if(translator) {
                    let usage = await translator.getUsage();
                    await interaction.reply({
                        content: getString("messages.deepl.usage", getLocaleFor(interaction), {
                            placeholders: {
                                USAGE: usage.toString()
                            }
                        })!,
                        ephemeral: true
                    });
                    return;
                } else {
                    await interaction.reply(getString("messages.deepl.no_key", getLocaleFor(interaction))!);
                    return;
                }
            }

            // Verifying the key
            const translator = new deepl.Translator(keyInput);
            try {
                await translator.getUsage();
                await this.setDeepLApiKey(guild, keyInput);
                await this.setTranslator(guild, translator);
                await interaction.reply({
                    content: getString("messages.deepl.key_set", getLocaleFor(interaction))!,
                    ephemeral: true
                });
            } catch(e) {
                if(e instanceof deepl.AuthorizationError) {
                    await interaction.reply({
                        content: getString("messages.deepl.invalid_key")!,
                        ephemeral: true
                    });
                } else throw e;
            }
        });

        client.on("interactionCreate", async interaction => {
            if(!interaction.isChatInputCommand()) return;
            if(interaction.commandName !== "deepl") return;

            const guild = interaction.guild;
            if(!guild) return;
            const translator = await this.getTranslator(guild);

            if(!translator) {
                await interaction.reply({
                    content: getString("messages.deepl.no_key", getLocaleFor(interaction))!,
                    ephemeral: true
                });
                return;
            }

            const text = interaction.options.getString("text", true);
            const source = interaction.options.getString("source") ?? "auto";
            const target = interaction.options.getString("target", true);

            let translation = await translator.translateText(
                text,
                source === "auto" ? null : source as SourceLanguageCode,
                target as TargetLanguageCode,
                {
                    preserveFormatting: true
                }
            );

            await interaction.reply({
                content: getString("messages.deepl.translation", getLocaleFor(interaction), {
                    placeholders: {
                        TRANSLATION: translation.text
                    }
                })!
            });
        });

        client.on("interactionCreate", async interaction => {
            if(!interaction.isAutocomplete()) return;
            if(interaction.commandName !== "deepl") return;

            let translator = await this.getTranslator(interaction.guild!);

            if(!translator) return interaction.respond([]);

            let focusedOption = interaction.options.getFocused(true);

            let languages = focusedOption.name === "source" ? await translator.getSourceLanguages() : await translator.getTargetLanguages();

            return interaction.respond(languages.filter(language => {
                return language.name.toLowerCase().includes(focusedOption.value.toLowerCase())
                    || language.code.toLowerCase().includes(focusedOption.value.toLowerCase());
            }).slice(0, 25).map(language => {
                return {
                    name: language.name,
                    value: language.code
                };
            }));
        });
    }
}
