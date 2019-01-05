import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import { Provider, connect } from 'react-redux';
import { createLogger } from 'redux-logger';
import { schema, normalize } from 'normalizr';
import uuid from 'uuid/v4';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

const TODO_ADD = 'TODO_ADD';
const TODO_TOGGLE = 'TODO_TOGGLE';
const FILTER_SET = 'FILTER_SET';
const NOTIFICATION_SHOW = 'NOTIFICATION_SHOW';
const NOTIFICATION_HIDE = 'NOTIFICATION_HIDE';

// reducers
const todos = [
  { id: '1', name: 'Hands On: Redux Standalone with advanced Actions' },
  { id: '2', name: 'Hands On: Redux Standalone with advanced Reducers' },
  { id: '3', name: 'Hands On: Bootstrap App with Redux' },
  { id: '4', name: 'Hands On: Naive Todo with React and Redux' },
  { id: '5', name: 'Hands On: Sophisticated Todo with React and Redux' },
  { id: '6', name: 'Hands On: Connecting State Everywhere' },
  { id: '7', name: 'Hands On: Todo with advanced Redux' },
  { id: '8', name: 'Hands On: Todo but more Features' },
  { id: '9', name: 'Hands On: Todo with Notifications' },
  { id: '10', name: 'Hands On: Hacker News with Redux' }
];

const todoSchema = new schema.Entity('todo');
const normalizedTodos = normalize(todos, [todoSchema]);
const initialTodoState = {
  entities: normalizedTodos.entities.todo,
  ids: normalizedTodos.result
};

function todoReducer(state = initialTodoState, action) {
  switch (action.type) {
    case TODO_ADD: {
      return applyAddTodo(state, action);
    }
    case TODO_TOGGLE: {
      return applyToggleTodo(state, action);
    }
    default:
      return state;
  }
}

function applyAddTodo(state, action) {
  const todo = { ...action.todo, completed: false };
  const entities = { ...state.entities, [todo.id]: todo };
  const ids = [...state.ids, [todo.id]];
  return { ...state, entities, ids };
}

function applyToggleTodo(state, action) {
  const toggledTodo = {
    ...state.entities[action.todo.id],
    completed: !state.entities[action.todo.id].completed
  };
  const entities = { ...state.entities, [action.todo.id]: toggledTodo };

  return { ...state, entities };
}

function applyShowNotification(state, action) {
  const { name, id } = action.todo;
  return { ...state, [id]: 'Todo Created ' + name };
}
function applyRemoveNotification(state, action) {
  // action = { type, id}
  const { [action.id]: notificationToRemove, ...restNotifications } = state;
  return restNotifications;
}

function filterReducer(state = 'SHOW_ALL', action) {
  switch (action.type) {
    case FILTER_SET: {
      return applySetFilter(state, action);
    }
    default:
      return state;
  }
}

function notificationReducer(state = {}, action) {
  switch (action.type) {
    case TODO_ADD: {
      return applyShowNotification(state, action);
    }
    case NOTIFICATION_HIDE: {
      return applyRemoveNotification(state, action);
    }
    default:
      return state;
  }
}

function applySetFilter(state, action) {
  return action.filter;
}

function doAddTodo(id, name) {
  return {
    type: TODO_ADD,
    todo: {
      id,
      name
    }
  };
}
function thunkedDoAddTodo(id, name) {
  return function(dispatch) {
    dispatch(doAddTodo(id, name));
    setTimeout(() => {
      dispatch(doRemoveNotification(id));
    }, 5000);
  };
}

function doToggleTodo(id) {
  return {
    type: TODO_TOGGLE,
    todo: {
      id
    }
  };
}

function doSetFilter(filter) {
  return { type: FILTER_SET, filter };
}

function doShowNotification(text, id) {
  return {
    type: NOTIFICATION_SHOW,
    text,
    id
  };
}

function doRemoveNotification(id) {
  return {
    type: NOTIFICATION_HIDE,
    id
  };
}

const rootReducer = combineReducers({
  todoState: todoReducer,
  filterState: filterReducer,
  notificationState: notificationReducer
});

const logger = createLogger();

