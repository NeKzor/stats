import React from 'react';
import ReactJson from 'react-json-view';
import Button from '@material-ui/core/Button';
/* import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel'; */
import Paper from '@material-ui/core/Paper';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import ViewContent from './ViewContent';
import { useIsMounted } from '../Hooks';
import { useTheme } from '@material-ui/core';

const Alert = (props) => {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
};

const defaultReplay = {
    info: 'drag & drop demo here :)',
};

const DemoView = () => {
    const isMounted = useIsMounted();
    const theme = useTheme();

    const [replay, setReplay] = React.useState(defaultReplay);
    /* const [parseGhost, setParseGhost] = React.useState(true); */
    const [errorMessage, setErrorMessage] = React.useState(false);

    const handleClose = (_, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setErrorMessage(false);
    };

    /* const handleParseGhost = (event) => {
        setParseGhost(event.target.checked);
    }; */

    const parseReplay = React.useCallback(
        (file) => {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = ({ target: { result } }) => {
                try {
                    if (!isMounted.current) return;
                    setReplay(defaultReplay);
                    setErrorMessage(false);

                    const { Buffer, SourceDemoParser, Speedrun } = window;

                    const parser = SourceDemoParser.default();
                    const speedrunTimer = Speedrun.SourceTimer.default();
                    const sarTimer = Speedrun.SarTimer.default();

                    const demo = (window.demo = parser.parse(Buffer.from(result)));

                    // Fix message ticks
                    demo.detectGame().adjustTicks();

                    // Fix header
                    demo.adjustRange();

                    // Adjust 0-tick demos manually
                    if (demo.playbackTicks === 0) {
                        let ipt = demo.getIntervalPerTick();
                        demo.playbackTicks = 1;
                        demo.playbackTime = ipt;
                    } else {
                        // Speedrun rules apply here
                        demo.speedrun = speedrunTimer.time(demo);

                        // Check SAR support
                        demo.sar = sarTimer.time(demo);
                    }

                    if (!isMounted.current) return;

                    const removeData = (obj) => {
                        Object.keys(obj).forEach((key) => {
                            if (key === '_view') {
                                delete obj._view;
                            } else if (typeof obj[key] === 'object') {
                                removeData(obj[key]);
                            }
                        });
                    };

                    removeData(demo);
                    setReplay(demo);
                } catch (err) {
                    if (isMounted.current) {
                        setErrorMessage(err.message);
                    }
                }
            };
            reader.readAsArrayBuffer(file);
        },
        [isMounted, /* parseGhost, */ setReplay, setErrorMessage],
    );

    const handleChange = React.useCallback((ev) => parseReplay(ev.target.files[0]), [parseReplay]);

    const dropHandler = (ev) => {
        ev.preventDefault();

        const files = [];

        if (ev.dataTransfer.items) {
            for (let i = 0; i < ev.dataTransfer.items.length; ++i) {
                if (ev.dataTransfer.items[i].kind === 'file') {
                    files.push(ev.dataTransfer.items[i].getAsFile());
                }
            }
        }

        parseReplay(files[0]);
        removeDragData(ev);
    };

    const dragOverHandler = (ev) => {
        ev.preventDefault();
    };

    const removeDragData = (ev) => {
        if (ev.dataTransfer.items) {
            ev.dataTransfer.items.clear();
        } else {
            ev.dataTransfer.clearData();
        }
    };

    React.useEffect(() => {
        document.querySelector('#file').addEventListener('change', handleChange);
        return () => document.querySelector('#file').removeEventListener('change', handleChange);
    }, [handleChange]);

    const openFile = () => {
        document.querySelector('#file').click();
    };

    return (
        <ViewContent>
            <Paper style={{ padding: '20px 20px 20px 20px' }}>
                <Button variant="contained" color="primary" disableElevation onClick={openFile}>
                    Open file
                </Button>
                <input type="file" id="file" style={{ display: 'none' }} />
                {/* <FormControlLabel
                    style={{ marginLeft: '20px' }}
                    control={<Checkbox color="primary" checked={parseGhost} onChange={handleParseGhost} />}
                    label="Parse Ghost"
                /> */}
                <div style={{ paddingBottom: '20px' }}></div>
                <div onDrop={dropHandler} onDragOver={dragOverHandler}>
                    <ReactJson
                        name="demo"
                        style={{ fontSize: '14px' }}
                        src={replay}
                        theme={theme.palette.type === 'light' ? 'bright:inverted' : 'solarized'}
                        displayDataTypes={false}
                        displayObjectSize={false}
                        enableClipboard={false}
                    />
                </div>
                <Snackbar open={errorMessage !== false} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="error">
                        {errorMessage}
                    </Alert>
                </Snackbar>
            </Paper>
        </ViewContent>
    );
};

export default DemoView;
