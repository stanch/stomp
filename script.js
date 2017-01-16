"use strict";

const Cell = ({target, distractor, touchHandler}) => {
    const className = `cell ${target ? 'target' : distractor ? 'distractor' : ''}`;
    return <div className={className} onTouchStart={touchHandler}></div>;
};

const Grid = ({targets, distractors, touchHandler}) => {
    function renderCell(i) {
        return <Cell
            target={targets.indexOf(i) >= 0}
            distractor={distractors.indexOf(i) >= 0}
            touchHandler={() => touchHandler(i)} />;
    }
    return (
        <div className="grid">
            <div className="row">{renderCell(0)}{renderCell(1)}{renderCell(2)}</div>
            <div className="row">{renderCell(3)}{renderCell(4)}{renderCell(5)}</div>
            <div className="row">{renderCell(6)}{renderCell(7)}{renderCell(8)}</div>
            <div className="row">{renderCell(9)}{renderCell(10)}{renderCell(11)}</div>
        </div>
    );
};

const Meters = ({time, score, average}) => {
    const hourglass = time > 40 ? 'fa-hourglass-start' : time > 20 ? 'fa-hourglass-half' : 'fa-hourglass-end';
    return (
        <div className="meters">
            <div><i id="hourglass" className={`fa ${hourglass}`}></i><span id="time">{time}</span></div>
            <div><span className="score">{score}</span><i className="fa fa-trophy"></i></div>
        </div>
    );
};

const Results = ({score, handleRestart}) => (
    <div className="popup">
        <span>Time’s up!<br/>You scored <span className="score target-color">{`${score} points`}</span>.</span>
        <button onClick={handleRestart}>Play again!</button>
    </div>
);

class Game extends React.Component {
    get initialState() {
        return {
            score: 0,
            start: undefined,
            time: 60,
            timer: undefined,
            latencies: [],
            average: 0,
            targetCount: 1,
            distractorCount: 0,
            targets: [],
            distractors: [],
            touchHandler: () => {}
        };
    }
    constructor() {
        super();
        this.state = this.initialState;
    }
    reset() {
        this.setState(this.initialState, () => this.generate(false));
    }
    componentDidMount() {
        this.generate(false);
    }
    generate(start) {
        const newTargets = _.take(_.shuffle(_.difference(_.range(12), this.state.targets)), this.state.targetCount);
        const newDistractors = _.take(_.shuffle(_.difference(_.range(12), newTargets)), this.state.distractorCount);
        this.setState({
            targets: newTargets,
            distractors: newDistractors,
            touchHandler: debounceCollect(this.advance, 50).bind(this),
            start: start ? new Date().getTime() : undefined
        });
    }
    advance(cells) {
        if (!this.state.timer) {
            const end = new Date().getTime() + this.state.time * 1000;
            const timer = window.setInterval(() => {
                const time = Math.floor((end - new Date().getTime()) / 1000);
                this.setState({ time });
                if (time <= 0) window.clearTimeout(timer);
            }, 500);
            this.setState({ timer });
        }

        const result = cells.map(c => c[0]);
        const correct = _.isEqual(result.sort(), this.state.targets.sort());

        if (!correct) {
            this.setState({
                score: Math.max(this.state.score - 10, 0) }
            );
        } else {
            this.setState({
                score: this.state.score +
                    100 * Math.pow(5, Math.floor(this.state.targetCount) - 1) +
                    10 * Math.floor(this.state.distractorCount)
            });

            if (this.state.start) {
                const latencies = _.takeRight(_.concat(this.state.latencies, new Date().getTime() - this.state.start), 5);
                const average = latencies.reduce((a, b) => a + b) / latencies.length;

                const targetCount = average < 650 ? Math.min(this.state.targetCount + 0.3, 4) :
                    average > 700 ? Math.max(this.state.targetCount - 0.3, 1) : this.state.targetCount;

                const distractorCount = average < 650 ? Math.min(this.state.distractorCount + 1, 7) :
                    average > 700 ? Math.max(this.state.distractorCount - 1, 0) : this.state.distractorCount;

                this.setState({ latencies, average, targetCount, distractorCount }, () => this.generate(true));
            } else {
                this.generate(true);
            }

        }
    }
    render() {
        if (this.state.time > 0) {
            return <div className="game">{Meters(this.state)}{Grid(this.state)}</div>;
        } else {
            return <Results score={this.state.score} handleRestart={() => this.reset()} />
        }
    }
}

ReactDOM.render(<Game />, document.getElementById('container'));
