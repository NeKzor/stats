const fs = require('fs');
const { Portal2Map } = require('./api/portal2');
const { importJson, log, tryExportJson } = require('./utils');

const cacheFile = require('path').join(__dirname, '/../points-cache.json');

const byScore = (a, b) => (a.score === b.score ? 0 : a.score < b.score ? -1 : 1);
const byPoints = (a, b) => (a.points === b.points ? 0 : a.points > b.points ? -1 : 1);

const mergeCampaigns = (campaigns) => {
    const overall = {};

    for (const ranks of campaigns) {
        for (const { user, points } of ranks) {
            const player = overall[user.id];
            if (player) {
                player.points += points;
            } else {
                overall[user.id] = { user, points };
            }
        }
    }

    return Object.values(overall);
};

const getPoints = (rank) => {
    return Math.max(1, Math.pow(200 - (rank - 1), 2) / 200);
};

const calculatePoints = (history, campaign) => {
    const players = {};

    for (const map of campaign) {
        const leaderboard = {};

        for (const entry of history.filter((entry) => entry.mapid == map.bestTimeId).reverse()) {
            const player = leaderboard[entry.profile_number];

            if (player) {
                continue;
            } else {
                leaderboard[entry.profile_number] = {
                    user: {
                        id: entry.profile_number,
                        name: entry.player_name,
                    },
                    score: parseInt(entry.score, 10),
                    id: entry.id,
                };
            }
        }

        const leaderboardEntries = Object.values(leaderboard).sort(byScore);

        let rank = 1;
        let row = 1;

        const [firstEntry] = leaderboardEntries;
        let prevScore = firstEntry ? firstEntry.score : null;

        for (const { user, score } of leaderboardEntries) {
            if (prevScore !== score) {
                rank = row;
            }

            const points = getPoints(rank);
            const player = players[user.id];

            if (player) {
                player.points += points;
            } else {
                players[user.id] = {
                    user,
                    points,
                };
            }

            prevScore = score;
            ++row;
        }
    }

    return Object.values(players);
};

const main = (changelog, useCache) => {
    if (useCache) {
        log.info('getting points history from cache');
        const cache = importJson(cacheFile);
        cache.forEach((ranks) => (ranks.overall = mergeCampaigns([ranks.singlePlayer, ranks.cooperative])));
        return cache;
    }

    log.info('computing points history');

    const entries = changelog.filter((entry) => entry.banned === '0' && entry.time_gained).reverse();

    const sp = Portal2Map.singlePlayerMaps();
    const mp = Portal2Map.cooperativeMaps();

    const history = [];
    const result = [];

    let currentDay = entries[0].time_gained.slice(0, 10);

    for (const entry of entries) {
        const timestamp = entry.time_gained.slice(0, 10);

        if (timestamp !== currentDay) {
            result.push({
                currentDay,
                singlePlayer: calculatePoints(history, sp),
                cooperative: calculatePoints(history, mp),
            });
            currentDay = timestamp;
        }

        const pb = history.find((pb) => pb.profile_number === entry.profile_number && pb.mapid === entry.mapid);
        if (pb) {
            pb.id = entry.id;
            pb.score = entry.score;
        } else {
            history.push(entry);
        }
    }

    result.push({
        currentDay,
        singlePlayer: calculatePoints(history, sp),
        cooperative: calculatePoints(history, mp),
    });

    tryExportJson(cacheFile, result, true);
    log.info('cached points history');

    return result;
};

const getPlayersTop = (top, result) => {
    const uniquePlayers = {};
    for (const { user, points } of result.map((entry) => entry.sp.sort(byScore).slice(0, top)).flat()) {
        const player = uniquePlayers[user.id];
        if (player) {
            if (player.points < points) {
                player.points = points;
            }
            continue;
        }

        uniquePlayers[user.id] = { user, points };
    }

    return Object.values(uniquePlayers)
        .sort(byPoints)
        .map(({ user }) => user);
};

const test = () => {
    const exportData = (file, players, result) => {
        fs.writeFileSync(file, '');
        fs.appendFileSync(file, `Date/Player\t${players.map((player) => player.name).join('\t')}\r\n`);

        for (const row of result) {
            const points = players.map((player) => {
                const user = row.sp.find(({ user }) => user.id === player.id);
                return user ? user.points : 0;
            });

            fs.appendFileSync(file, `${row.currentDay}\t${points.join('\t')}\r\n`);
        }
    };

    //main();
    const result = importJson(cacheFile);
    const players = getPlayersTop(10, result);

    exportData('result_top10.csv', players, result);
};

module.exports = main;
