import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import { stableSort, stableSortSort } from '../utils/stableSort';

const rows = [
    { id: 'user.name', sortable: false, label: 'Player', align: 'left' },
    { id: 'wrs', id2: 'duration', sortable: true, label: 'World Records', align: 'left' },
    { id: 'duration', id2: 'wrs', sortable: true, label: 'Total Duration', align: 'left' },
];

const RankingsTableHead = ({ order, orderBy, onRequestSort, showDuration }) => {
    const createSortHandler = (prop1, prop2) => (event) => {
        onRequestSort(event, prop1, prop2);
    };

    return (
        <TableHead>
            <TableRow>
                {rows
                    .filter(({ id }) => id !== 'duration' || showDuration)
                    .map((row) => (
                        <TableCell
                            key={row.id}
                            align={row.align}
                            padding="default"
                            sortDirection={orderBy === row.id ? order : false}
                        >
                            {row.sortable === true && (
                                <Tooltip title={'Sort by ' + row.label} placement="bottom-start" enterDelay={300}>
                                    <TableSortLabel
                                        active={orderBy === row.id}
                                        direction={order}
                                        onClick={createSortHandler(row.id, row.id2)}
                                    >
                                        {row.label}
                                    </TableSortLabel>
                                </Tooltip>
                            )}
                            {row.sortable === false && row.label}
                        </TableCell>
                    ))}
            </TableRow>
        </TableHead>
    );
};

const useStyles = makeStyles((theme) => ({
    root: {
        overflowX: 'auto',
    },
    avatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
        marginRight: 10,
    },
}));

const defaultState = {
    order: 'desc',
    orderBy: 'wrs',
    thenBy: 'duration',
    page: 0,
    rowsPerPage: 50,
};

const noWrap = { whiteSpace: 'nowrap' };
const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const RecordsTable = ({ data, showDuration }) => {
    const [{ order, orderBy, thenBy }, setState] = React.useState({ ...defaultState });

    const handleRequestSort = (_, prop1, prop2) => {
        const newOrderBy = prop1;
        const newThenBy = prop2;

        setState((state) => ({
            ...state,
            order: state.orderBy === newOrderBy && state.order === 'desc' ? 'asc' : 'desc',
            orderBy: newOrderBy,
            thenBy: newThenBy,
        }));
    };

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Table size="small">
                <RankingsTableHead
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                    showDuration={showDuration}
                />
                <TableBody>
                    {(showDuration ? stableSortSort : stableSort)(data, order, orderBy, thenBy)
                        .map((row) => (
                            <TableRow tabIndex={-1} key={row.user.id}>
                                <MinTableCell align="left">
                                    <Grid container direction="row" alignItems="center">
                                        <Avatar className={classes.avatar} src={row.user.avatar} />
                                        <Link
                                            style={noWrap}
                                            color="inherit"
                                            href={'https://board.iverb.me/profile/' + row.user.id}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            {row.user.name}
                                        </Link>
                                    </Grid>
                                </MinTableCell>
                                <MinTableCell align="left">{row.wrs}</MinTableCell>
                                {showDuration && (
                                    <MinTableCell align="left">
                                        {row.duration} day{row.duration === 1 ? '' : 's'}
                                    </MinTableCell>
                                )}
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecordsTable;
