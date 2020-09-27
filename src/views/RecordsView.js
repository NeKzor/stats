import React from 'react';
import { withRouter } from 'react-router';
import moment from 'moment';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import RankingsTable from '../components/RankingsTable';
import RecordsTable from '../components/RecordsTable';
import RecordsChart from '../components/RecordsChart';
import { makeStyles } from '@material-ui/core';
import FloatingActionButton from '../components/FloatingActionButton';
import Api from '../Api';
import { useIsMounted } from '../Hooks';
import ViewContent from './ViewContent';
import SimpleTitle from '../components/SimpleTitle';
//import OverallTable from '../components/OverallTable';

const useStyles = makeStyles((_) => ({
    padTop: {
        paddingTop: '70px',
    },
}));

const RecordsView = ({ match }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [tab, setTab] = React.useState(0);

    const page = match.params[0];
    const date = match.params.date;
    const live = date === undefined || date === 'latest';

    React.useEffect(() => {
        setTab(0);
        setGame(undefined);
    }, [page]);

    React.useEffect(() => {
        Api.request('records')
            .then(({ campaigns }) => {
                const snapshotDate = moment(date, ['YYYY-MM-DD']);
                const snapshot = !live && snapshotDate.isValid();

                if (snapshot) {
                    for (const campaign of campaigns) {
                        for (const map of campaign.maps) {
                            map.history = map.history.filter(({ date }) => moment(date).diff(snapshotDate, 'd') <= 0);

                            const currentWr = map.history[map.history.length - 1];
                            map.wrs = map.history.filter((wr) => wr.score === currentWr.score);
                            map.wrs.forEach((wr) => {
                                wr.beatenBy = { id: null };
                                wr.duration = snapshotDate.diff(moment(wr.date), 'd');
                            });
                        }

                        const totalTime = campaign.maps.map((t) => t.wrs[0].score).reduce((a, b) => a + b, 0);

                        const users = campaign.maps
                            .map((t) => t.wrs.map((r) => r.user))
                            .reduce((acc, val) => acc.concat(val), []);
                        const wrs = campaign.maps.map((t) => t.wrs).reduce((acc, val) => acc.concat(val), []);

                        const frequency = users.reduce((count, user) => {
                            count[user.id] = (count[user.id] || 0) + 1;
                            return count;
                        }, {});

                        const leaderboard = Object.keys(frequency)
                            .sort((a, b) => frequency[b] - frequency[a])
                            .map((key) => ({
                                user: users.find((u) => u.id === key),
                                wrs: frequency[key],
                                duration: snapshot
                                    ? wrs
                                          .filter((r) => r.user.id === key)
                                          .map((r) => r.duration)
                                          .reduce((a, b) => a + b, 0)
                                    : undefined,
                            }));

                        campaign.stats = {
                            totalTime,
                            leaderboard,
                        };
                    }
                }

                for (const campaign of campaigns) {
                    const rows = [];

                    let index = 0;
                    for (const { map, wrs, history } of campaign.maps) {
                        for (const wr of wrs) {
                            const wrDate = moment(wr.date);
                            const duration = live ? moment().diff(wrDate, 'd') : wr.duration;

                            rows.push({
                                map: {
                                    id: map.bestTimeId,
                                    name: map.alias,
                                    isFirst: wr === wrs[0],
                                    isLast: wr === wrs[wrs.length - 1],
                                    records: wrs.length,
                                    history,
                                    index,
                                },
                                ...wr,
                                duration,
                            });
                        }

                        ++index;
                    }

                    campaign.maps = rows;

                    if (live) {
                        campaign.stats.leaderboard.forEach((entry, idx) => {
                            campaign.stats.leaderboard[idx].duration = campaign.maps
                                .filter((r) => r.user.id === entry.user.id)
                                .map((r) => r.duration)
                                .reduce((a, b) => a + b, 0);
                        });
                    }
                }

                if (isMounted.current) {
                    setGame(campaigns);
                }
            })
            .catch((error) => {
                console.error(error);

                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [isMounted, page, date, live]);

    const handleTab = React.useCallback((_, newValue) => setTab(newValue), [setTab]);

    const classes = useStyles();

    return (
        <ViewContent>
            <Paper>
                {game === undefined ? (
                    <LinearProgress />
                ) : game === null || game.length === 0 ? (
                    <SimpleTitle data="No data." />
                ) : (
                    <>
                        {game.length > 1 && (
                            <Tabs
                                value={tab}
                                onChange={handleTab}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                {game.map((campaign) => (
                                    <Tab label={campaign.name} key={campaign.name} />
                                ))}
                            </Tabs>
                        )}
                        <Typography component="div" role="tabpanel">
                            <Box p={3}>
                                <Grid container direction="column" justify="center">
                                    <Grid item xs={12}>
                                        <RecordsTable
                                            data={game[tab].maps}
                                            stats={game[tab].stats}
                                            useLiveDuration={live}
                                        />
                                    </Grid>
                                    <Grid item xs={12} className={classes.padTop}>
                                        <Grid container direction="row" justify="center" alignContent="center">
                                            <Grid item xs={12} md={6}>
                                                <RankingsTable
                                                    data={game[tab].stats.leaderboard}
                                                    useLiveDuration={live}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6} className={classes.padTop}>
                                                <Grid container direction="column" justify="center">
                                                    <Grid item xs={12}>
                                                        <RecordsChart
                                                            title="WRs"
                                                            labels={game[tab].stats.leaderboard.map(
                                                                (row) => row.user.name,
                                                            )}
                                                            series={game[tab].stats.leaderboard.map((row) => row.wrs)}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} className={classes.padTop}></Grid>
                                                </Grid>
                                            </Grid>
                                            {/* <Grid item xs={12} md={6} className={classes.padTop}>
                                                <Typography variant="subtitle1" component="h2" gutterBottom>
                                                    Overall Rankings
                                                </Typography>
                                                <br></br>
                                                <OverallTable data={[]} />
                                            </Grid>
                                            <Grid item xs={12} md={6}></Grid> */}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Typography>
                    </>
                )}
            </Paper>
            <FloatingActionButton />
        </ViewContent>
    );
};

export default withRouter(RecordsView);
