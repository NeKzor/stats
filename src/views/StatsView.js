import React from 'react';
import { withRouter } from 'react-router';
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
import LargestImprovement from '../components/LargestImprovement';
import LongestLasting from '../components/LongestLasting';
import SimpleTitle from '../components/SimpleTitle';
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

const StatsView = ({ match }) => {
    const isMounted = useIsMounted();

    const [game, setGame] = React.useState(undefined);
    const [type, setType] = React.useState('longestLasting');

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
        setGame(undefined);
    }, [page]);

    React.useEffect(() => {
        (async () => {
            const game = await Api.request('stats', date);
            if (!isMounted.current) return;
            setGame(game);
        })();
    }, [isMounted, page, date, useLiveDuration]);

    const StatsComponent = (() => {
        switch (type) {
            case 'longestLasting':
                return LongestLasting;
            case 'largestImprovement':
                return LargestImprovement;
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
                                        <MenuItem value={'largestImprovement'}>Largest Improvement</MenuItem>
                                    </Select>
                                </FormControl>
                                <Grid container direction="column" justify="center">
                                    <Grid item xs={12}>
                                        <Grid container direction="row" justify="center" alignContent="center">
                                            <Grid item xs={12}>
                                                <StatsComponent data={game[type]} useLiveDuration={useLiveDuration} />
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

export default withRouter(StatsView);
