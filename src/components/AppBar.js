import React from 'react';
import { Link as RouterLink, withRouter } from 'react-router-dom';
import MaterialAppBar from '@material-ui/core/AppBar';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import DarkModeIcon from '@material-ui/icons/Brightness4';
import LightModeIcon from '@material-ui/icons/Brightness7';
import GitHubIcon from '@material-ui/icons/GitHub';
import MenuIcon from '@material-ui/icons/Menu';
import AppState from '../AppState';
import { useTitle } from '../Hooks';

const useStyles = makeStyles((theme) => ({
    root: {
        paddingBottom: theme.spacing(8),
    },
    list: {
        width: theme.spacing(25),
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
    drawer: {
        width: 240,
        flexShrink: 0,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    flex: {
        flex: 1,
    },
    active: {
        color: theme.palette.primary.main,
    },
    githubButton: {
        marginRight: 10,
    },
}));

const pageLinks = [
    { title: '404 - Page Not Found', link: null, inDrawer: false },
    { title: 'stats', link: '/', inDrawer: false },
    { title: 'Records', link: '/records', inDrawer: true, default: true },
    { title: 'Rankings', link: '/ranks', inDrawer: true, default: true },
    { title: 'Statistics', link: '/stats', inDrawer: true, default: true },
    { title: 'Race', link: '/race', inDrawer: true, default: true },
    { title: 'Demo Inspection', link: '/demo', inDrawer: false },
    { title: 'About', link: '/about', inDrawer: false },
];

const AppBar = ({ location }) => {
    const {
        state: { darkMode },
        dispatch,
    } = React.useContext(AppState);

    const [open, setOpen] = React.useState(false);

    const page = React.useMemo(
        () =>
            pageLinks.find(
                (x) => x.link === location.pathname || (x.link !== null && location.pathname.startsWith(x.link + '/')),
            ) || pageLinks[0],
        [location],
    );

    useTitle(page.title);

    const showDrawer = (state) => () => {
        setOpen(state);
    };

    const toggleDarkMode = () => {
        dispatch({ action: 'toggleDarkMode' });
    };

    const classes = useStyles();

    const list = (
        <div className={classes.list}>
            <List>
                <ListItem button component={RouterLink} to={'/'}>
                    <ListItemText primary="stats" />
                </ListItem>
            </List>
            <Divider />
            <List>
                {pageLinks
                    .filter((x) => x.inDrawer)
                    .map((item, index) => (
                        <ListItem
                            button
                            key={index}
                            component={RouterLink}
                            to={item.link}
                            className={item.title === page.title ? classes.active : undefined}
                        >
                            <ListItemText primary={item.title} />
                        </ListItem>
                    ))}
                <Divider />
                <List>
                    <ListItem
                        button
                        component={RouterLink}
                        to={'/demo'}
                        className={page.link === '/demo' ? classes.active : undefined}
                    >
                        <ListItemText primary={'Demo Inspection'} />
                    </ListItem>
                    <ListItem
                        button
                        component={RouterLink}
                        to={'/about'}
                        className={page.link === '/about' ? classes.active : undefined}
                    >
                        <ListItemText primary={'About'} />
                    </ListItem>
                </List>
            </List>
        </div>
    );

    return (
        <div className={classes.root}>
            <MaterialAppBar className={classes.appBar} position="fixed">
                <Toolbar>
                    <Hidden lgUp>
                        <IconButton className={classes.menuButton} onClick={showDrawer(true)} color="inherit">
                            <MenuIcon />
                        </IconButton>
                    </Hidden>
                    <Typography variant="h6" color="inherit">
                        <Link component={RouterLink} to="/" color="inherit" underline="none">
                            {page.title}
                        </Link>
                    </Typography>
                    <div className={classes.flex} />
                    <Link color="inherit" rel="noopener" href="https://github.com/NeKzor/stats">
                        <IconButton
                            className={classes.githubButton}
                            title="View source code"
                            color="inherit"
                            size="small"
                        >
                            <GitHubIcon />
                        </IconButton>
                    </Link>
                    <IconButton
                        title="Toggle light/dark theme"
                        color="inherit"
                        size="small"
                        onClick={toggleDarkMode}
                    >
                        {darkMode.enabled ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Toolbar>
            </MaterialAppBar>
            <Hidden lgUp implementation="css">
                <SwipeableDrawer open={open} onClose={showDrawer(false)} onOpen={showDrawer(true)} variant="temporary">
                    <div tabIndex={0} role="button" onClick={showDrawer(false)} onKeyDown={showDrawer(false)}>
                        {list}
                    </div>
                </SwipeableDrawer>
            </Hidden>
            <Hidden mdDown implementation="css">
                <Drawer variant="permanent">
                    <div tabIndex={0} role="button">
                        {list}
                    </div>
                </Drawer>
            </Hidden>
        </div>
    );
};

export default withRouter(AppBar);
