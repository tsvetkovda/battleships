import cloneDeep from '../utils/cloneDeep';
import generateField from '../utils/generateField';

import { SHOOT_AT_ENEMY, SET_ENEMY_FIELD, RESET_ENEMY_FIELD } from '../actions';

interface Cell {
  x: number;
  y: number;
  hasShip: boolean;
  locked: boolean;
  destroyed: boolean;
  missed: boolean;
  className: string;
}

const initialState = {
  field: generateField(10),
};

const enemyFieldReducer = (state = initialState, action) => {
  switch (action.type) {
    case SHOOT_AT_ENEMY: {
      const { position } = action;

      const newField = cloneDeep(state.field);

      const targetCell: Cell = newField.find(
        (cell: Cell) => cell.x === position.x && cell.y === position.y
      );

      if (targetCell && targetCell.hasShip) targetCell.destroyed = true;
      else targetCell.missed = true;

      return { ...state, field: newField };
    }
    case SET_ENEMY_FIELD: {
      return { ...state, field: action.field };
    }

    case RESET_ENEMY_FIELD: {
      return { ...state, field: initialState.field };
    }

    default:
      return state;
  }
};

export default enemyFieldReducer;