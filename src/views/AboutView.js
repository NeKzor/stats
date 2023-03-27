import React from 'react';
import moment from 'moment';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ViewContent from './ViewContent';
import AppState from '../AppState';

const useStyles = makeStyles((theme) => ({
    aboutBox: {
        padding: theme.spacing(3),
    },
}));

const Padding = () => <div style={{ paddingTop: '50px' }} />;

const getUpdate = () => {
    // Not sure if this is right lol
    const now = moment.utc();
    let updateIn = now.clone().add(1, 'hour').startOf('hour');

    const duration = moment.duration({ from: now, to: updateIn });
    const minutes = duration.get('minutes');
    const seconds = duration.get('seconds');

    const g = (value) => (value === 1 ? '' : 's');
    return `${minutes} minute${g(minutes)}, ${seconds} second${g(seconds)}`;
};

let clockTimer = null;

const AboutView = () => {
    const {
        state: { darkMode },
        dispatch,
    } = React.useContext(AppState);

    const [nextUpdate, setNextUpdate] = React.useState(getUpdate());

    React.useEffect(() => {
        clockTimer = setInterval(() => {
            setNextUpdate(getUpdate());
        }, 1000);

        return () => clearInterval(clockTimer);
    }, []);

    const toggleDarkMode = () => {
        dispatch({ action: 'toggleDarkMode' });
    };

    const classes = useStyles();

    return (
        <ViewContent>
            <Paper className={classes.aboutBox}>
                <Typography component="h2" variant="h5">
                    Portal 2 World Records & Statistics
                </Typography>
                <br />
                <Typography variant="body1">
                    This is{' '}
                    <Link rel="noopener" href="https://board.portal2.sr">
                        iverb
                    </Link>{' '}
                    1½ or something idk. Mainly inspired by{' '}
                    <Link rel="noopener" href="https://mkwrs.com">
                        mkwrs.com
                    </Link>
                    . Updates are hourly.
                </Typography>
                <Padding />
                <Typography variant="h5">Next Update</Typography>
                <br />
                {nextUpdate}
            </Paper>
        </ViewContent>
    );
};

export default AboutView;
