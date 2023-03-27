import React from 'react';
import { withRouter } from 'react-router';
import moment from 'moment';
import Box from '@material-ui/core/Box';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core';
import MomentUtils from '@date-io/moment';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import FloatingActionButton from '../components/FloatingActionButton';
import SimpleTitle from '../components/SimpleTitle';
import BarChart from '../components/RaceChart';
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
    datePicker: {
        marginTop: 0,
        width: 140,
    },
}));

const randomColor = () => `rgb(${255 * Math.random()}, ${255 * Math.random()}, ${255 * Math.random()})`;

const RaceView = ({ match }) => {
    const isMounted = useIsMounted();

    const chart = React.useRef(null);

    const [race, setRace] = React.useState({
        data: undefined,
        labels: [],
        colors: [],
        len: 0,
    });

    const [run, setRun] = React.useState(true);
    const [type, setType] = React.useState('unique');
    const [campaign, setCampaign] = React.useState('single-player');
    const [date, setDate] = React.useState(new Date());
    const [minDate, setMinDate] = React.useState(new Date());

    const page = match.params[0];

    const onChangeDate = React.useCallback(
        (date) => {
            if (chart.current) {
                const { props } = chart.current;
                const newDate = moment(date).format('YYYY-MM-DD');
                const idx = props.timeline.indexOf(newDate);

                if (idx !== -1) {
                    chart.current.setState((prevState) => ({ ...prevState, idx }));
                }

                clearInterval(chart.current.state.intervalId);
            }
            setDate(date);
        },
        [setDate],
    );

    const onChangeType = React.useCallback(
        (event) => {
            setType(event.target.value);
        },
        [setType],
    );
    const onChangeCampaign = React.useCallback(
        (event) => {
            setCampaign(event.target.value);
        },
        [setCampaign],
    );

    React.useEffect(() => {
        setRace({ data: undefined });
    }, [page]);

    React.useEffect(() => {
        if (isMounted.current) {
            setRace({ data: undefined });
        }

        Api.request('race', `${type}/${campaign}`)
            .then(({ firstRecordDate, data }) => {
                if (isMounted.current) {
                    const users = data.map(({ user }) => user);
                    const [firstEntry] = data;
                    const length = firstEntry ? (firstEntry.records || firstEntry.points).length : 0;

                    setDate(new Date(firstRecordDate));
                    setMinDate(new Date(firstRecordDate));

                    setRace({
                        data: data.reduce((chart, { user, records, points }) => {
                            chart[user.id] = records || (points ? points.map((value) => Math.floor(value)) : []);
                            return chart;
                        }, {}),
                        timeline: Array(length)
                            .fill(0)
                            .map((_, idx) => moment(firstRecordDate).add(idx, 'days').format('YYYY-MM-DD')),
                        labels: users.reduce((labels, user) => {
                            return {
                                ...labels,
                                [user.id]: (
                                    <div style={{ textAlign: 'right', paddingRight: '50px' }}>
                                        <div>{user.name}</div>
                                    </div>
                                ),
                            };
                        }, {}),
                        colors: users.reduce(
                            (users, user) => ({
                                ...users,
                                [user.id]: randomColor(),
                            }),
                            {},
                        ),
                        len: length,
                    });
                }
            })
            .catch((error) => {
                console.error(error);

                if (isMounted.current) {
                    setRace({ data: null });
                }
            });
    }, [isMounted, page, type, campaign]);

    const classes = useStyles();

    return (
        <ViewContent>
            <Paper>
                <Typography component="div" role="tabpanel">
                    <Box p={3}>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Campaign</InputLabel>
                            <Select value={campaign} onChange={onChangeCampaign}>
                                <MenuItem value={'single-player'}>Single Player</MenuItem>
                                <MenuItem value={'cooperative'}>Cooperative</MenuItem>
                                <MenuItem value={'overall'}>Overall</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Stats Type</InputLabel>
                            <Select value={type} onChange={onChangeType}>
                                <MenuItem value={'unique'}>World Records</MenuItem>
                                <MenuItem value={'total'}>Total World Records</MenuItem>
                                <MenuItem value={'points'}>Points</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl className={classes.formControl}>
                            <MuiPickersUtilsProvider utils={MomentUtils}>
                                <KeyboardDatePicker
                                    className={classes.datePicker}
                                    disableToolbar
                                    minDate={minDate}
                                    variant="inline"
                                    format="YYYY-MM-DD"
                                    margin="normal"
                                    label="Start Date"
                                    value={date}
                                    onChange={onChangeDate}
                                    disableFuture
                                    KeyboardButtonProps={{
                                        'aria-label': 'change date',
                                    }}
                                    />
                            </MuiPickersUtilsProvider>
                        </FormControl>
                    </Box>
                    {race.data === undefined ? (
                        <LinearProgress />
                    ) : race.data === null ? (
                        <SimpleTitle data="No data." />
                    ) : (
                        <>
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                                onClick={() => setRun((run) => !run)}
                            >
                                <BarChart
                                    ref={chart}
                                    start={run}
                                    timeout={50}
                                    delay={1}
                                    timelineStyle={{
                                        textAlign: 'center',
                                        fontSize: '50px',
                                        color: 'rgb(148, 148, 148)',
                                        marginBottom: '100px',
                                    }}
                                    textBoxStyle={{
                                        textAlign: 'center',
                                        color: 'rgb(133, 131, 131)',
                                        fontSize: '30px',
                                    }}
                                    barStyle={{
                                        height: '60px',
                                        marginTop: '10px',
                                        borderRadius: '10px',
                                    }}
                                    width={[20, 75, 30]}
                                    {...race}
                                />
                            </div>
                        </>
                    )}
                </Typography>
            </Paper>
            <FloatingActionButton />
        </ViewContent>
    );
};

export default withRouter(RaceView);
