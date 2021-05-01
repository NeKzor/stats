import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    avatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
        marginRight: 10,
    },
}));

const PlayerAvatar = ({ user }) => {
    const classes = useStyles();

    return (
        <Grid container direction="row" wrap="nowrap">
            <Grid item>
                <Avatar className={classes.avatar} src={user.avatar} />
            </Grid>
            <Grid item>
                <Link
                    color="inherit"
                    href={'https://board.iverb.me/profile/' + user.id}
                    rel="noreferrer"
                    target="_blank"
                    noWrap
                >
                    {user.name}
                </Link>
            </Grid>
        </Grid>
    );
};

export default PlayerAvatar;
