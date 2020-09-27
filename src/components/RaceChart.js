import BarChart from 'chart-race-react';

class RaceChart extends BarChart {
    update = () => {
        // Added props.start check for manual pauses
        if (this.state.idx + 1 === this.props.timeline.length || !this.props.start) {
            return clearInterval(this.state.intervalId);
        }

        this.setState((prevState) => {
            const [currRank, maxVal] = this.sortAxis(prevState.idx + 1);

            return {
                idx: prevState.idx + 1,
                prevRank: prevState.currRank,
                currRank: currRank,
                maxVal: maxVal,
            };
        });
    };

    // https://github.com/bchao1/chart-race-react/issues/1
    sortAxis = (i, descending, minValue = 1) => {
        const byValue = descending || descending === undefined ? (a, b) => b.val - a.val : (a, b) => a.val - b.val;

        const sorted = Object.keys(this.props.data)
            .map((name) => {
                return {
                    name: name,
                    val: this.props.data[name][i],
                };
            })
            .slice(0, this.maxItems)
            .sort(byValue)
            .filter((item) => item.val >= minValue);

        const maxVal = Math.max.apply(
            Math,
            sorted.map((item) => item.val),
        );

        return [
            sorted.reduce(
                (prev, cur, idx) => ({
                    ...prev,
                    [cur.name]: idx,
                }),
                {},
            ),
            maxVal,
        ];
    };
}

export default RaceChart;
