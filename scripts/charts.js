const { Portal2Map } = require('./api/portal2');

const cooperativeMaps = Portal2Map.cooperativeMaps();

const isSinglePlayer = (bestTimeId) => {
    return cooperativeMaps.find((map) => map.isOfficial && map.bestTimeId.toString() === bestTimeId) === undefined;
};

const asEntry = (entry) => {
    return {
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
        map: {
            bestTimeId: entry.mapid,
            alias: entry.chamberName,
        },
    };
};

const computeTimeFrequency = (changelog) => {
    const sp = [];
    const mp = [];

    for (const entry of changelog) {
        if (entry.banned === '1') continue;
        if (entry.time_gained === null) continue;
    
        const item = {
            cs: entry.score % 100,
            id: entry.id,
        };

        if (isSinglePlayer(entry.mapid)) {
            sp.push(item);
        } else {
            mp.push(item);
        }
    }

    const spFrequency = sp
        .map((x) => x.cs)
        .reduce((count, item) => {
            count[item] = (count[item] || 0) + 1;
            return count;
        }, {});
    
    const mpFrequency = mp
        .map((x) => x.cs)
        .reduce((count, item) => {
            count[item] = (count[item] || 0) + 1;
            return count;
        }, {});

    const result = {
        data: [],
        unlikely: [],
    };

    const sus = {
        sp: 100,
        mp: 40,
    };

    for (let i = 0; i < 100; ++i) {
        result.data.push({
            cs: i,
            sp: spFrequency[i] || 0,
            mp: mpFrequency[i] || 0,
        });

        if (spFrequency[i] < sus.sp || spFrequency[i] === undefined) {
            sp.filter(x => x.cs === i).forEach(x => result.unlikely.push(asEntry(changelog.find(y => y.id === x.id))));
        }

        if (mpFrequency[i] < sus.mp || mpFrequency[i] === undefined) {
            mp.filter(x => x.cs === i).forEach(x => result.unlikely.push(asEntry(changelog.find(y => y.id === x.id))));
        }
    }

    return result;
};

const main = (changelog) => {
    const timeFrequency = computeTimeFrequency(changelog);

    return {
        timeFrequency,
    };
};

module.exports = main;
