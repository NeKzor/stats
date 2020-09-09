const path = require('path');
const moment = require('moment');
const { log, tryExportJson, tryMakeDir, importJson } = require('./utils');
const Portal2Boards = require('./api/client');
const { Portal2Map } = require('./api/portal2');

require('dotenv').config();

const cacheFile = path.join(__dirname, '../cache.json');

Array.prototype.chunk = function (size) {
    return this.reduce((acc, val, idx) => {
        const chunk = Math.floor(idx / size);
        acc[chunk] = [].concat(acc[chunk] || [], val);
        return acc;
    }, []);
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
    delta: prevEntry ? Math.abs(prevEntry.score - parseInt(entry.score, 10)) : null,
    demo: entry.hasDemo === '1',
    media: entry.youtubeID,
});

const asWr = (entry, prevEntry) => asHistory(entry, prevEntry);

const main = async (outputDir, snapshot = true) => {
    const cache = importJson(cacheFile);

    //const latest = importJson(`${outputDir}/latest.json`);

    /* const cache = {};
    cache.changelog = await Portal2Boards.changelog({
        maxDaysAgo: 3333,
        
    });
    tryExportJson(cacheFile, cache, true, false);
    */

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

            campaign.push({
                map,
                wrs: wrs.map((wr, index, items) => asWr(wr, items[index + 1])),
                history: history.map((history, index, items) => asHistory(history, items[index + 1], items[index - 1])),
            });
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
        ].map((campaign) => generateStats(campaign, snapshot)),
    };

    tryMakeDir(outputDir);
    tryMakeDir(`${outputDir}/records`);
    tryExportJson(`${outputDir}/records/latest.json`, game, true);

    /* if (snapshot) {
        tryExportJson(`${outputDir}/${moment().format('YYYY-MM-DD')}.json`, game, true);
    } */
};

const generateStats = (campaign, snapshot) => {
    const totalTime = campaign.maps.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);

    let users = campaign.maps.map((t) => t.wrs.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);
    let wrs = campaign.maps.map((t) => t.wrs).reduce((acc, val) => acc.concat(val), []);

    let frequency = users.reduce((count, user) => {
        count[user.name] = (count[user.name] || 0) + 1;
        return count;
    }, {});

    const leaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.name === key),
            wrs: frequency[key],
            duration: snapshot
                ? wrs
                      .filter((r) => r.user.name === key)
                      .map((r) => r.duration)
                      .reduce((a, b) => a + b, 0)
                : undefined,
        }));

    users = campaign.maps.map((t) => t.history.map((r) => r.user)).reduce((acc, val) => acc.concat(val), []);
    wrs = campaign.maps.map((t) => t.history).reduce((acc, val) => acc.concat(val), []);
    frequency = users.reduce((count, user) => {
        count[user.name] = (count[user.name] || 0) + 1;
        return count;
    }, {});

    const historyLeaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => ({
            user: users.find((u) => u.name === key),
            wrs: frequency[key],
            duration: snapshot
                ? wrs
                      .filter((r) => r.user.name === key)
                      .map((r) => r.duration)
                      .reduce((a, b) => a + b, 0)
                : undefined,
        }));

    campaign.stats = {
        totalTime,
        leaderboard,
        historyLeaderboard,
    };

    return campaign;
};

const inspect = (obj) => console.dir(obj, { depth: 6 });

if (process.argv[2] === '--test') {
    main(path.join(__dirname, '../api/'), false).catch(inspect);
}

module.exports = main;
