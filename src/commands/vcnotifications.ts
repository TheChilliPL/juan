import * as Discord from "discord.js";
import {client} from "../index";
import {JsonVault} from "../vault";
import {getLocaleFor, getString} from "../localization";

interface VcNotificationsVaultData {
    notifications?: {
        [vc: Discord.Snowflake]: boolean
    }
}

let vcNotificationsVault = new JsonVault<VcNotificationsVaultData>("vc-notifications");

async function getVcNotificationsEnabled(channel: Discord.VoiceChannel): Promise<boolean> {
    await vcNotificationsVault.load();
    return vcNotificationsVault.data.notifications?.[channel.id] ?? false;
}

async function setVcNotificationsEnabled(channel: Discord.VoiceChannel, enabled: boolean) {
    await vcNotificationsVault.load();
    if(!vcNotificationsVault.data.notifications) vcNotificationsVault.data.notifications = {};
    vcNotificationsVault.data.notifications[channel.id] = enabled;
    await vcNotificationsVault.save();
}

async function sendUpdate(channel: Discord.VoiceChannel, member: Discord.GuildMember, timestamp: Date, joined: boolean) {
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

export async function initVcnotifications() {
    client.on("interactionCreate", async interaction => {
        if(!interaction.isChatInputCommand()) return;
        if(interaction.commandName != "vcnotifications") return;

        let channel = interaction.options.getChannel("channel", true) as Discord.VoiceChannel;

        if(!channel.permissionsFor(interaction.user)?.has(Discord.PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({
                content: getString("messages.vcnotifications.no_permission", getLocaleFor(interaction))
            });
            return;
        }

        let enable = interaction.options.getBoolean("enable", true);

        await setVcNotificationsEnabled(channel, enable);

        await interaction.reply({
            content: getString("messages.vcnotifications." + (enable ? "enabled" : "disabled"), getLocaleFor(interaction))
        });
    });

    client.on("voiceStateUpdate", async (oldState, newState) => {
        if(oldState.channelId == newState.channelId) return;

        if(oldState.channel && oldState.channel.type == Discord.ChannelType.GuildVoice) {
            let enabled = await getVcNotificationsEnabled(oldState.channel);

            if(enabled) {
                await sendUpdate(oldState.channel, oldState.member!, new Date(), false);
            }
        }

        if(newState.channel && newState.channel.type == Discord.ChannelType.GuildVoice) {
            let enabled = await getVcNotificationsEnabled(newState.channel);

            if(enabled) {
                await sendUpdate(newState.channel, newState.member!, new Date(), true);
            }
        }
    });
}
