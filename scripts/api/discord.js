const Discord = require('discord.js');
const { formatScore } = require('../utils');

class DiscordIntegration {
    constructor(id, token) {
        if (!id) throw new Error('missing id');
        if (!token) throw new Error('missing token');

        this.client = new Discord.WebhookClient(id, token);
        this.username = 'board.portal2.sr';
    }
    sendWebhook(data) {
        return this.client
            .send('', { embeds: [this.buildEmbed(data)] })
            .then(console.log)
            .catch(console.error);
    }
    destroy() {
        this.client.destroy();
    }
    buildEmbed({
        mostWorldRecords,
        largestImprovement,
        mostPersonalRecords,
        mostDemoUploads,
        mostYouTubeLinks,
        mostActiveMaps,
        week,
    }) {
        const fieldValue = (value) => (value ? value : 'n/a');
        return {
            title: `Recap - Week #${week}`,
            url: 'https://stats.nekz.me',
            color: 295077,
            fields: [
                {
                    name: 'Most World Records',
                    value: fieldValue(
                        mostWorldRecords
                            .map(({ user, wrs }) => `${Discord.Util.escapeMarkdown(user.name)} - ${wrs}`)
                            .join('\n'),
                    ),
                    inline: true,
                },
                {
                    name: 'Top Demo Uploaders',
                    value: fieldValue(
                        mostDemoUploads
                            .map(({ user, prs }) => `${Discord.Util.escapeMarkdown(user.name)} - ${prs}`)
                            .join('\n'),
                    ),
                    inline: true,
                },
                {
                    name: 'Top World Record Timesaves',
                    value: fieldValue(
                        largestImprovement
                            .map(
                                ({ user, map, delta }) =>
                                    `-${formatScore(delta)} on ${map.alias} by ${Discord.Util.escapeMarkdown(
                                        user.name,
                                    )}`,
                            )
                            .join('\n'),
                    ),
                    inline: true,
                },
                {
                    name: 'Most Personal Records',
                    value: fieldValue(
                        mostPersonalRecords
                            .map(({ user, prs }) => `${Discord.Util.escapeMarkdown(user.name)} - ${prs}`)
                            .join('\n'),
                    ),
                    inline: true,
                },
                {
                    name: 'Top Video Uploaders',
                    value: fieldValue(
                        mostYouTubeLinks
                            .map(({ user, prs }) => `${Discord.Util.escapeMarkdown(user.name)} - ${prs}`)
                            .join('\n'),
                    ),
                    inline: true,
                },
                {
                    name: 'Most Records By Map',
                    value: fieldValue(mostActiveMaps.map(({ map, count }) => `${map.alias} - ${count}`).join('\n')),
                    inline: true,
                },
            ],
        };
    }
}

module.exports = DiscordIntegration;
