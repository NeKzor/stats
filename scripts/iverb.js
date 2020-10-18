const path = require('path');
const moment = require('moment');
const { log, tryExportJson, tryMakeDir, importJson } = require('./utils');
const Portal2Boards = require('./api/client');
const { Portal2Map, Portal2MapType } = require('./api/portal2');
const recapCommunity = require('./community');
const DiscordIntegration = require('./api/discord');

require('dotenv').config();

const cacheFile = path.join(__dirname, '../cache.json');

const findPartners = (entry, index, items) => {
    const prevEntry = items[index + 1];
    const nextEntry = items[index - 1];

    if (prevEntry && entry.score === prevEntry.score) {
        if (
            moment(entry.date).isBetween(moment(prevEntry.date).add(-1, 'hour'), moment(prevEntry.date).add(1, 'hour'))
        ) {
            const beatenBy = items
                .slice(0, index)
                .reverse()
                .find((item) => item.score < entry.score);

            entry.isPartner = true;
            entry.delta = prevEntry.delta;
            entry.partnerId = prevEntry.id;
            entry.beatenBy = { id: beatenBy ? beatenBy.id : null };
            entry.duration = moment(beatenBy ? beatenBy.date : undefined).diff(moment(entry.date), 'd');
            prevEntry.partnerId = entry.id;
            prevEntry.beatenBy = entry.beatenBy;
            prevEntry.duration = entry.duration;
            prevEntry.isPartner = false;
        } else if (
            nextEntry &&
            !moment(entry.date).isBetween(moment(nextEntry.date).add(-1, 'hour'), moment(nextEntry.date).add(1, 'hour'))
        ) {
            entry.isPartner = null;
            entry.delta = prevEntry.delta;
            entry.partnerId = null;
        }
    } else {
        entry.isPartner = false;
    }
};

const asHistory = (entry, prevEntry, nextEntry) => ({
    user: {
        id: entry.profile_number,
        name: entry.player_name,
        avatar: entry.avatar,
    },
    id: entry.id,
    date: entry.time_gained,
    score: parseInt(entry.score, 10),
    duration: moment(nextEntry ? nextEntry.time_gained : undefined).diff(moment(entry.time_gained), 'd'),
    beatenBy: { id: nextEntry ? nextEntry.id : null },
    delta: prevEntry ? Math.abs(prevEntry.score - parseInt(entry.score, 10)) : null,
    demo: entry.hasDemo === '1',
    media: entry.youtubeID,
});

const asWr = (entry, prevEntry) => asHistory(entry, prevEntry);

const fetchNewEntries = async (latestId) => {
    const changelog = await Portal2Boards.changelog({
        maxDaysAgo: 8,
    });

    let index = 0;

    for (const { id } of changelog) {
        if (id === latestId) {
            return changelog.slice(0, index);
        }

        ++index;
    }

    throw new Error('Failed to find last changelog entry.');
};

const main = async (outputDir) => {
    const cache = importJson(cacheFile);

    try {
        const latestId = cache.changelog[0].id;
        const newEntries = await fetchNewEntries(latestId);

        cache.changelog.unshift(...newEntries);
        tryExportJson(cacheFile, cache, true, false);

        console.log(`updated changelog with ${newEntries.length} new entries`);
    } catch (error) {
        console.error(error);
    }

    const { changelog } = cache;

    const records = changelog.filter((entry) => {
        return entry.wr_gain === '1' && entry.banned === '0';
    });

    const generateCampaign = (maps) => {
        const campaign = [];

        for (const map of maps) {
            if (!map.exists) continue;

            const history = records.filter((entry) => entry.mapid == map.bestTimeId);

            const wr = history[0].score;
            const wrs = history.filter((entry) => entry.score === wr);

            const campaignMap = {
                map,
                wrs: wrs.map((item, index, items) => asWr(item, items[index + 1])),
                history: history.map((item, index, items) => asHistory(item, items[index + 1], items[index - 1])),
            };

            if (map.type === Portal2MapType.Cooperative) {
                campaignMap.history.forEach(findPartners);
            }

            campaign.push(campaignMap);
        }

        return campaign;
    };

    const game = {
        campaigns: [
            {
                name: 'Single Player',
                maps: generateCampaign(Portal2Map.singlePlayerMaps()),
            },
            {
                name: 'Cooperative',
                maps: generateCampaign(Portal2Map.cooperativeMaps()),
            },
        ].map((campaign) => generateRankings(campaign, false)),
    };

    tryMakeDir(outputDir);
    tryMakeDir(`${outputDir}/records`);
    tryExportJson(`${outputDir}/records/latest.json`, game, true);

    const overall = {
        name: 'Overall',
        maps: game.campaigns.map((campaign) => campaign.maps).reduce((acc, val) => acc.concat(...val), []),
    };

    if (recap) {
        const discord = new DiscordIntegration(process.env.DISCORD_WEBHOOK_ID, process.env.DISCORD_WEBHOOK_TOKEN);

        try {
            const snapshotRange = [moment().add(-7, 'days'), moment()];

            discord
                .sendWebhook({
                    ...recap(overall, snapshotRange),
                    ...(await recapCommunity(cache, snapshotRange)),
                })
                .then(() => {
                    console.log('weekly recap sent');
                    discord.destroy();
                });
        } catch (error) {
            discord.destroy();
            console.error(error);
        }
    }

    tryMakeDir(`${outputDir}/stats`);
    tryExportJson(`${outputDir}/stats/latest.json`, generateStats(overall), true);

    game.campaigns.push(overall);

    game.campaigns.forEach((campaign) => generateRankings(campaign, true));
    game.campaigns.forEach((campaign) => delete campaign.maps);

    tryMakeDir(`${outputDir}/ranks`);
    tryExportJson(`${outputDir}/ranks/latest.json`, game, true);
};

