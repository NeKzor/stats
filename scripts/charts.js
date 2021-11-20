const cooperativeMapIds = [
    '47741',
    '47825',
    '47828',
    '47829',
    '45467',
    '46362',
    '47831',
    '47833',
    '47835',
    '47837',
    '47840',
    '47841',
    '47844',
    '47845',
    '47848',
    '47849',
    '47854',
    '47856',
    '47858',
    '47861',
    '52642',
    '52660',
    '52662',
    '52663',
    '52665',
    '52667',
    '52671',
    '52687',
    '52689',
    '52691',
    '52777',
    '52694',
    '52711',
    '52714',
    '52715',
    '52717',
    '52735',
    '52738',
    '52740',
    '49341',
    '49343',
    '49345',
    '49347',
    '49349',
    '49351',
    '52757',
    '52759',
    '48287',
];

const isSinglePlayer = (id) => {
    return cooperativeMapIds.find(x => x === id) === undefined;
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

    const sus = 10; // We should keep it below 10 runs

    for (let i = 0; i < 100; ++i) {
        result.data.push({
            cs: i,
            sp: spFrequency[i] || 0,
            mp: mpFrequency[i] || 0,
        });

        if (spFrequency[i] < sus || spFrequency[i] === undefined) {
            sp.filter(x => x.cs === i).forEach(x => result.unlikely.push(asEntry(changelog.find(y => y.id === x.id))));
        }

        if (mpFrequency[i] < sus || mpFrequency[i] === undefined) {
            mp.filter(x => x.cs === i).forEach(x => result.unlikely.push(asEntry.changelog.find(y => y.id === x.id))));
        }
    }

    return result;
};

const main = (changelog) => {
    const timeFrequency = computeTimeFrequency(changelog);

    return { timeFrequency }
};

module.exports = main;
