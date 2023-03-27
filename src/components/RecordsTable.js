import React from 'react';
import Moment from 'react-moment';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import HistoryIcon from '@material-ui/icons/History';
import YouTubeIcon from '@material-ui/icons/YouTube';
import PlayerAvatar from './PlayerAvatar';
import { stableSort } from '../utils/stableSort';
import { formatDuration, formatNumber, formatScore, getDateDifferenceColor } from '../utils/tools';
import { useLocalStorage } from '../Hooks';

const rows = [
    { id: 'map.name', sortable: true, label: 'Chamber', align: 'left' },
    { id: 'score', sortable: true, label: 'Record', align: 'left' },
    { id: 'user.name', sortable: true, label: 'Player', align: 'left' },
    { id: 'date', sortable: true, label: 'Date', align: 'left' },
    { id: 'duration', sortable: true, label: 'Duration', align: 'left' },
    { id: 'id', sortable: false, label: '', align: 'left' },
];

const RecordsTableHead = ({ order, orderBy, onRequestSort }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                {rows.map((row, idx) => (
                    <TableCell
                        key={idx}
                        align={row.align}
                        padding="default"
                        sortDirection={orderBy === row.id ? order : false}
                        colSpan={idx === rows.length - 1 ? 2 : 1}
                    >
                        {row.sortable === true && (
                            <Tooltip title={'Sort by ' + row.label} placement="bottom-start" enterDelay={300}>
                                <TableSortLabel
                                    active={orderBy === row.id}
                                    direction={order}
                                    onClick={createSortHandler(row.id)}
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
    order: 'asc',
    orderBy: 'map.index',
    page: 0,
    rowsPerPage: 250,
};

const noWrap = { whiteSpace: 'nowrap' };
const minifiedStyle = { padding: '7px 0px 7px 16px' };
const MinTableCell = (props) => <TableCell style={minifiedStyle} {...props} />;

const useRowStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
    avatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
        marginRight: 10,
    },
}));

const RecordsHistoryRow = ({ wr, useLiveDuration }) => {
    const score = formatScore(wr.score);
    const delta = wr.delta !== null ? formatScore(wr.delta) : null;
    const [duration, durationTitle] = formatDuration(wr.duration);

    const renderCell = wr.isPartner !== false || !wr.partnerId;
    const isCurrentWr = wr.beatenBy.id === null;

    return (
        <TableRow tabIndex={-1}>
            {renderCell && (
                <MinTableCell align="left" rowSpan={wr.isPartner === true ? 2 : 1}>
                    <Tooltip title={<Moment fromNow>{wr.date}</Moment>} placement="bottom" enterDelay={300}>
                        <Moment style={{ color: getDateDifferenceColor(wr.date), ...noWrap }} format="YYYY-MM-DD">
                            {wr.date}
                        </Moment>
                    </Tooltip>
                </MinTableCell>
            )}
            {renderCell && (
                <MinTableCell align="left" rowSpan={wr.isPartner === true ? 2 : 1}>
                    {score}
                </MinTableCell>
            )}
            <MinTableCell align="left">
                <Link
                    color="inherit"
                    href={`https://board.portal2.sr/profile/${wr.user.id}`}
                    rel="noreferrer"
                    target="_blank"
                >
                    {wr.user.name}
                </Link>
            </MinTableCell>
            {renderCell && (
                <MinTableCell align="left" rowSpan={wr.isPartner === true ? 2 : 1}>
                    {delta ? '-' + delta : ''}
                </MinTableCell>
            )}
            {renderCell && (
                <MinTableCell align="left" rowSpan={wr.isPartner === true ? 2 : 1}>
                    <Tooltip title={durationTitle} placement="bottom" enterDelay={300}>
                        {useLiveDuration && isCurrentWr ? (
                            <Moment style={noWrap} diff={wr.date} unit="days"></Moment>
                        ) : (
                            <span>{formatNumber(duration)}</span>
                        )}
                    </Tooltip>
                </MinTableCell>
            )}
            <MinTableCell align="left" style={noWrap}>
                {wr.demo && (
                    <Tooltip title="Download Demo" placement="bottom" enterDelay={300}>
                        <IconButton
                            size="small"
                            style={noWrap}
                            color="inherit"
                            href={'https://board.portal2.sr/getDemo?id=' + wr.id}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <SaveAltIcon fontSize="inherit" />
                        </IconButton>
                    </Tooltip>
                )}
                {wr.media && (
                    <Tooltip title="Watch on YouTube" placement="bottom" enterDelay={300}>
                        <IconButton
                            size="small"
                            style={{ ...noWrap, marginLeft: !wr.demo ? 24 : undefined }}
                            color="inherit"
                            href={'https://youtu.be/' + wr.media}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <YouTubeIcon fontSize="inherit" />
                        </IconButton>
                    </Tooltip>
                )}
            </MinTableCell>
        </TableRow>
    );
};

const RecordsRow = ({ wr, orderBy, useLiveDuration, history, onClickHistory }) => {
    const score = formatScore(wr.score);
    const delta = wr.delta !== null ? formatScore(wr.delta) : null;

    const classes = useRowStyles();

    const open = history === wr.map.id;

    return (
        <>
            <TableRow tabIndex={-1}>
                {(wr.map.isFirst || (orderBy !== 'map.name' && orderBy !== 'map.index')) && (
                    <MinTableCell
                        style={noWrap}
                        rowSpan={orderBy === 'map.name' || orderBy === 'map.index' ? wr.map.records : 1}
                        align="left"
                    >
                        <Link
                            color="inherit"
                            href={`https://board.portal2.sr/chamber/${wr.map.id}`}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {wr.map.name}
                        </Link>
                    </MinTableCell>
                )}
                {(wr.map.isFirst || (orderBy !== 'map.name' && orderBy !== 'map.index')) && (
                    <MinTableCell
                        rowSpan={orderBy === 'map.name' || orderBy === 'map.index' ? wr.map.records : 1}
                        align="left"
                    >
                        {delta && (
                            <Tooltip title={<span>-{delta} to former record</span>} placement="bottom" enterDelay={300}>
                                <span>{score}</span>
                            </Tooltip>
                        )}
                        {!delta && <span>{score}</span>}
                    </MinTableCell>
                )}
                <MinTableCell align="left">
                    <PlayerAvatar user={wr.user} />
                </MinTableCell>
                <MinTableCell align="left">
                    <Tooltip title={<Moment fromNow>{wr.date}</Moment>} placement="bottom" enterDelay={300}>
                        <Moment style={{ color: getDateDifferenceColor(wr.date), ...noWrap }} format="YYYY-MM-DD">
                            {wr.date}
                        </Moment>
                    </Tooltip>
                </MinTableCell>
                <MinTableCell align="left">
                    <Tooltip title="in days" placement="bottom" enterDelay={300}>
                        {useLiveDuration ? (
                            <Moment style={noWrap} diff={wr.date} unit="days"></Moment>
                        ) : (
                            <span>{formatNumber(wr.duration)}</span>
                        )}
                    </Tooltip>
                </MinTableCell>
                <MinTableCell align="left" style={noWrap}>
                    {wr.demo && (
                        <Tooltip title="Download Demo" placement="bottom" enterDelay={300}>
                            <IconButton
                                size="small"
                                style={noWrap}
                                color="inherit"
                                href={'https://board.portal2.sr/getDemo?id=' + wr.id}
                                rel="noreferrer"
                                target="_blank"
                            >
                                <SaveAltIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {wr.media && (
                        <Tooltip title="Watch on YouTube" placement="bottom" enterDelay={300}>
                            <IconButton
                                size="small"
                                style={{ ...noWrap, marginLeft: !wr.demo ? 24 : undefined }}
                                color="inherit"
                                href={'https://youtu.be/' + wr.media}
                                rel="noreferrer"
                                target="_blank"
                            >
                                <YouTubeIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {wr.map.isLast && wr.map.history && (
                        <IconButton
                            color="inherit"
                            size="small"
                            style={{ ...noWrap, marginLeft: !wr.demo && !wr.media ? 48 : !wr.media ? 24 : undefined }}
                            onClick={() => onClickHistory(wr.map.id)}
                        >
                            <HistoryIcon fontSize="inherit" />
                        </IconButton>
                    )}
                </MinTableCell>
            </TableRow>
            {wr.map.isLast && wr.map.history && (
                <TableRow className={classes.root}>
                    <MinTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box margin={1}>
                                <Typography variant="h6" gutterBottom component="div">
                                    History
                                </Typography>
                                <Table size="small" aria-label="purchases">
                                    <TableHead>
                                        <TableRow>
                                            <MinTableCell>Date</MinTableCell>
                                            <MinTableCell>Record</MinTableCell>
                                            <MinTableCell>Player</MinTableCell>
                                            <MinTableCell>Timesave</MinTableCell>
                                            <MinTableCell colSpan={2}>Duration</MinTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {wr.map.history.map((historyWr, idx) => {
                                            return (
                                                <RecordsHistoryRow
                                                    wr={historyWr}
                                                    key={idx}
                                                    useLiveDuration={useLiveDuration}
                                                />
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </MinTableCell>
                </TableRow>
            )}
        </>
    );
};

const RecordsTable = ({ data, stats, useLiveDuration, storageKey }) => {
    const { rowsPerPage, page } = defaultState;

    const [{ order, orderBy }, setStorage] = useLocalStorage(storageKey, {
        order: defaultState.order,
        orderBy: defaultState.orderBy,
    });

    const [history, setHistory] = React.useState(null);

    const handleRequestSort = React.useCallback(
        (_, property) => {
            setStorage({
                order: orderBy === property ? 'asc' : order === 'desc' ? 'asc' : 'desc',
                orderBy: orderBy === property && order === 'asc' ? 'map.index' : property,
            });
        },
        [order, orderBy, setStorage],
    );

    const onClickHistory = React.useCallback(
        (id) => {
            if (history !== id) {
                setHistory(id);
            } else {
                setHistory(null);
            }
        },
        [history, setHistory],
    );

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Table size="small">
                <RecordsTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
                <TableBody>
                    {stableSort(data, order, orderBy)
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((wr, idx) => {
                            return (
                                <RecordsRow
                                    wr={wr}
                                    orderBy={orderBy}
                                    useLiveDuration={useLiveDuration}
                                    history={history}
                                    onClickHistory={onClickHistory}
                                    key={idx}
                                />
                            );
                        })}
                </TableBody>
                <TableBody>
                    {stats.totalTime > 0 && (
                        <TableRow>
                            <MinTableCell align="right">Total Time</MinTableCell>
                            <MinTableCell>
                                <Tooltip
                                    title={moment.duration(stats.totalTime * 10, 'ms').humanize()}
                                    placement="bottom"
                                    enterDelay={300}
                                >
                                    <span>{formatScore(stats.totalTime)}</span>
                                </Tooltip>
                            </MinTableCell>
                            <MinTableCell colSpan={5}></MinTableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecordsTable;
