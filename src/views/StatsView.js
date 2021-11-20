import React from 'react';
import { withRouter } from 'react-router';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core';
import FloatingActionButton from '../components/FloatingActionButton';
import LongestDomination from '../components/LongestDomination';
import LongestLasting from '../components/LongestLasting';
import LargestImprovement from '../components/LargestImprovement';
import SimpleTitle from '../components/SimpleTitle';
import TimeFrequency from '../components/TimeFrequency';
import UnlikelyTable from '../components/UnlikelyTable';
import Api from '../Api';
import { useIsMounted } from '../Hooks';
import ViewContent from './ViewContent';

const useStyles = makeStyles((theme) => ({
    padTop: {
        paddingTop: '70px',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
}));

const statistics = {
    'longest-lasting': 'longestLasting',
    'longest-domination': 'longestDomination',
    'largest-improvement': 'largestImprovement',
    'time-frequency': 'timeFrequency',
};

const StatsView = ({ match }) => {
    const isMounted = useIsMounted();
    const history = useHistory();

    const [game, setGame] = React.useState(undefined);
    const [type, setType] = React.useState(statistics[match.params.type] || 'longestLasting');

    const onChangeType = React.useCallback(
        (event) => {
            setType(event.target.value);
        },
        [setType],
    );

    React.useEffect(() => {
        Api.request('stats')
            .then((game) => {
                if (isMounted.current) {
                    setGame(game);
                }
            })
            .catch((error) => {
                console.error(error);

                if (isMounted.current) {
                    setGame(null);
                }
            });
    }, [isMounted]);

    React.useEffect(() => {
        const entry = Object.entries(statistics).find(([_, value]) => value === type);
        if (entry) {
            const [route] = entry;
            if (route) {
                history.replace(`/stats/${route}`);
            }
        }
    }, [type, history]);

    const StatsComponent = (() => {
        switch (type) {
            case 'longestDomination':
                return LongestDomination;
            case 'longestLasting':
                return LongestLasting;
            case 'largestImprovement':
                return LargestImprovement;
            case 'timeFrequency':
                return TimeFrequency;
            default:
                return null;
        }
    })();

    const classes = useStyles();

    return (
        <ViewContent>
            <Paper>
                {game === undefined ? (
                    <LinearProgress />
                ) : game === null ? (
                    <SimpleTitle data="No data." />
                ) : (
                    <>
                        <Typography component="div" role="tabpanel">
                            <Box p={3}>
                                <FormControl className={classes.formControl}>
                                    <InputLabel>Stats Type</InputLabel>
                                    <Select value={type} onChange={onChangeType}>
                                        <MenuItem value={'longestLasting'}>Longest Lasting</MenuItem>
                                        <MenuItem value={'longestDomination'}>Longest Domination</MenuItem>
                                        <MenuItem value={'largestImprovement'}>Largest Improvement</MenuItem>
                                        <MenuItem value={'timeFrequency'}>Time Frequency</MenuItem>
                                    </Select>
                                </FormControl>
                                <Grid container direction="column" justify="center">
                                    <Grid item xs={12}>
                                        <Grid container direction="row" justify="center" alignContent="center">
                                            <Grid item xs={12}>
                                                <StatsComponent data={game[type]} />
                                            </Grid>
                                            {type === 'timeFrequency' && game[type] && (
                                                <Grid item xs={12}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        style={{ paddingTop: 20, paddingBottom: 10 }}
                                                    >
                                                        List of times which are very unlikely to achieve.
                                                    </Typography>
                                                    <UnlikelyTable data={game[type].unlikely}/>
                                                </Grid>
                                            )}
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

export default withRouter(StatsView);
