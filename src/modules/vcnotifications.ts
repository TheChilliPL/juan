import * as Discord from "discord.js";
import {client} from "../bot";
import {JsonVault} from "../vault";
import {getLocaleFor, getString, localizeObject} from "../localization";
import {BotModule} from "../modules";

interface VcNotificationsVaultData {
    notifications?: {
        [vc: Discord.Snowflake]: boolean
    }
}

export class VCNotificationsModule extends BotModule {
    constructor() {
        super("VCNotificationsModule");
    }

    vcNotificationsVault = new JsonVault<VcNotificationsVaultData>("vc-notifications");

    async getVcNotificationsEnabled(channel: Discord.VoiceChannel): Promise<boolean> {
        await this.vcNotificationsVault.load();
        return this.vcNotificationsVault.data.notifications?.[channel.id] ?? false;
    }

    async setVcNotificationsEnabled(channel: Discord.VoiceChannel, enabled: boolean) {
        await this.vcNotificationsVault.load();
        if (!this.vcNotificationsVault.data.notifications) this.vcNotificationsVault.data.notifications = {};
        this.vcNotificationsVault.data.notifications[channel.id] = enabled;
        await this.vcNotificationsVault.save();
    }

    async sendUpdate(channel: Discord.VoiceChannel, member: Discord.GuildMember, timestamp: Date, joined: boolean) {
        const locale = getLocaleFor(channel);

        let embed: Discord.APIEmbed = {
            description: getString(
                "messages.vcnotifications." + (joined ? "joined" : "left"),
                locale,
                {
                    placeholders: {
                        USER: member.toString(),
                        CHANNEL: channel.toString()
                    }
                }
            )!,
            color: joined ? 0x00ff00 : 0xff0000,
            timestamp: timestamp.toISOString()
        };

        await channel.send({
            embeds: [embed]
        });
    }

    override async createCommands(): Promise<Discord.ApplicationCommandData[]> {
        return [
            {
                name: "vcnotifications",
                ...localizeObject("commands.vcnotifications"),
                defaultMemberPermissions: Discord.PermissionFlagsBits.ManageChannels,
                dmPermission: false,
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.Channel,
                        name: "channel",
                        required: true,
                        ...localizeObject("commands.vcnotifications.options.channel"),
                        channelTypes: [Discord.ChannelType.GuildVoice]
                    },
                    {
                        type: Discord.ApplicationCommandOptionType.Boolean,
                        name: "enable",
                        required: true,
                        ...localizeObject("commands.vcnotifications.options.enable")
                    }
                ]
            }
        ]
    }

    override async init() {
        client.on("interactionCreate", async interaction => {
            if (!interaction.isChatInputCommand()) return;
            if (interaction.commandName != "vcnotifications") return;

            let channel = interaction.options.getChannel("channel", true) as Discord.VoiceChannel;

            if (!channel.permissionsFor(interaction.user)?.has(Discord.PermissionFlagsBits.ManageChannels)) {
                await interaction.reply({
                    content: getString("messages.vcnotifications.no_permission", getLocaleFor(interaction))!
                });
                return;
            }

            let enable = interaction.options.getBoolean("enable", true);

            await this.setVcNotificationsEnabled(channel, enable);

            await interaction.reply({
                content: getString("messages.vcnotifications." + (enable ? "enabled" : "disabled"), getLocaleFor(interaction))!
            });
        });

        client.on("voiceStateUpdate", async (oldState, newState) => {
            if (oldState.channelId == newState.channelId) return;

            if (oldState.channel && oldState.channel.type == Discord.ChannelType.GuildVoice) {
                let enabled = await this.getVcNotificationsEnabled(oldState.channel);

                if (enabled) {
                    await this.sendUpdate(oldState.channel, oldState.member!, new Date(), false);
                }
            }

            if (newState.channel && newState.channel.type == Discord.ChannelType.GuildVoice) {
                let enabled = await this.getVcNotificationsEnabled(newState.channel);

                if (enabled) {
                    await this.sendUpdate(newState.channel, newState.member!, new Date(), true);
                }
            }
        });
    }
}
