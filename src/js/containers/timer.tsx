import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  decrementTimer,
  resetTimer,
  setBattlePhase,
  selectShip,
  reset,
  BATTLE,
} from '../actions';

import { IPlayer } from '../utils/interfaces';

interface IProps {
  timer: number;
  player: IPlayer;
  socket: any;
  resetTimer: () => void;
  reset: () => void;
  decrementTimer: () => void;
  setBattlePhase: (phase: string) => void;
  selectShip: (shipSize: number) => void;
}

class Timer extends Component<IProps> {
  constructor(props) {
    super(props);

    this.timerId = null;
  }

  componentDidMount() {
    const { resetTimer, reset } = this.props;

    resetTimer();
    reset();

    const timerWrap = () => {
      const { decrementTimer, timer, setBattlePhase, selectShip } = this.props;

      // eslint-disable-next-line eqeqeq
      if (timer == 0) {
        clearInterval(this.timerId);

        selectShip(null);
        this.handleSendDataToOpponent();
        setTimeout(() => setBattlePhase(BATTLE), 1000);
      } else {
        decrementTimer();
      }
    };

    this.timerId = setInterval(timerWrap, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  handleSendDataToOpponent() {
    const { socket, player } = this.props;

    socket.emit('sendDataToOpponent', player.field);
  }

  render() {
    const { timer } = this.props;

    return <div className='timer'>{timer}</div>;
  }
}

const mapStateToProps = (state: any) => {
  const { timer, player } = state;

  return {
    timer,
    player,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    decrementTimer: () => dispatch(decrementTimer()),
    resetTimer: () => dispatch(resetTimer()),
    setBattlePhase: (phase: string) => dispatch(setBattlePhase(phase)),
    selectShip: (size: number) => dispatch(selectShip(size)),
    reset: () => dispatch(reset()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Timer);
