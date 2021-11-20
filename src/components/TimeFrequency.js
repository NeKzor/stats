import React from 'react';
import Chart from 'react-apexcharts';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Switch from '@material-ui/core/Switch';
import { withTheme } from '@material-ui/styles';

const TimeFrequency = ({ data, theme }) => {
    const isDarkTheme = theme.palette.type === 'dark';

    const [sortByFrequency, setSortByFrequency] = React.useState(false);
    const chart = React.useRef(null);

    const toggleSortByFrequency = React.useCallback(() => {
        setSortByFrequency((state) => !state);
    }, [setSortByFrequency]);

    const isSpSeriesHidden = chart.current && chart.current.chart.series.isSeriesHidden('Single Player').isHidden;

    const series = React.useMemo(() => {
        return (data?.data ?? []).sort((a, b) => sortByFrequency ? isSpSeriesHidden ? a.mp - b.mp : a.sp - b.sp : a.cs - b.cs);
    }, [data, isSpSeriesHidden, sortByFrequency]);

    return (
        <>
            <Chart
                ref={chart}
                options={{
                    yaxis: {
                        title: {
                            text: 'Centiseconds',
                            style: {
                                fontFamily: 'Roboto',
                                fontWeight: 500,
                            },
                        },
                    },
                    xaxis: {
                        categories: series.map((x) => x.cs),
                        title: {
                            text: 'Runs',
                            style: {
                                fontFamily: 'Roboto',
                                fontWeight: 500,
                            },
                        },
                    },
                    legend: {
                        show: true,
                        position: 'top',
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    chart: {
                        toolbar: {
                            show: false,
                        },
                        foreColor: isDarkTheme ? 'white' : 'black',
                    },
                    tooltip: {
                        theme: isDarkTheme ? 'dark' : 'light',
                        y: {
                            formatter: function (value) {
                                return value + ' Runs';
                            },
                        },
                        x: {
                            formatter: function (value) {
                                return '.' + value.toString().padStart(2, '0');
                            },
                        },
                    },
                    responsive: [
                        {
                            breakpoint: 380,
                            options: {
                                chart: {
                                    height: '300px',
                                },
                            },
                        },
                    ],
                    plotOptions: {
                        bar: {
                            horizontal: true,
                        },
                    },
                    colors: ['#03a9f4', '#ff9800'],
                }}
                series={[{
                    name: 'Single Player',
                    data: series.map((x) => x.sp),
                },
                {
                    name: 'Cooperative',
                    data: series.map((x) => x.mp),
                }]}
                type="bar"
                height="1600"
            />
            <FormGroup row>
                <FormControlLabel
                    control={<Switch checked={sortByFrequency} onChange={toggleSortByFrequency} color="primary" />}
                    label="Sort by Frequency"
                />
            </FormGroup>
        </>
    );
};

export default withTheme(TimeFrequency);
