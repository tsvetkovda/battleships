/* eslint-disable class-methods-use-this */
import React, { Component } from "react";
import { connect } from "react-redux";
import { Container, Row, Col, Button } from "reactstrap";
import nanoid from "nanoid";

import {
    selectGameMode,
    setBattlePhase,
    LOBBY,
    WAIT,
    WARM_UP,
    BATTLE,
    placeShip,
    setEnemyField,
    canPlayerShoot,
    receiveShot,
    shootAtEnemy,
    reset,
    resetEnemyField,
} from "../actions";

import Chat from "./chat";
import Controls from "./controls";
import Timer from "./timer";

class Multiplayer extends Component {
    componentDidMount() {
        const { socket } = this.props;

        socket.on("allPlayersConnected", () => this.handleAllPlayersConnected());
        socket.on("playerLeft", () => this.handleOpponentLeft());
        socket.on("sendDataToOpponent", data => this.handleReceiveOpponentData(data));
        socket.on("sendShot", data => this.handleReceiveShot(data));
        socket.on("defineFirstTurn", name => this.handleDefineFirstTurn(name));
    }

    componentWillUnmount() {
        const { socket } = this.props;

        socket.removeEventListener("allPlayersConnected", () => this.handleAllPlayersConnected());
        socket.removeEventListener("playerLeft", () => this.handleOpponentLeft());
        socket.removeEventListener("sendDataToOpponent", data =>
            this.handleReceiveOpponentData(data)
        );
        socket.removeEventListener("sendShot", data => this.handleReceiveShot(data));
        socket.removeEventListener("defineFirstTurn", name => this.handleDefineFirstTurn(name));
    }

    handleLeaveRoom() {
        const { socket, selectLobby, player, reset, resetEnemyField, setBattlePhase } = this.props;

        socket.emit("leaveRoom", { username: player.name, roomId: player.roomId });

        reset();
        resetEnemyField();
        setBattlePhase(WAIT);
        selectLobby();
    }

    handleOpponentLeft() {
        const { reset, resetEnemyField, setBattlePhase } = this.props;

        setBattlePhase(WAIT);
        reset();
        resetEnemyField();
    }

    handleDefineFirstTurn(name) {
        const { player, canPlayerShoot } = this.props;

        if (player.name === name) {
            canPlayerShoot(true);
        }
    }

    handleSendShot(cell) {
        const { socket, phase, player, enemy, canPlayerShoot } = this.props;

        const targetCell = enemy.field.find(el => el.x === cell.x && el.y === cell.y);

        if (player.canShoot && phase === BATTLE) {
            if (!targetCell.destroyed && !targetCell.missed) {
                socket.emit("sendShot", cell);
                canPlayerShoot(false);
            }

            if (targetCell.hasShip) {
                socket.emit("sendShot", cell);
                canPlayerShoot(true);
            }
        }
    }

    handleReceiveShot(data) {
        const { receiveShot, canPlayerShoot, player } = this.props;

        receiveShot(data);

        const targetCell = player.field.find(
            cell => cell.x === data.x && cell.y === data.y && cell.hasShip
        );

        if (targetCell) {
            canPlayerShoot(false);
        } else {
            canPlayerShoot(true);
        }

        this.handleSendDataToOpponent();
    }

    handleReceiveOpponentData(data) {
        const { setEnemyField } = this.props;

        setEnemyField(data);
    }

    handleSendDataToOpponent() {
        const { socket, player } = this.props;

        socket.emit("sendDataToOpponent", player.field);
    }

    handleDefineWinner() {
        const { player, enemy } = this.props;

        const playerHp = player.field.filter(x => x.hasShip && !x.destroyed).length;
        const enemyHp = enemy.field.filter(x => x.hasShip && !x.destroyed).length;

        if (playerHp === 0) {
            return "You lose";
        }

        if (enemyHp === 0) {
            return "You win";
        }

        return player.canShoot ? "You turn" : "Enemy Turn";
    }

    handleAllPlayersConnected() {
        const { setBattlePhase } = this.props;

        setBattlePhase("WARM_UP");
    }