const generateStats = (overall) => {
    const mapWrs = overall.maps
        .map((t) => {
            return t.history.map((wr) => {
                wr.map = t.map;
                return wr;
            });
        })
        .reduce((acc, val) => acc.concat(val), []);

    mapWrs.forEach((wr) => {
        if (wr.beatenBy.id) {
            const newWr = mapWrs.find(({ id }) => id === wr.beatenBy.id);
            wr.beatenBy.date = newWr.date;
            wr.beatenBy.user = { ...newWr.user };
        }
    });

    const largestImprovement = mapWrs
        .sort((a, b) => (a.delta === b.delta ? 0 : a.delta < b.delta ? 1 : -1))
        .slice(0, 100);
    const longestLasting = mapWrs
        .sort((a, b) => (a.duration === b.duration ? 0 : a.duration < b.duration ? 1 : -1))
        .slice(0, 100);

    return { largestImprovement, longestLasting };
};

const generateRankings = (campaign, statsPage) => {
    const totalTime = campaign.maps.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);

    let users = campaign.maps.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);
    let wrs = campaign.maps.map((t) => t.wrs).reduce((acc, val) => acc.concat(val), []);

    let frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const leaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.id === key),
            wrs: frequency[key],
            duration: wrs
                      .filter((r) => r.user.id === key)
                      .map((r) => r.duration)
                      .reduce((a, b) => a + b, 0)
        }));

    if (!statsPage) {
        campaign.stats = {
            totalTime,
            leaderboard,
        };

        return campaign;
    }

    users = campaign.maps.map((t) => t.history.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);
    wrs = campaign.maps.map((t) => t.history).reduce((acc, val) => acc.concat(val), []);
    frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const historyLeaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.id === key),
            wrs: frequency[key],
            duration: wrs
                      .filter((r) => r.user.id === key)
                      .map((r) => r.duration)
                      .reduce((a, b) => a + b, 0)
        }));

    users = campaign.maps
        .map((t) => {
            const all = t.history.map((r) => r.user);
            const ids = [...new Set(t.history.map((r) => r.user.id))];
            return ids.map((id) => all.find((user) => user.id === id));
        })
        .reduce((acc, val) => acc.concat(val), []);
    frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const uniqueLeaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.id === key),
            wrs: frequency[key],
        }));

    campaign.stats = {
        leaderboard,
        historyLeaderboard,
        uniqueLeaderboard,
    };

    return campaign;
};

const recap = (campaign, snapshotRange) => {
    const [snapshotStart, snapshotEnd] = snapshotRange;

    const wrs = campaign.maps
        .map((t) => t.history)
        .reduce((acc, val) => acc.concat(val), [])
        .filter(({ date }) => moment(date).isBetween(snapshotStart, snapshotEnd));

    const mapWrs = campaign.maps
        .map((t) => {
            return t.history
                .filter(({ date }) => moment(date).isBetween(snapshotStart, snapshotEnd))
                .map((wr) => {
                    wr.map = t.map;
                    return wr;
                });
        })
        .reduce((acc, val) => acc.concat(val), []);

    mapWrs.forEach((wr) => {
        if (wr.beatenBy.id) {
            const newWr = mapWrs.find(({ id }) => id === wr.beatenBy.id);
            wr.beatenBy.date = newWr.date;
            wr.beatenBy.user = { ...newWr.user };
        }
    });

    const largestImprovement = mapWrs
        .sort((a, b) => (a.delta === b.delta ? 0 : a.delta < b.delta ? 1 : -1))
        .slice(0, 3);

    const users = wrs.map((t) => t.user);

    const frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const mostWorldRecords = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.id === key),
            wrs: frequency[key],
        }));

    return {
        mostWorldRecords,
        largestImprovement,
    };
};

const inspect = (obj) => console.dir(obj, { depth: 6 });

if (process.argv[2] === '--test') {
    main(path.join(__dirname, '../api/')).catch(inspect);
}

module.exports = main;
