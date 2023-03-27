const path = require('path');
const moment = require('moment');
const { log, tryExportJson, tryMakeDir, importJson } = require('./utils');
const Portal2Boards = require('./api/client');
const { Portal2Map, Portal2MapType } = require('./api/portal2');
const recapCommunity = require('./community');
const DiscordIntegration = require('./api/discord');
const TwitterIntegration = require('./api/twitter');
const computePoints = require('./points');
const computeCharts = require('./charts');

require('dotenv').config();

const cacheFile = path.join(__dirname, '../cache.json');

const twitter = new TwitterIntegration(
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET_KEY,
    process.env.TWITTER_ACCESS_TOKEN,
    process.env.TWITTER_ACCESS_TOKEN_SECRET,
);

twitter.enabled = process.argv.some((arg) => arg === '--twitter');

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
            entry.beatenBy = [];

            if (beatenBy) {
                entry.beatenBy.push({ id: beatenBy.id });
                if (beatenBy.partnerId) {
                    entry.beatenBy.push({ id: beatenBy.partnerId });
                }
            }

            entry.duration = moment(beatenBy ? beatenBy.date : undefined).diff(moment(entry.date), 's');
            prevEntry.partnerId = entry.id;
            prevEntry.beatenBy = entry.beatenBy.map((beatenBy) => ({ ...beatenBy })).reverse();
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

const asWr = (entry, index, items) => {
    const prevEntry = items[index + 1];
    const delta = prevEntry ? parseInt(prevEntry.score, 10) - parseInt(entry.score, 10) : null;

    if (delta !== null && delta < 0) {
        return null;
    }

    const beatenBy = [...items].reverse().find((item) => parseInt(item.score, 10) < parseInt(entry.score, 10));

    return {
        user: {
            id: entry.profile_number,
            name: entry.player_name,
            avatar: entry.avatar,
        },
        id: entry.id,
        date: entry.time_gained,
        score: parseInt(entry.score, 10),
        duration: moment(beatenBy ? beatenBy.time_gained : undefined).diff(moment(entry.time_gained), 's'),
        beatenBy: beatenBy ? [{ id: beatenBy.id }] : [],
        delta,
        demo: entry.hasDemo === '1',
        media: entry.youtubeID,
    };
};

const fetchEnabled = process.argv.indexOf('--enable') !== -1;

const fetchArg = process.argv.indexOf('--fetch');
const fetchValue = fetchArg !== -1 ? process.argv[fetchArg + 1] : null;
const maxDaysAgo = fetchValue ? Math.max(1, Math.min(120, parseInt(fetchValue, 10))) : 1;

const findNewEntries = (changelog, latestEntry) => {
    let index = 0;

    for (const { id } of changelog) {
        if (id === latestEntry.id) {
            return [changelog.slice(0, index), changelog.slice(index)];
        }

        ++index;
    }

    log.warn('failed to find latest changelog entry');
    return false;
};

const fetchAndCacheChangelog = async (cache, newWrs) => {
    let retryCount = 0;

    try {
        const changelog = await Portal2Boards.changelog({
            maxDaysAgo,
        });

        if (cache.changelog.length === 0) {
            cache.changelog = changelog;
            tryExportJson(cacheFile, cache, true, false);
        }

        let changelogResult = false;

        while ((changelogResult = findNewEntries(changelog, cache.changelog[retryCount])) === false) {
            if (++retryCount === changelog.length - 1) {
                throw new Error(
                    'Failed to find last changelog entry. Try --fetch ' +
                        moment().diff(moment(cache.changelog[retryCount].time_gained), 'days') +
                        1,
                );
            }
        }

        const [newEntries, oldEntries] = changelogResult;

        // Update old entries

        const cachedEntriesToCheck = cache.changelog.slice(0, oldEntries.length);
        for (const cached of cachedEntriesToCheck) {
            const found = oldEntries.find((entry) => entry.id === cached.id);
            if (found) {
                if (cached.banned !== found.banned) {
                    cached.banned = found.banned;
                    console.warn('ban status changed', found);
                }
                if (cached.youtubeID !== found.youtubeID) {
                    cached.youtubeID = found.youtubeID;
                    console.warn('media changed', found);
                }
                if (cached.pending !== found.pending) {
                    cached.pending = found.pending;
                    console.warn('pending changed', found);
                }
            }
        }

        cache.changelog.unshift(...newEntries);

        tryExportJson(cacheFile, cache, true, false);

        newWrs.push(
            ...newEntries
                .filter((entry) => entry.wr_gain === '1' && entry.banned === '0' && entry.pending === '0')
                .map((entry) => entry.id),
        );

        log.info(
            `updated changelog with ${newEntries.length} new entries` +
                ` (wrs: ${newWrs.length}, fetched: ${changelog.length}})`,
        );
    } catch (error) {
        log.error(error);
    }
};

