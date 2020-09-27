import React from 'react';
import { withRouter } from 'react-router';
import moment from 'moment';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import FloatingActionButton from '../components/FloatingActionButton';
import SimpleTitle from '../components/SimpleTitle';
import BarChart from '../components/RaceChart';
import Api from '../Api';
import { useIsMounted } from '../Hooks';
import ViewContent from './ViewContent';

const randomColor = () => `rgb(${255 * Math.random()}, ${255 * Math.random()}, ${255 * Math.random()})`;

const RaceView = ({ match }) => {
    const isMounted = useIsMounted();

    const [race, setRace] = React.useState({
        data: undefined,
        labels: [],
        colors: [],
        len: 0,
    });

    const [run, setRun] = React.useState(true);

    const page = match.params[0];
    const date = match.params.date;
    const useLiveDuration = date === undefined || date === 'latest';

    React.useEffect(() => {
        setRace({ data: undefined });
    }, [page]);

    React.useEffect(() => {
        Api.request('race', date)
            .then(({ data }) => {
                if (isMounted.current) {
                    const players = Object.keys(data);
                    const len = data[players[0]].length;

                    setRace({
                        data,
                        timeline: Array(len)
                            .fill(0)
                            .map((_, idx) => moment('2012-03-22').add(idx, 'days').format('YYYY-MM-DD')),
                        labels: players.reduce((prev, cur) => {
                            return {
                                ...prev,
                                [cur]: (
                                    <div style={{ textAlign: 'right', paddingRight: '50px' }}>
                                        <div>{cur}</div>
                                    </div>
                                ),
                            };
                        }, {}),
                        colors: players.reduce(
                            (prev, cur) => ({
                                ...prev,
                                [cur]: randomColor(),
                            }),
                            {},
                        ),
                        len,
                    });
                }
            })
            .catch((error) => {
                console.error(error);

                if (isMounted.current) {
                    setRace({ data: null});
                }
            });
    }, [isMounted, page, date, useLiveDuration]);

    return (
        <ViewContent>
            <Paper>
                {race.data === undefined ? (
                    <LinearProgress />
                ) : race.data === null ? (
                    <SimpleTitle data="No data." />
                ) : (
                    <>
                        <Typography component="div" role="tabpanel">
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
                        </Typography>
                    </>
                )}
            </Paper>
            <FloatingActionButton />
        </ViewContent>
    );
};

export default withRouter(RaceView);