const store = createStore(
  rootReducer,
  undefined,
  composeWithDevTools(applyMiddleware(logger, thunk))
);

const VISIBILITY_FILTERS = {
  SHOW_COMPLETED: item => item.completed,
  SHOW_INCOMPLETED: item => !item.completed,
  SHOW_ALL: item => true
};

function TodoApp() {
  return <ConnectedTodoList />;
}

function TodoList({ todosAsIds }) {
  return (
    <div>
      {todosAsIds.map(todoId => {
        return <ConnectedTodoItem key={todoId} todoId={todoId} />;
      })}
    </div>
  );
}

function TodoItem({ todo, onToggleTodo }) {
  const { name, id, completed } = todo;
  return (
    <div>
      {name}
      <button onClick={() => onToggleTodo(id)}>Completed</button>
      {completed ? 'Completed' : 'Incomplete'}
    </div>
  );
}

function getTodosAsIds(state) {
  return state.todoState.ids
    .map(id => state.todoState.entities[id])
    .filter(VISIBILITY_FILTERS[state.filterState])
    .map(todo => todo.id);
}

function getTodo(state, todoId) {
  return state.todoState.entities[todoId];
}

function mapStateToPropsList(state) {
  return { todosAsIds: getTodosAsIds(state) };
}

function mapStateToPropsItem(state, props) {
  return {
    todo: getTodo(state, props.todoId)
  };
}

function mapDispatchToPropsItem(dispatch) {
  return {
    onToggleTodo: id => dispatch(doToggleTodo(id))
  };
}

const ConnectedTodoList = connect(mapStateToPropsList)(TodoList);
const ConnectedTodoItem = connect(
  mapStateToPropsItem,
  mapDispatchToPropsItem
)(TodoItem);

class TodoCreate extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: ''
    };

    this.onCreateTodo = this.onCreateTodo.bind(this);
    this.onChangeName = this.onChangeName.bind(this);
  }

  onChangeName(event) {
    this.setState({ value: event.target.value });
  }

  onCreateTodo(event) {
    this.props.onAddTodo(this.state.value);
    this.setState({ value: '' });
    event.preventDefault();
  }

  render() {
    return (
      <div>
        <form onSubmit={this.onCreateTodo}>
          <input
            type="text"
            placeholder="Add Todo..."
            value={this.state.value}
            onChange={this.onChangeName}
          />
          <button type="submit">Add</button>
        </form>
      </div>
    );
  }
}

function mapDispatchToPropsCreate(dispatch) {
  return {
    onAddTodo: todo => dispatch(thunkedDoAddTodo(uuid(), todo))
  };
}

const ConnectedTodoCreate = connect(
  null,
  mapDispatchToPropsCreate
)(TodoCreate);

function Filter({ onSetFilter }) {
  return (
    <div>
      Show
      <button type="button" onClick={() => onSetFilter('SHOW_ALL')}>
        All
      </button>
      <button type="button" onClick={() => onSetFilter('SHOW_COMPLETED')}>
        Completed
      </button>
      <button type="button" onClick={() => onSetFilter('SHOW_INCOMPLETED')}>
        Incompleted
      </button>
    </div>
  );
}

function mapDispatchToPropsFilter(dispatch) {
  return {
    onSetFilter: filter => dispatch(doSetFilter(filter))
  };
}

const ConnectedFilter = connect(
  null,
  mapDispatchToPropsFilter
)(Filter);

function Notifications({ notifications }) {
  return (
    <div>
      {notifications.map(notification => (
        <div key={notification}>{notification}</div>
      ))}
    </div>
  );
}

function getNotifications(state) {
  return getArrayOfObject(state.notificationState);
}

function getArrayOfObject(object) {
  return Object.keys(object).map(key => object[key]);
}

function mapStateToPropsNotifications(state) {
  return {
    notifications: getNotifications(state)
  };
}

const ConnectedNotifications = connect(
  mapStateToPropsNotifications,
  null
)(Notifications);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedFilter />
    <ConnectedTodoCreate />
    <TodoApp />
    <ConnectedNotifications />
  </Provider>,
  document.getElementById('root')
);