const main = async (outputDir, weeklyRecap, recapDay) => {
    if (!require('fs').existsSync(cacheFile)) {
        tryExportJson(cacheFile, { changelog: [] }, true, false);
    }

    const cache = importJson(cacheFile);

    const newWrs = [];

    if (fetchEnabled) {
        await fetchAndCacheChangelog(cache, newWrs);
    }

    const { changelog } = cache;

    const monday = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const sunday = moment().endOf('isoWeek').format('YYYY-MM-DD');
    log.info(`week start -> end: ${monday} -> ${sunday}`);

    let wrsThisWeek = 0;
    let pbsThisWeek = 0;

    const records = changelog.filter((entry) => {
        if (entry.banned === '1' || entry.pending === '1') {
            return false;
        }

        const isWr = entry.wr_gain === '1';
        const date = entry.time_gained.slice(0, 10);

        if (date >= monday && date <= sunday) {
            if (isWr) {
                ++wrsThisWeek;
            }

            ++pbsThisWeek;
        }

        return isWr;
    });

    twitter.updateBio({ wrsThisWeek, pbsThisWeek });

    const userCache = new Map();

    const generateCampaign = (maps) => {
        const campaign = [];

        for (const map of maps) {
            if (!map.exists) continue;

            const history = records
                .filter((entry) => entry.mapid == map.bestTimeId)
                .map(asWr)
                .filter((wr) => wr);

            const wrScore = history[0].score;
            const wrs = history.filter((wr) => wr.score === wrScore).reverse();

            const campaignMap = {
                map,
                wrs,
                history,
            };

            if (map.type === Portal2MapType.Cooperative) {
                campaignMap.history.forEach(findPartners);
            }

            campaignMap.history.forEach((wr) => {
                const cache = userCache.get(wr.user.id);

                if (!cache || wr.date > cache.date) {
                    userCache.set(wr.user.id, {
                        date: wr.date,
                        name: wr.user.name,
                        avatar: wr.user.avatar,
                    });
                }

                if (newWrs.find((id) => wr.id === id)) {
                    if (map.type === Portal2MapType.Cooperative) {
                        if (wr.isPartner) {
                            const partnerWr = campaignMap.history.find(({ id }) => id === wr.partnerId);
                            twitter.sendTweet([wr, partnerWr], map);
                        }
                    } else {
                        twitter.sendTweet([wr], map);
                    }
                }
            });

            campaign.push(campaignMap);
        }

        const updateUserCache = (wr) => {
            const cachedUser = userCache.get(wr.user.id);
            wr.user.name = cachedUser.name;
            wr.user.avatar = cachedUser.avatar;
        };

        campaign.forEach((campaign) => {
            campaign.history.forEach(updateUserCache);
            campaign.wrs.forEach(updateUserCache);
        });

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

    if (weeklyRecap) {
        const discord = new DiscordIntegration(process.env.DISCORD_WEBHOOK_ID, process.env.DISCORD_WEBHOOK_TOKEN);

        try {
            const recap = moment().set({ hour: 0, minute: 0, seconds: 0, milliseconds: 0 });

            if (recap.day() !== recapDay) {
                const adjustment = recap.day() > recapDay ? recap.day() - recapDay : 7 - recapDay;
                log.warn('adjusting recap day: -' + adjustment);
                recap.add(-adjustment, 'days');
            }

            const snapshotRange = [recap.clone().add(-7, 'days'), recap];

            discord
                .sendWebhook({
                    ...runRecap(overall, snapshotRange),
                    ...(await recapCommunity(cache, snapshotRange)),
                    week: recap.isoWeek() - 1,
                })
                .then(() => {
                    log.info('weekly recap sent');
                    discord.destroy();
                });
        } catch (error) {
            discord.destroy();
            log.error(error);
        }
    }

    tryMakeDir(`${outputDir}/stats`);
    tryExportJson(`${outputDir}/stats/latest.json`, { ...generateStats(overall), ...computeCharts(changelog) }, true);

    game.campaigns.push(overall);
    game.campaigns.forEach((campaign) => generateRankings(campaign, true));

    tryMakeDir(`${outputDir}/race`);
    tryMakeDir(`${outputDir}/race/unique`);
    tryMakeDir(`${outputDir}/race/total`);
    tryMakeDir(`${outputDir}/race/points`);

    const computedPoints = computePoints(changelog, moment().add(5, 'minutes').get('hour') !== 0);

    game.campaigns.forEach((campaign) => {
        const unique = generateRaceChart(campaign, true, computedPoints);
        const total = generateRaceChart(campaign, false, null);

        tryExportJson(
            `${outputDir}/race/unique/${campaign.name.toLowerCase().replace(/ /g, '-')}.json`,
            {
                firstRecordDate: unique.firstRecordDate,
                data: unique.data.map((entry) => ({ ...entry, points: undefined })),
            },
            true,
        );
        tryExportJson(
            `${outputDir}/race/points/${campaign.name.toLowerCase().replace(/ /g, '-')}.json`,
            {
                firstRecordDate: unique.firstRecordDate,
                data: unique.data.map((entry) => ({ ...entry, records: undefined })),
            },
            true,
        );
        tryExportJson(`${outputDir}/race/total/${campaign.name.toLowerCase().replace(/ /g, '-')}.json`, total, true);
    });

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
        .flat();

    mapWrs.forEach((wr) => {
        if (wr.beatenBy.length > 0) {
            const ids = wr.beatenBy.map(({ id }) => id);
            const newWrs = mapWrs.filter((wr) => ids.some((id) => wr.id === id));

            wr.beatenBy.forEach((beatenBy) => {
                const newWr = newWrs.find(({ id }) => id === beatenBy.id);
                beatenBy.date = newWr.date;
                beatenBy.user = { ...newWr.user };
            });
        }
    });

    const getNextDuration = (wr) => {
        if (
            wr.beatenBy.length > 0 &&
            !wr.beatenBy.some(({ id }) => id === wr.id) &&
            wr.beatenBy.some(({ user }) => user.id === wr.user.id)
        ) {
            const ids = wr.beatenBy.map(({ id }) => id);
            const newWrs = mapWrs.filter((wr) => ids.some((id) => wr.id === id));
            const newWr = newWrs.find(({ user }) => user.id === wr.user.id);

            if (newWr) {
                newWrs.forEach((newWr) => (newWr.excludeReign = true));
                const [nextDuration, lastWr] = getNextDuration(newWr);
                return [wr.duration + nextDuration, lastWr];
            }
        }

        return [wr.duration, wr];
    };

    const regignDuration = (wr) => {
        const [duration, lastWr] = getNextDuration(wr);

        wr.reign = {
            duration,
            lastWr: {
                ...lastWr,
            },
        };

        return wr;
    };

    const maxRows = 100;

    const largestImprovement = mapWrs
        .sort((a, b) => (a.delta === b.delta ? 0 : a.delta < b.delta ? 1 : -1))
        .slice(0, maxRows);
    const longestLasting = mapWrs
        .sort((a, b) => (a.duration === b.duration ? 0 : a.duration < b.duration ? 1 : -1))
        .slice(0, maxRows);
    const longestDomination = mapWrs
        .map(regignDuration)
        .map((wr) => {
            reignWr =
                !wr.excludeReign && wr.reign.lastWr
                    ? {
                          ...wr,
                          duration: wr.reign.duration,
                          beatenBy: wr.reign.lastWr.beatenBy,
                          lastScore: wr.reign.lastWr.score,
                          excludeReign: undefined,
                          reign: undefined,
                      }
                    : null;

            delete wr.reign;
            delete wr.excludeReign;

            return reignWr;
        })
        .filter((wr) => wr)
        .sort((a, b) => (a.duration === b.duration ? 0 : a.duration < b.duration ? 1 : -1))
        .slice(0, maxRows);

    return { largestImprovement, longestLasting, longestDomination };
};

const generateRankings = (campaign, statsPage) => {
    const mapWrs = campaign.maps
        .map((map) => {
            const history = [...map.history].reverse();

            return history.map((wr) => {
                const beatenBy = history.find((item) => item.score < wr.score);
                return {
                    ...wr,
                    beatenBy: beatenBy
                        ? [
                              {
                                  id: beatenBy.id,
                                  date: beatenBy.date,
                                  user: { ...beatenBy.user },
                                  score: beatenBy.score,
                              },
                          ]
                        : [],
                };
            });
        })
        .flat();

    const isSelfImprovedWr = (wr) => {
        const map = campaign.maps.find((chamber) => chamber.map.bestTimeId === wr.map.bestTimeId);
        if (!map) {
            throw new Error('Map not part of campaign');
        }

        const idx = map.history.findIndex(({ id }) => id === wr.id);
        if (idx === -1) {
            throw new Error('Record not found in history');
        }

        const previousWrs = map.history.slice(idx + 1);
        const [lastWr] = previousWrs;

        return previousWrs.filter(({ score }) => score === lastWr.score).find(({ user }) => user.id === wr.user.id);
    };

    const getNextWr = (wr) => {
        if (
            wr.beatenBy.length > 0 &&
            !wr.beatenBy.some(({ id }) => id === wr.id) &&
            wr.beatenBy.some(({ user }) => user.id === wr.user.id)
        ) {
            const ids = wr.beatenBy.map(({ id }) => id);
            const newWrs = mapWrs.filter((wr) => ids.some((id) => wr.id === id));
            const newWr = newWrs.find(({ user }) => user.id === wr.user.id);

            if (newWr) {
                return getNextWr(newWr);
            }
        }

        return wr;
    };

    const totalTime = campaign.maps.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);

    let users = campaign.maps.map((t) => t.wrs.map((r) => r.user)).flat();
    let wrs = campaign.maps.map((t) => t.wrs).flat();

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
                .reduce((a, b) => a + b, 0),
        }));

    if (!statsPage) {
        campaign.stats = {
            totalTime,
            leaderboard,
        };

        return campaign;
    }

    users = campaign.maps
        .map((t) => (t.history.length > 0 ? t.history : t.wrs).map(({ user, date }) => ({ ...user, date })))
        .flat();

    wrs = campaign.maps.map((t) => t.history).flat();
    frequency = users.reduce((count, user) => {
        count[user.id] = (count[user.id] || 0) + 1;
        return count;
    }, {});

    const historyLeaderboard = Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .map((key) => {
            const user = users.filter((u) => u.id === key).sort((a, b) => b.date.localeCompare(a.date))[0];
            delete user.date;

            const durationExact = mapWrs
                .filter((r) => r.user.id === key && r.duration)
                .map((r) => {
                    const reignWr = getNextWr(r);

                    if (isSelfImprovedWr(r)) {
                        return 0;
                    }

                    const [beatenBy] = reignWr.beatenBy;
                    const duration = moment(beatenBy ? beatenBy.date : undefined).diff(moment(r.date), 's');
                    if (duration < 0) {
                        log.warn('negative duration for:', JSON.stringify(r));
                    }

                    return duration;
                })
                .reduce((a, b) => a + b, 0);

            return {
                user,
                wrs: frequency[key],
                duration: durationExact,
            };
        });

    users = campaign.maps
        .map((t) => {
            const all = t.history.map((r) => r.user);
            const ids = [...new Set(t.history.map((r) => r.user.id))];
            return ids.map((id) => all.find((user) => user.id === id));
        })
        .flat();
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