    handlePlayerCellOnMouseOver(e) {
        e.target.parentElement.className = "cell-selected";
    }

    handlePlayerCellOnMouseLeave(e, cell) {
        e.target.parentElement.className = cell.className;
    }

    handleEnemyCellOnMouseOver(e) {
        if (e.target.parentElement.className === "cell") {
            e.target.parentElement.className = "enemy-cell_selected";
        }
    }

    handleEnemyCells(cell) {
        if (cell.destroyed) return "enemy-cell_destroyed";

        if (cell.missed) return "cell-missed";

        return "cell";
    }

    render() {
        const {
            selectedShipSize,
            orientation,
            placeShip,
            player,
            enemy,
            phase,
            socket,
        } = this.props;

        let Header;

        if (phase === WAIT) {
            Header = <h4>Waiting for other player to connect...</h4>;
        }

        if (phase === WARM_UP) {
            Header = (
                <>
                    <h4>Place your ships</h4>
                    <Timer socket={socket} />
                </>
            );
        }

        if (phase === BATTLE) {
            Header = <h4>{this.handleDefineWinner()}</h4>;
        }

        return (
            <Container>
                <Row className="mb-3 mt-3">
                    <Col>
                        <Button onClick={() => this.handleLeaveRoom()} color="primary">
                            Back to lobby
                        </Button>
                    </Col>
                </Row>
                <Row className="text-center mb-3">
                    <Col>{Header}</Col>
                </Row>
                <Row className="board mb-3">
                    <Col className="board__player-field col-md-6">
                        <h4 className="text-center">You</h4>
                        <div className="grid d-flex flex-row mb-3">
                            {player.field.map(el => (
                                <div
                                    className={el.className}
                                    key={`k${nanoid()}`}
                                    data-x={el.x}
                                    data-y={el.y}
                                    role="cell"
                                    onClick={() =>
                                        placeShip(
                                            { x: el.x, y: el.y },
                                            selectedShipSize,
                                            orientation,
                                            player.availableShips
                                        )
                                    }
                                    // onMouseOver={event => this.handlePlayerCellOnMouseOver(event)}
                                    // onMouseLeave={event =>
                                    //     this.handlePlayerCellOnMouseLeave(event, el)
                                    // }
                                >
                                    <img src="../../src/assets/img/aspect-ratio.png" alt="" />
                                </div>
                            ))}
                        </div>
                        {phase === WARM_UP ? <Controls /> : null}
                    </Col>
                    <Col className="board__enemy-field col-md-6">
                        <h4 className="text-center">Enemy</h4>
                        <div className="grid d-flex flex-row">
                            {enemy.field.map(cell => (
                                <div
                                    className={this.handleEnemyCells(cell)}
                                    key={`k${nanoid()}`}
                                    data-x={cell.x}
                                    data-y={cell.y}
                                    role="cell"
                                    onClick={() => this.handleSendShot(cell)}
                                    // onMouseOver={event => this.handleEnemyCellOnMouseOver(event)}
                                    // onMouseLeave={() => this.handleEnemyCells(cell)}
                                >
                                    <img src="../../src/assets/img/aspect-ratio.png" alt="" />
                                </div>
                            ))}
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Chat socket={socket} />
                    </Col>
                </Row>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    const { mode, selectedShipSize, player, orientation, enemy, phase } = state;

    return {
        mode,
        selectedShipSize,
        player,
        enemy,
        orientation,
        phase,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        selectLobby: () => dispatch(selectGameMode(LOBBY)),
        placeShip: (position, shipSize, orientation, availableShips) =>
            dispatch(placeShip(position, shipSize, orientation, availableShips)),
        setBattlePhase: phase => dispatch(setBattlePhase(phase)),
        shootAtEnemy: (position, enemyField) => dispatch(shootAtEnemy(position, enemyField)),
        setEnemyField: field => dispatch(setEnemyField(field)),
        receiveShot: position => dispatch(receiveShot(position)),
        canPlayerShoot: bool => dispatch(canPlayerShoot(bool)),
        reset: () => dispatch(reset()),
        resetEnemyField: () => dispatch(resetEnemyField()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Multiplayer);
