import React from 'react';
import { withRouter } from 'react-router';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import RankingsTable from '../components/RankingsTable';
import RecordsChart from '../components/RecordsChart';
import { makeStyles } from '@material-ui/core';
import FloatingActionButton from '../components/FloatingActionButton';
import Api from '../Api';
import { useIsMounted } from '../Hooks';
import ViewContent from './ViewContent';
import SimpleTitle from '../components/SimpleTitle';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import UniqueRecordsChart from '../components/UniqueRecordsChart';

const useStyles = makeStyles((theme) => ({
    padTop: {
        paddingTop: '70px',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
}));

const RankingsView = ({ match }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [tab, setTab] = React.useState(0);
    const [type, setType] = React.useState('leaderboard');

    const onChangeType = React.useCallback(
        (event) => {
            setType(event.target.value);
        },
        [setType],
    );

    const page = match.params[0];
    const date = match.params.date;
    const useLiveDuration = date === undefined || date === 'latest';

    React.useEffect(() => {
        setTab(0);
        setGame(undefined);
    }, [page]);

    React.useEffect(() => {
        Api.request('ranks', date)
            .then(({ campaigns }) => {
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
    }, [isMounted, page, date, useLiveDuration]);

    const handleTab = React.useCallback(
        (_, newValue) => {
            setTab(newValue);
        },
        [setTab],
    );

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
                                <FormControl className={classes.formControl}>
                                    <InputLabel>Rankings Type</InputLabel>
                                    <Select value={type} onChange={onChangeType}>
                                        <MenuItem value={'leaderboard'}>Live</MenuItem>
                                        <MenuItem value={'uniqueLeaderboard'}>Unique</MenuItem>
                                        <MenuItem value={'historyLeaderboard'}>Total</MenuItem>
                                    </Select>
                                </FormControl>
                                <Grid container direction="column" justify="center">
                                    <Grid item xs={12}>
                                        <Grid container direction="row" justify="center" alignContent="center">
                                            <Grid item xs={12} md={6}>
                                                <RankingsTable
                                                    data={game[tab].stats[type]}
                                                    showDuration={type !== 'uniqueLeaderboard'}
                                                    useLiveDuration={useLiveDuration}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6} className={classes.padTop}>
                                                <Grid container direction="column" justify="center">
                                                    <Grid item xs={12}>
                                                        {type === 'uniqueLeaderboard' ? (
                                                            <UniqueRecordsChart
                                                                title="WRs"
                                                                labels={game[tab].stats[type]
                                                                    .map((row) => row.user.name)
                                                                    .slice(0, 20)}
                                                                series={[
                                                                    {
                                                                        name: 'Unique WRs',
                                                                        data: game[tab].stats[type]
                                                                            .slice(0, 20)
                                                                            .map((row) => row.wrs),
                                                                    },
                                                                ]}
                                                            />
                                                        ) : (
                                                            <RecordsChart
                                                                title="WRs"
                                                                labels={game[tab].stats[type].map(
                                                                    (row) => row.user.name,
                                                                )}
                                                                series={game[tab].stats[type].map((row) => row.wrs)}
                                                                rest={type === 'historyLeaderboard'}
                                                            />
                                                        )}
                                                    </Grid>
                                                    <Grid item xs={12} className={classes.padTop}></Grid>
                                                </Grid>
                                            </Grid>
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

export default withRouter(RankingsView);