const generateRaceChart = (campaign, unique, computedPoints) => {
    log.info(`generating race chart for ${campaign.name} (unique: ${unique})`);

    const getSnapshotRecords = (history, snapshotDate) => {
        const wrs = history.filter(({ date }) => snapshotDate.localeCompare(date.slice(0, 10)) >= 0);
        const [wr] = wrs;
        return wr ? wrs.filter(({ score }) => score === wr.score) : wrs;
    };

    const getSnapshot = (snapshotDate) => {
        const snapshot = {};

        for (const map of campaign.maps) {
            const history = snapshotDate ? getSnapshotRecords(map.history, snapshotDate) : map.history;

            for (const wr of history) {
                const user = snapshot[wr.user.id];
                const date = snapshotDate || wr.date.slice(0, 10);

                if (user) {
                    user.wrs[date] = (user.wrs[date] || 0) + 1;
                } else {
                    snapshot[wr.user.id] = {
                        user: {
                            ...wr.user,
                        },
                        wrs: {
                            [date]: 1,
                        },
                    };
                }
            }
        }

        return Object.entries(snapshot);
    };

    const [firstRecordDate] = campaign.maps
        .map(({ history }) => history[history.length - 1].date)
        .sort((a, b) => a.localeCompare(b));

    const then = moment(firstRecordDate);
    const now = moment();

    const result = {};

    const snapshot = getSnapshot(null);

    while (then.diff(now, 'days') < 0) {
        const snapshotDate = then.format('YYYY-MM-DD');
        const currentSnapshot = unique ? getSnapshot(snapshotDate) : snapshot;

        const rankingsSnapshot = (() => {
            if (!computedPoints) {
                return null;
            }

            const index = computedPoints.findIndex((entry) => entry.currentDay >= snapshotDate);
            if (index === -1) {
                log.warn('invalid index for ', snapshotDate);
                return [];
            }

            const offset = computedPoints[index].currentDay === snapshotDate ? 0 : -1;
            const rankings = computedPoints[index - offset];

            switch (campaign.name) {
                case 'Single Player':
                    return rankings.singlePlayer || [];
                case 'Cooperative':
                    return rankings.cooperative || [];
                default:
                    return rankings.overall || [];
            }
        })();

        for (const [userId, { user }] of snapshot) {
            const [_, userSnapshot] = currentSnapshot.find(([userIdSnapshot]) => userIdSnapshot === userId) || [];

            const data = result[user.id] || { records: [], points: rankingsSnapshot ? [] : undefined, user };

            const curRecords = (userSnapshot ? userSnapshot.wrs[snapshotDate] : null) || 0;
            const prevRecords = unique ? 0 : data.records[data.records.length - 1] || 0;

            data.records.push(curRecords + prevRecords);

            if (rankingsSnapshot) {
                const userRank = rankingsSnapshot.find((entry) => entry.user.id === user.id);
                data.points.push(userRank ? userRank.points : 0);
            }

            result[user.id] = data;
        }

        then.add(1, 'day');
    }

    return { firstRecordDate, data: Object.values(result) };
};

const runRecap = (campaign, snapshotRange) => {
    const [snapshotStart, snapshotEnd] = snapshotRange;
    log.info(`recap: ${snapshotStart.format()}-${snapshotEnd.format()}`);

    const wrs = campaign.maps
        .map((t) => t.history)
        .flat()
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
        .flat();

    mapWrs.forEach((wr) => {
        if (wr.beatenBy.id) {
            const newWr = mapWrs.find(({ id }) => id === wr.beatenBy.id);
            wr.beatenBy.date = newWr.date;
            wr.beatenBy.user = { ...newWr.user };
        }
    });

    const largestImprovement = mapWrs
        .sort((a, b) => (a.delta === b.delta ? 0 : a.delta < b.delta ? 1 : -1))
        .slice(0, 5);

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

if (process.argv.some((arg) => arg === '--test')) {
    main(path.join(__dirname, '../api/')).catch(inspect);
}

module.exports = main;
