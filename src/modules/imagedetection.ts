import * as Discord from "discord.js";
import { BotModule } from "../modules";
import { client } from "..";
import sharp = require("sharp");
import { Cipher, Hash, createHash } from "crypto";
import { localizeObject } from "../localization";
import { JsonVault } from "../vault";

const enum ImageDetectionType {
    Disallowed = -1,
    Normal = 0,
    Ignored = 1
}

interface ImageDetectionVaultData {
    guilds?: {
        [guild: Discord.Snowflake]: {
            enabled: boolean,
            channels: {
                [channel: Discord.Snowflake]: {
                    enabled: boolean
                }
            },
            hashes: {
                [hash: string]: {
                    messages: Discord.Snowflake[],
                    type: ImageDetectionType
                }
            }
        }
    }
}

export class ImageDetectionModule extends BotModule {
    constructor() {
        super("ImageDetectionModule");
    }

    imageDetectionVault = new JsonVault<ImageDetectionVaultData>("image-detection");

    async getImageDetectionEnabled(guild: Discord.Guild, channel?: Discord.TextChannel): Promise<boolean> {
        if(channel) return (await this.getImageDetectionChannelEnabled(guild, channel)) ?? (await this.getImageDetectionEnabled(guild));

        await this.imageDetectionVault.load();
        return this.imageDetectionVault.data.guilds?.[guild.id]?.enabled ?? false;
    }

    async setImageDetectionEnabled(guild: Discord.Guild, enabled: boolean) {
        await this.imageDetectionVault.load();
        if(!this.imageDetectionVault.data.guilds) this.imageDetectionVault.data.guilds = {};
        if(!this.imageDetectionVault.data.guilds[guild.id]) this.imageDetectionVault.data.guilds[guild.id] = { enabled: false, channels: {}, hashes: {} };
        this.imageDetectionVault.data.guilds[guild.id].enabled = enabled;
        await this.imageDetectionVault.save();
    }

    async getImageDetectionChannelEnabled(guild: Discord.Guild, channel: Discord.TextChannel): Promise<boolean | null> {
        await this.imageDetectionVault.load();
        return this.imageDetectionVault.data.guilds?.[guild.id]?.channels?.[channel.id]?.enabled ?? null;
    }

    async setImageDetectionChannelEnabled(guild: Discord.Guild, channel: Discord.TextChannel, enabled: boolean) {
        await this.imageDetectionVault.load();
        if(!this.imageDetectionVault.data.guilds) this.imageDetectionVault.data.guilds = {};
        if(!this.imageDetectionVault.data.guilds[guild.id]) this.imageDetectionVault.data.guilds[guild.id] = { enabled: false, channels: {}, hashes: {} };
        if(!this.imageDetectionVault.data.guilds[guild.id].channels) this.imageDetectionVault.data.guilds[guild.id].channels = {};
        this.imageDetectionVault.data.guilds[guild.id].channels[channel.id] = { enabled };
        await this.imageDetectionVault.save();
    }

    async getReposts(guild: Discord.Guild, hash: string) {
        await this.imageDetectionVault.load();
        return this.imageDetectionVault.data.guilds?.[guild.id]?.hashes?.[hash]?.messages ?? [];
    }

    async addRepost(guild: Discord.Guild, hash: string, message: Discord.Message) {
        await this.imageDetectionVault.load();
        if(!this.imageDetectionVault.data.guilds) this.imageDetectionVault.data.guilds = {};
        if(!this.imageDetectionVault.data.guilds[guild.id]) this.imageDetectionVault.data.guilds[guild.id] = { enabled: false, channels: {}, hashes: {} };
        if(!this.imageDetectionVault.data.guilds[guild.id].hashes) this.imageDetectionVault.data.guilds[guild.id].hashes = {};
        if(!this.imageDetectionVault.data.guilds[guild.id].hashes[hash]) this.imageDetectionVault.data.guilds[guild.id].hashes[hash] = { messages: [], type: ImageDetectionType.Normal };
        this.imageDetectionVault.data.guilds[guild.id].hashes[hash].messages.push(message.id);
        await this.imageDetectionVault.save();
    }

    // Get the current reposts, return them, and add the currently given message
    async getAndAddReposts(guild: Discord.Guild, hash: string, message: Discord.Message) {
        let reposts = await this.getReposts(guild, hash);
        await this.addRepost(guild, hash, message);
        return reposts;
    }

    size = 16;
    colorDivisor = 16;

    async transformImage(buffer: ArrayBuffer): Promise<Buffer> {
        let resized = await sharp(buffer)
            .resize(this.size, this.size, { fit: "fill" })
            .ensureAlpha()
            .toColorspace("rgba")
            .raw()
            .toBuffer();

        for(let i = 0; i < this.size * this.size; i++) {
            let [r,g,b,a] = [i*4, i*4 + 1, i*4 + 2, i*4 + 3];
            const process = (index: number) => {
                resized[index] = Math.max(0, Math.min(Math.round(resized[index] / this.colorDivisor) * this.colorDivisor, 255));
            }

            if(resized[a] == 0) {
                resized[r] = resized[g] = resized[b] = resized[a] = 0;
                continue;
            }

            process(r);
            process(g);
            process(b);
            process(a);
        }

        return resized;
    }

    override async createCommands(): Promise<Discord.ApplicationCommandData[]> {
        return [
            {
                name: "repost-detection",
                ...localizeObject("commands.repost-detection"),
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        name: "enable",
                        ...localizeObject("commands.repost-detection.subcommands.enable"),
                        options: [
                            {
                                type: Discord.ApplicationCommandOptionType.Channel,
                                name: "channel",
                                ...localizeObject("commands.repost-detection.subcommands.enable.options.channel"),
                                // text based
                                channelTypes: Discord.Constants.GuildTextBasedChannelTypes
                            }
                        ]
                    },
                    {
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        name: "disable",
                        ...localizeObject("commands.repost-detection.subcommands.disable")
                    }
                ]
            }
        ];
    }


    override async init() {
        client.on("interactionCreate", async interaction => {
            if(!interaction.isChatInputCommand()) return;
            if(interaction.commandName != "repost-detection") return;

            let subcommand = interaction.options.getSubcommand(true);

            if(subcommand == "enable") {

            }
        });

        client.on("interactionCreate", async interaction => {
            if(!interaction.isMessageContextMenuCommand()) return;
            if(interaction.commandName != "Hash") return;

            let message = interaction.targetMessage;
            
            if(message.attachments.size == 0) {
                await interaction.reply({
                    content: "No image attached"
                });
                return;
            }

            let attachment = message.attachments.first()!;

            let buffer = await (await fetch(attachment.proxyURL)).arrayBuffer();

            let transformed = await this.transformImage(buffer);

            let raw = transformed.toString("hex");

            // MD-5 of the raw buffer
            let hash = createHash("md5").update(raw).digest("hex");

            let transformedPng = await sharp(transformed, {
                raw: {
                    width: this.size,
                    height: this.size,
                    channels: 4
                }
            })
                .resize({
                    width: 64,
                    kernel: "nearest"
                })
                .png()
                .toBuffer();

            await interaction.reply({
                content: "The hash of the image is:\n```" + hash + "```",
                files: [
                    new Discord.AttachmentBuilder(transformedPng, {
                        name: "hashed.png"
                    })
                ],
                ephemeral: true
            });
        });
    }
}