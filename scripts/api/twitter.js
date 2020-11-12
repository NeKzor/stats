const Twitter = require('twitter-lite');
const { formatScore, log } = require('../utils');

require('dotenv').config();

const locations = [
    'Relaxation Vault',
    'Aperture Facility',
    'Central AI Chamber',
    "Wheatley's Lair",
    'Enrichment Center',
];

const rng = (max) => Math.floor(Math.random() * Math.floor(max));
const youTubeLink = (media) => (media ? `https://youtube.com/watch?v=${media}` : '');

const defaultBioOptions = { status: '#ONLINE', wrsThisWeek: 0, pbsThisWeek: 0 };

class TwitterIntegration {
    constructor(consumer_key, consumer_secret, access_token_key, access_token_secret) {
        this.client = new Twitter({
            subdomain: 'api',
            version: '1.1',
            consumer_key,
            consumer_secret,
            access_token_key,
            access_token_secret,
        });

        this.lastBioOptions = defaultBioOptions;
        this.enabled = true;
    }
    updateBio(options) {
        if (!this.enabled) {
            return Promise.resolve();
        }

        const { status, wrsThisWeek, pbsThisWeek } = {
            ...this.lastBioOptions,
            ...options,
        };

        if (options.wrsThisWeek !== undefined) {
            this.lastBioOptions.wrsThisWeek = options.wrsThisWeek;
        }
        if (options.pbsThisWeek !== undefined) {
            this.lastBioOptions.pbsThisWeek = options.pbsThisWeek;
        }

        const description = `
Portal 2 Challenge Mode World Records ${status}
Property of @nekznekz

WRs set this week: ${wrsThisWeek}
PBs set this week: ${pbsThisWeek}`.trim();

        const location = locations[rng(locations.length)];

        return this.client
            .post('account/update_profile', { description, location })
            .then(() => log.info('[twitter] account profile updated'))
            .catch(log.error);
    }
    // TODO: Use Twitter name instead of user name once iverb supports it
    sendTweet(wrs, map) {
        if (!this.enabled) {
            return Promise.resolve();
        }

        const { score, delta, media } = wrs[0];

        const status = `
${map.alias}
${formatScore(score)} (-${formatScore(delta)})
${wrs.map(({ user }) => user.name).join(' & ')}
${youTubeLink(wrs[1] && wrs[1].media ? wrs[1].media : media)}`.trim();

        log.info(status);

        return this.client
            .post('statuses/update', { status })
            .then(() => log.info('[twitter] status updated'))
            .catch(log.error);
    }
}

module.exports = TwitterIntegration;
