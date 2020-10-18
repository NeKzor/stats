const moment = require('moment');
const { Portal2Map } = require('./api/portal2');

const asEntry = (entry) => ({
    user: {
        id: entry.profile_number,
        name: entry.player_name,
        avatar: entry.avatar,
    },
    id: entry.id,
    date: entry.time_gained,
    score: parseInt(entry.score, 10),
    demo: entry.hasDemo === '1',
    media: entry.youtubeID,
});

const main = async (cache, snapshotRange) => {
    const { changelog } = cache;

    const records = changelog.filter((entry) => {
        return entry.banned === '0';
    });

    const generateCampaign = (maps) => {
        const campaign = [];

        for (const map of maps) {
            if (!map.exists) continue;

            const entries = records.filter((entry) => entry.mapid == map.bestTimeId).map(asEntry);

            campaign.push({
                map,
                entries,
            });
        }

        return campaign;
    };

    const maps = generateCampaign([...Portal2Map.singlePlayerMaps(), ...Portal2Map.cooperativeMaps()]);

    return recap({ maps }, snapshotRange);
};

const recap = (campaign, snapshotRange) => {
    const [snapshotStart, snapshotEnd] = snapshotRange;

    const prs = campaign.maps
        .map((t) => t.entries)
        .reduce((acc, val) => acc.concat(val), [])
        .filter(({ date }) => moment(date).isBetween(snapshotStart, snapshotEnd));

    const mostActiveMaps = campaign.maps
        .map(({ map, entries }) => ({
            map,
            count: entries.filter(({ date }) => moment(date).isBetween(snapshotStart, snapshotEnd)).length,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    const createLeaderboard = (users) => {
        const frequency = users.reduce((count, user) => {
            count[user.id] = (count[user.id] || 0) + 1;
            return count;
        }, {});

        return Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .map((key) => ({
                user: users.find((u) => u.id === key),
                prs: frequency[key],
            }))
            .slice(0, 3);
    };

    return {
        mostPersonalRecords: createLeaderboard(prs.map((t) => t.user)),
        mostDemoUploads: createLeaderboard(prs.filter(({ demo }) => demo).map((t) => t.user)),
        mostYouTubeLinks: createLeaderboard(prs.filter(({ media }) => media).map((t) => t.user)),
        mostActiveMaps,
    };
};

//const inspect = (obj) => console.dir(obj, { depth: 6 });

/* if (process.argv[2] === '--test') {
    main().catch(inspect);
} */

module.exports = main;
