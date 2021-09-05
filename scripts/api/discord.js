const Discord = require('discord.js');
const moment = require('moment');
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
        return {
            title: `Recap - Week #${week}`,
            url: 'https://nekz.me/iverb-stats',
            color: 295077,
            fields: [
                {
                    name: 'Most World Records',
                    value: mostWorldRecords.map(({ user, wrs }) => `${user.name} - ${wrs}`).join('\n'),
                    inline: true,
                },
                {
                    name: 'Top Demo Uploaders',
                    value: mostDemoUploads.map(({ user, prs }) => `${user.name} - ${prs}`).join('\n'),
                    inline: true,
                },
                {
                    name: 'Top World Record Timesaves',
                    value: largestImprovement
                        .map(({ user, map, delta }) => `-${formatScore(delta)} on ${map.alias} by ${user.name}`)
                        .join('\n'),
                    inline: true,
                },
                {
                    name: 'Most Personal Records',
                    value: mostPersonalRecords.map(({ user, prs }) => `${user.name} - ${prs}`).join('\n'),
                    inline: true,
                },
                {
                    name: 'Top Video Uploaders',
                    value: mostYouTubeLinks.map(({ user, prs }) => `${user.name} - ${prs}`).join('\n'),
                    inline: true,
                },
                {
                    name: 'Most Records By Map',
                    value: mostActiveMaps.map(({ map, count }) => `${map.alias} - ${count}`).join('\n'),
                    inline: true,
                },
            ],
        };
    }
    static getTestData() {
        return {};
    }
    static sanitiseText(text) {
        return text.replace('/(\\*|_|`|~)/miu', '\\\\$1');
    }
}

module.exports = DiscordIntegration;
