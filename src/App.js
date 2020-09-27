import React from 'react';
import { Route, Switch, Redirect, HashRouter } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import { blue, orange, red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';
import AppBar from './components/AppBar';
import AboutView from './views/AboutView';
import DemoView from './views/DemoView';
import NotFoundView from './views/NotFoundView';
import AppState, { AppReducer } from './AppState';
import RecordsView from './views/RecordsView';
import RankingsView from './views/RankingsView';
import StatsView from './views/StatsView';
import RaceView from './views/RaceView';

const useStyles = makeStyles((theme) => ({
    views: {
        marginTop: theme.spacing(5),
    },
}));

const App = () => {
    const [state, dispatch] = React.useReducer(...AppReducer);

    const theme = React.useMemo(() => {
        return createMuiTheme({
            palette: {
                primary: {
                    light: blue[300],
                    main: blue[500],
                    dark: blue[700],
                },
                secondary: {
                    light: orange[300],
                    main: orange[500],
                    dark: orange[700],
                },
                error: {
                    main: red.A400,
                },
                type: state.darkMode.enabled ? 'dark' : 'light',
            },
        });
    }, [state.darkMode.enabled]);

    const classes = useStyles();
    const context = React.useMemo(() => ({ state, dispatch }), [state, dispatch]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppState.Provider value={context}>
                <HashRouter basename={'/'}>
                    <AppBar />
                    <div className={classes.views}>
                        <Switch>
                            <Redirect exact from="/" to="/records" />
                            <Route exact path="/records/:date?" component={RecordsView} />
                            <Route exact path="/ranks/:date?" component={RankingsView} />
                            <Route exact path="/stats/:date?" component={StatsView} />
                            <Route exact path="/race/:date?" component={RaceView} />
                            <Route exact path="/about" component={AboutView} />
                            <Route exact path="/demo" component={DemoView} />
                            <Route component={NotFoundView} />
                        </Switch>
                    </div>
                </HashRouter>
            </AppState.Provider>
        </ThemeProvider>
    );
};

export default App;
