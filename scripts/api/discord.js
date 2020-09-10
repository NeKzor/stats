const Discord = require('discord.js');

class DiscordIntegration {
    constructor(id, token) {
        this.client = new Discord.WebhookClient(id, token);
        this.username = 'board.iverb.me';
    }
    sendWebhook(data) {
        return this.client
            .send('', { embeds: [this.buildEmbed(data)] })
            .then(console.log)
            .catch(console.error);
    }
    buildEmbed() {
        return {
            title: 'Weekly Recap',
            url: 'https://nekz.me/stats',
            color: 44871,
            fields: [],
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
