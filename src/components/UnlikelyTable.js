import React from 'react';
import Moment from 'react-moment';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import PlayerAvatar from './PlayerAvatar';
import { stableSortSort } from '../utils/stableSort';
import { getDateDifferenceColor, formatScore, formatDuration } from '../utils/tools';

const rows = [
    { id: 'time_gained', sortable: false, label: 'Date', align: 'left' },
    { id: 'chamberName', sortable: false, label: 'Map', align: 'left' },
    { id: 'score', sortable: false, label: 'Time', align: 'left' },
    { id: 'player_name', sortable: false, label: 'Player', align: 'left' },
];

const UnlikelygHead = ({ order, orderBy, onRequestSort }) => {
    const createSortHandler = (prop1, prop2) => (event) => {
        onRequestSort(event, prop1, prop2);
    };

    return (
        <TableHead>
            <TableRow>
                {rows.map((row) => (
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

const useStyles = makeStyles((_) => ({
    root: {
        overflowX: 'auto',
    },
}));

const defaultState = {
    order: 'desc',
    orderBy: 'time_gained',
    thenBy: 'chamberName',
    page: 0,
    rowsPerPage: 50,
};

const noWrap = { whiteSpace: 'nowrap' };
const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const UnlikelyTable = ({ data }) => {
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
                <UnlikelygHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
                <TableBody>
                    {stableSortSort(data, order, orderBy, thenBy).map((row) => {
                        return (
                            <TableRow tabIndex={-1} key={row.id}>
                                <MinTableCell align="left">
                                    <Tooltip
                                        title={<Moment fromNow>{row.time_gained}</Moment>}
                                        placement="bottom"
                                        enterDelay={300}
                                    >
                                        <Moment
                                            style={{ color: getDateDifferenceColor(row.time_gained), ...noWrap }}
                                            format="YYYY-MM-DD"
                                        >
                                            {row.time_gained}
                                        </Moment>
                                    </Tooltip>
                                </MinTableCell>
                                <MinTableCell
                                    style={noWrap}
                                    align="left"
                                >
                                    <Link
                                        color="inherit"
                                        href={`https://board.portal2.sr/chamber/${row.mapid}`}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        {row.chamberName}
                                    </Link>
                                </MinTableCell>
                                <MinTableCell align="left">{formatScore(row.score)}</MinTableCell>
                                <MinTableCell align="left">
                                    <PlayerAvatar user={{ id: row.profile_number, name: row.player_name, avatar: row.avatar }} />
                                </MinTableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default UnlikelyTable;
