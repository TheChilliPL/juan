import * as Discord from "discord.js";
import {client} from "../bot";
import {getLocaleFor, getString, localizeObject} from "../localization";
import {parse} from "chrono-node";
import {offsetToString} from "../utils";
import {BotModule} from "../modules";
import {ApplicationCommandData} from "discord.js";

export class TimestampModule extends BotModule {
    constructor() {
        super("TimestampModule");
    }

    override async createCommands(): Promise<ApplicationCommandData[]> {
        return [
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
            }
        ];
    }

    override async init() {
        client.on("interactionCreate", async interaction => {
            if(!interaction.isChatInputCommand()) return;
            if(interaction.commandName != "timestamp") return;

            //let date = new Date(interaction.options.getString("timestamp", true));
            let parsedResults = parse(
                interaction.options.getString("timestamp", true),
                interaction.createdAt,
                {
                    forwardDate: true
                }
            );

            if(parsedResults.length == 0) {
                await interaction.reply({
                    content: getString("messages.timestamp.parse_error", getLocaleFor(interaction)),
                    ephemeral: true
                });
                return;
                // } else if(parsedResults.length > 1) {
                //     await interaction.reply({
                //         content: getString("messages.timestamp.multiple_timestamps_unsupported", getLocaleFor(interaction)),
                //         ephemeral: true
                //     });
                //     return;
            } else if(parsedResults[0].end != null) {
                await interaction.reply({
                    content: getString("messages.timestamp.range_unsupported", getLocaleFor(interaction)),
                    ephemeral: true
                });
                return;
            }

            let result = parsedResults[0].start;
            let date = result.date();
            let timezoneKnown = result.isCertain("timezoneOffset");
            let offset = result.get("timezoneOffset");
            let offsetString =  offset ? offsetToString(offset) : null;

            // if(date == null) {
            //     await interaction.reply({
            //         content: getString("messages.timestamp.parse_error", getLocaleFor(interaction)),
            //         ephemeral: true
            //     });
            //     return;
            // }

            let styles: [string, Discord.TimestampStylesString][] = [
                ["short_time", Discord.TimestampStyles.ShortTime],
                ["long_time", Discord.TimestampStyles.LongTime],
                ["short_date", Discord.TimestampStyles.ShortDate],
                ["long_date", Discord.TimestampStyles.LongDate],
                ["short_date_time", Discord.TimestampStyles.ShortDateTime],
                ["long_date_time", Discord.TimestampStyles.LongDateTime],
                ["relative_time", Discord.TimestampStyles.RelativeTime]
            ];

            // let fields = styles.map(([name, style]) => {
            //     return {
            //         name: getString("messages.timestamp.format", getLocaleFor(interaction), {
            //             placeholders: {
            //                 STYLE: getString("messages.timestamp.styles." + name, getLocaleFor(interaction))!,
            //                 TIMESTAMP: time(date, style)
            //             }
            //         })!,
            //         value: `\`\`\`${time(date, style)}\`\`\``,
            //         inline: true
            //     };
            // });
            let results = styles.map(([name, style]) => {
                return getString("messages.timestamp.format", getLocaleFor(interaction), {
                    placeholders: {
                        STYLE: getString("messages.timestamp.styles." + name, getLocaleFor(interaction))!,
                        TIMESTAMP: Discord.time(date, style)
                    }
                })!;
            });

            await interaction.reply({
                content: getString("messages.timestamp.result", getLocaleFor(interaction), {
                    placeholders: {
                        TIMESTAMP: Discord.time(date, Discord.TimestampStyles.ShortDateTime)
                    }
                }) + "\n\n" + results.join("\n") + (
                    timezoneKnown ? "" : "\n\n" + getString("messages.timestamp.timezone_unknown", getLocaleFor(interaction), {
                        placeholders: {
                            OFFSET: offsetString ?? "unknown"
                        }
                    })
                ),
                // embeds: [{
                //     fields: fields
                // }],
                ephemeral: true
            });
        });
    }
}
