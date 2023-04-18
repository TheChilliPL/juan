import * as Discord from "discord.js";
import {client} from "../bot";
import {getLocaleFor, getString, localizeObject} from "../localization";
import {countWhere} from "../utils";
import {BotModule} from "../modules";
import {ApplicationCommandData} from "discord.js";

export class VCMoveModule extends BotModule {
    constructor() {
        super("VCMoveModule");
    }

    override async createCommands(): Promise<ApplicationCommandData[]> {
        return [
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
            }
        ];
    }

    override async init() {
        client.on("interactionCreate", async interaction => {
            if(!interaction.isChatInputCommand()) return;
            if(interaction.commandName != "vcmove") return;

            await interaction.reply({
                content: getString("messages.vcmove.start", getLocaleFor(interaction)),
                ephemeral: true
            });

            let from = interaction.options.getChannel("from", true) as Discord.VoiceChannel;
            let to = interaction.options.getChannel("to", true) as Discord.VoiceChannel;

            // Move members from one channel to the other
            let members = Array.from(from.members.values());
            let moved = countWhere(members, m => {
                try {
                    m.voice.setChannel(to);
                    return true;
                } catch(e) {
                    return false;
                }
            });

            let answer: string;
            if(members.length == 0) {
                answer = getString("messages.vcmove.no_members", getLocaleFor(interaction))!;
            } else if(moved == 0) {
                answer = getString("messages.vcmove.failure", getLocaleFor(interaction))!;
            } else if(moved == members.length) {
                answer = getString("messages.vcmove.success", getLocaleFor(interaction))!;
            } else {
                answer = getString("messages.vcmove.partial", getLocaleFor(interaction), {
                    placeholders: {
                        MOVED: moved.toString(),
                        TOTAL: members.length.toString()
                    }
                })!;
            }
            await interaction.editReply({
                content: answer
            });
        });
    }
}
