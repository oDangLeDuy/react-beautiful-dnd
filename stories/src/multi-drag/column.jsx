// @flow
import React, { Component } from 'react';
import styled from '@emotion/styled';
import memoizeOne from 'memoize-one';
import { colors } from '@atlaskit/theme';
import { Droppable } from '../../../src';
import { grid, borderRadius } from '../constants';
import Task from './task';
import type { DroppableProvided, DroppableStateSnapshot } from '../../../src';
import type { Column as ColumnType } from './types';
import type { Task as TaskType, Id } from '../types';

import { FixedSizeList as List, areEqual } from 'react-window';

type Props = {|
  column: ColumnType,
  tasks: TaskType[],
  selectedTaskIds: Id[],
  draggingTaskId: ?Id,
  toggleSelection: (taskId: Id) => void,
  toggleSelectionInGroup: (taskId: Id) => void,
  multiSelectTo: (taskId: Id) => void,
|};

// $ExpectError - not sure why
const Container = styled.div`
  width: 300px;
  margin: ${grid}px;
  border-radius: ${borderRadius}px;
  border: 1px solid ${colors.N100};
  background-color: ${colors.N50};

  /* we want the column to take up its full height */
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-weight: bold;
  padding: ${grid}px;
`;

const TaskList = styled.div`
  padding: ${grid}px;
  min-height: 200px;
  flex-grow: 1;
  transition: background-color 0.2s ease;
  ${(props) =>
    props.isDraggingOver ? `background-color: ${colors.N200}` : ''};
`;

type TaskIdMap = {
  [taskId: Id]: true,
};

const getSelectedMap = memoizeOne((selectedTaskIds: Id[]) =>
  selectedTaskIds.reduce((previous: TaskIdMap, current: Id): TaskIdMap => {
    previous[current] = true;
    return previous;
  }, {}),
);

export default class Column extends Component<Props> {
  render() {
    const column: ColumnType = this.props.column;
    const tasks: TaskType[] = this.props.tasks;
    const selectedTaskIds: Id[] = this.props.selectedTaskIds;
    const draggingTaskId: ?Id = this.props.draggingTaskId;
    const isSelected = (task: TaskType): boolean =>
      Boolean(getSelectedMap(selectedTaskIds)[task.id]);
    const toggleSelection = this.props.toggleSelection;
    const toggleSelectionInGroup = this.props.toggleSelectionInGroup;
    const multiSelectTo = this.props.multiSelectTo;

    const Row = React.memo(({ data: tasks, index, style }) => {
      const task = tasks[index];

      // We are rendering an extra item for the placeholder
      // Do do this we increased our data set size to include one 'fake' item
      if (!task) {
        return null;
      }

      // Faking some nice spacing around the items
      // const patchedStyle = {
      //   ...style,
      //   left: style.left + grid,
      //   top: style.top + grid,
      //   width: `calc(${style.width} - ${grid * 2}px)`,
      //   height: style.height - grid,
      // };

      return (
        <Task
          task={task}
          index={index}
          key={task.id}
          isSelected={isSelected(task)}
          isGhosting={false}
          selectionCount={selectedTaskIds.length}
          toggleSelection={toggleSelection}
          toggleSelectionInGroup={toggleSelectionInGroup}
          multiSelectTo={multiSelectTo}
        />
      );
    }, areEqual);

    const items = tasks.filter(
      (task: TaskType) =>
        !draggingTaskId ||
        (Boolean(draggingTaskId) &&
          (!isSelected(task) || draggingTaskId === task.id)),
    );

    return (
      <Container>
        <Title>{column.title}</Title>
        <Droppable
          droppableId={column.id}
          mode="virtual"
          renderClone={(provided, snapshot, rubric) => (
            <div
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              ref={provided.innerRef}
            >
              Item id: {tasks[rubric.source.index].id}
            </div>
          )}
        >
          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
            const itemCount: number = snapshot.isUsingPlaceholder
              ? items.length + 1
              : items.length;

            return (
              <List
                height={500}
                itemCount={itemCount}
                itemSize={110}
                width={300}
                outerRef={provided.innerRef}
                style={{
                  transition: 'background-color 0.2s ease',
                  // We add this spacing so that when we drop into an empty list we will animate to the correct visual position.
                  padding: grid,
                }}
                itemData={items}
              >
                {Row}
              </List>
            );
          }}
        </Droppable>
      </Container>
    );
  }
}
