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
    const useLiveDuration = date === undefined || date === 'latest';

    React.useEffect(() => {
        setTab(0);
        setGame(undefined);
    }, [page]);

    React.useEffect(() => {
        (async () => {
            const game = (await Api.request('records', date)).campaigns;

            for (const campaign of game) {
                const rows = [];

                let index = 0;
                for (const { map, wrs, history } of campaign.maps) {
                    for (const wr of wrs) {
                        const wrDate = moment(wr.date);
                        const duration = useLiveDuration ? moment().diff(wrDate, 'd') : wr.duration;

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

                if (useLiveDuration) {
                    campaign.stats.leaderboard.forEach((entry, idx) => {
                        campaign.stats.leaderboard[idx].duration = campaign.maps
                            .filter((r) => r.user.id === entry.user.id)
                            .map((r) => r.duration)
                            .reduce((a, b) => a + b, 0);
                    });
                }
            }

            if (!isMounted.current) return;
            setGame(game);
        })();
    }, [isMounted, page, date, useLiveDuration]);

    const handleTab = (_, newValue) => {
        setTab(newValue);
    };

    const classes = useStyles();

    return (
        <ViewContent>
            <Paper>
                {game === undefined ? (
                    <LinearProgress />
                ) : game.length === 0 ? (
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
                                            useLiveDuration={useLiveDuration}
                                        />
                                    </Grid>
                                    <Grid item xs={12} className={classes.padTop}>
                                        <Grid container direction="row" justify="center" alignContent="center">
                                            <Grid item xs={12} md={6}>
                                                <RankingsTable
                                                    data={game[tab].stats.leaderboard}
                                                    useLiveDuration={useLiveDuration}
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
