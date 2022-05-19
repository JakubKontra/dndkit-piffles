import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal, unstable_batchedUpdates} from 'react-dom';
import { v4 as uuidv4 } from 'uuid';

import {
  CancelDrop,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  DndContext,
  DragOverlay,
  DropAnimation,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  Modifiers,
  useDroppable,
  UniqueIdentifier,
  useSensors,
  useSensor,
  MeasuringStrategy,
  KeyboardCoordinateGetter,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  AnimateLayoutChanges,
  SortableContext,
  useSortable,
  arrayMove,
  defaultAnimateLayoutChanges,
  verticalListSortingStrategy,
  SortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {coordinateGetter as multipleContainersCoordinateGetter} from './multipleContainersKeyboardCoordinates';

import {Item, Container, ContainerProps} from './components';
import { ContainerItem, Items } from 'data/data';

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  args.isSorting || args.wasDragging ? defaultAnimateLayoutChanges(args) : true;

function DroppableContainer({
  children,
  disabled,
  id,
  items,
  style,
  ...props
}: ContainerProps & {
  disabled?: boolean;
  id: string;
  items: ContainerItem[];
  style?: React.CSSProperties;
}) {
  const {
    active,
    attributes,
    isDragging,
    listeners,
    over,
    setNodeRef,
    transition,
    transform,
  } = useSortable({
    id,
    data: {
      type: 'container',
      children: items,
    },
    animateLayoutChanges,
  });
  const isOverContainer = over
    ? (id === over.id && active?.data.current?.type !== 'container') ||
      items.includes(over.id)
    : false;

  return (
    <Container
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
      }}
      hover={isOverContainer}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      {...props}
    >
      {children}
    </Container>
  );
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

interface Props {
  adjustScale?: boolean;
  cancelDrop?: CancelDrop;
  containerStyle?: React.CSSProperties;
  coordinateGetter?: KeyboardCoordinateGetter;
  getItemStyles?(args: {
    value: UniqueIdentifier;
    index: number;
    overIndex: number;
    isDragging: boolean;
    containerId: UniqueIdentifier;
    isSorting: boolean;
    isDragOverlay: boolean;
  }): React.CSSProperties;
  wrapperStyle?(args: {index: number}): React.CSSProperties;
  items: Items;
  handle?: boolean;
  renderItem?: any;
  strategy?: SortingStrategy;
  modifiers?: Modifiers;
  minimal?: boolean;
  trashable?: boolean;
  scrollable?: boolean;
  vertical?: boolean;
}

const FILTER_ID = 'container_items';
export const TRASH_ID = 'void';
const PLACEHOLDER_ID = 'placeholder';
const empty: UniqueIdentifier[] = [];

export function MultipleContainers({
  adjustScale = false,
  cancelDrop,
  handle = false,
  items: initialItems,
  containerStyle,
  coordinateGetter = multipleContainersCoordinateGetter,
  getItemStyles = () => ({}),
  wrapperStyle = () => ({}),
  minimal = false,
  modifiers,
  renderItem,
  strategy = verticalListSortingStrategy,
  trashable = false,
  vertical = false,
  scrollable,
}: Props) {
  const [items, setItems] = useState<Items>(() => initialItems);
  const [containers, setContainers] = useState(Object.keys(items));
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer = activeId ? containers.includes(activeId) : false;

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      
      /// CONTAINERS
      if (activeId && activeId in items) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.id in items
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');


      // ITEMS
      if (overId != null) {
        if (overId === TRASH_ID) {
          // If the intersecting droppable is the trash, return early
          // Remove this if you're not using trashable functionality in your app
          return intersections;
        }

        console.log("items-overId", overId)
        console.log("items", items)
        if (overId in items) {
          const containerItems = items[overId].items;

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container

            console.log(args.droppableContainers)

            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  container.id !== overId &&
                  containerItems.find((item) => item.id === container.id)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;

        return [{id: overId}];
      }
      

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{id: lastOverId.current}] : [];
    },
    [activeId, items]
  );
  const [clonedItems, setClonedItems] = useState<Items | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );
  const findContainer = (id: string) => {
    /**
     if (id in items) {
      return id;
    }
    
    return Object.keys(items).find((key) => items[key].includes(id));
     */

    if (id in items) {
      return id
    }

    return Object.keys(items).find((key) => {
      if (
        items[key].items.findIndex((item) => item.id === id) !== -1
      ) {
        return key
      }
    })
  };

  const getIndex = (id: string) => {
    const container = findContainer(id);

    if (!container) {
      return -1;
    }

    // const index = items[container].indexOf(id);
    const index = items[container].items.findIndex((item) => item.id === id)

    return index;
  };
  

  const onDragCancel = () => {
    if (clonedItems) {
      // Reset items to their original state in case items have been
      // Dragged across containers
      setItems(clonedItems);
    }

    setActiveId(null);
    setClonedItems(null);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  useEffect(() => {
    console.log("containers", containers)
    console.log("items", items)
  }, [items, containers])
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={({active}) => {
        setActiveId(active.id);
        setClonedItems(items);
      }}
      onDragOver={({active, over}) => {
        const overId = over?.id;

        if (!overId || overId === TRASH_ID || active.id in items) {
          return;
        }

        const overContainer = findContainer(overId);
        const activeContainer = findContainer(active.id);

        if (!overContainer || !activeContainer) {
          return;
        }


        console.log("activeContaineractiveContainer", activeContainer)
        console.log("overContaineroverContainer", overContainer)
        if (activeContainer !== overContainer && activeContainer === FILTER_ID) {
          setItems((items) => {
            const activeItems = items[activeContainer].items;
            const overItems = items[overContainer].items;
            const overIndex = overItems.findIndex((item) => item.id === overId);
            const activeIndex = activeItems.findIndex((item) => item.id === active.id);

            let newIndex: number;

            if (overId in items) {
              newIndex = overItems.length + 1;
            } else {
              const isBelowOverItem =
                over &&
                active.rect.current.translated &&
                active.rect.current.translated.top >
                  over.rect.top + over.rect.height;

              const modifier = isBelowOverItem ? 1 : 0;

              newIndex =
                overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            recentlyMovedToNewContainer.current = true;

            /*
              ...(activeContainer === FILTER_ID ? items[activeContainer].items : items[activeContainer].items.filter(
                (item) => item.id !== active.id
              )
             */
              

              console.log("overContainer", overContainer)
              return {
                ...items,
                [activeContainer]: {
                  ...items[activeContainer],
                  items: [
                    ...items[activeContainer].items.filter(
                      (item) => item.id !== active.id
                    )
                  ]
                },
                [overContainer]: {
                  ...items[overContainer],
                  items: [...items[overContainer].items.slice(0, newIndex),
                  items[activeContainer].items[activeIndex],
                  ...items[overContainer].items.slice(
                    newIndex,
                    items[overContainer].items.length
                  ),]
                },
              }; 
          });
        }
      }}
      onDragEnd={({active, over}) => {
        if (active.id in items && over?.id) {
          setContainers((containers) => {
            const activeIndex = containers.indexOf(active.id);
            const overIndex = containers.indexOf(over.id);

            return arrayMove(containers, activeIndex, overIndex);
          });
        }
        

        const activeContainer = findContainer(active.id);

        if (!activeContainer) {
          setActiveId(null);
          return;
        }

        const overId = over?.id;

        if (!overId) {
          setActiveId(null);
          return;
        }

        if (overId === PLACEHOLDER_ID) {
          const newContainerId = getNextContainerId();

          unstable_batchedUpdates(() => {
            setContainers((containers) => [...containers, newContainerId]);
            setItems((items) => ({
              ...items,
              [activeContainer]: items[activeContainer].filter(
                (id) => id !== activeId
              ),
              [newContainerId]: [active.id],
            }));
            setActiveId(null);
          });
          return;
        }

        const overContainer = findContainer(overId);

        if (overContainer) {
          const activeIndex = items[activeContainer].items.findIndex((item) => item.id === active.id)
          const overIndex = items[overContainer].items.findIndex((item) => item.id === overId)

          if (activeIndex !== overIndex) {
            setItems((items) => ({
              ...items,
              [overContainer]: {
                ...items[overContainer],
                items: arrayMove(
                  items[overContainer].items,
                  activeIndex,
                  overIndex
                ),
              },
            }))
          }
        
        // RIGHT COLUMN TO LEFT --- after new item in left column create new key / id
          if (overContainer === FILTER_ID) {
              setItems((items) => {
              const activeItems = items[activeContainer].items;
              const overItems = items[overContainer].items;
              const overIndex = overItems.findIndex((item) => item.id === overId);
              const activeIndex = activeItems.findIndex((item) => item.id === active.id);

              let newIndex: number;

              if (overId in items) {
                newIndex = overItems.length + 1;
              } else {
                const isBelowOverItem =
                  over &&
                  active.rect.current.translated &&
                  active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;

                newIndex =
                  overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
              }

              recentlyMovedToNewContainer.current = true;

              return {
                ...items,
                [activeContainer]: {
                  ...items[activeContainer],
                  items: [
                    ...items[activeContainer].items
                  ]
                },
                [overContainer]: {
                  ...items[overContainer],
                  items: [
                    ...items[overContainer].items.slice(0, newIndex),
                    { ...items[activeContainer].items[activeIndex], id: uuidv4() },
                    ...items[overContainer].items.slice(
                      newIndex,
                      items[overContainer].items.length
                    ),
                  ]
                },
              };
            });
          }
        }

        setActiveId(null);
      }}
      cancelDrop={cancelDrop}
      onDragCancel={onDragCancel}
      modifiers={modifiers}
    >
      <div
        style={{
          display: 'flex',
          boxSizing: 'border-box',
          padding: 20,
        }}
      >
        <div
        >
        <SortableContext
          items={[...containers, PLACEHOLDER_ID, FILTER_ID]}
          strategy={
            vertical
              ? verticalListSortingStrategy
              : horizontalListSortingStrategy
          }
        >
          <div style={{ display: 'flex'}}>
            <div>
              {containers.map((containerId) => {
                if(containerId !== FILTER_ID) {
                  return (
                    <DroppableContainer
                      key={containerId}
                      id={containerId}
                      label={minimal ? undefined : `Sequence ${containerId}`}
                      items={items[containerId].items}
                      scrollable={scrollable}
                      style={containerStyle}
                      onRemove={() => handleRemove(containerId)}
                    >
                      {console.log(items)}
                      <SortableContext items={items[containerId].items.map((item) => {
                        console.log(item)
                        console.log(containerId)
                        console.log(items[containerId].items)
                        return item.id
                      })} strategy={strategy}>
                        {items[containerId].items.map((value, index) => {
                          return (
                            <SortableItem
                              disabled={isSortingContainer}
                              key={value.id}
                              id={value.id}
                              index={index}
                              handle={handle}
                              style={getItemStyles}
                              wrapperStyle={wrapperStyle}
                              renderItem={renderItem}
                              containerId={containerId}
                              getIndex={getIndex}
                            />
                          );
                        })}
                      </SortableContext>
                    </DroppableContainer>
                  )
                }
              })}
              {minimal ? undefined : (
                <DroppableContainer
                  id={PLACEHOLDER_ID}
                  disabled={isSortingContainer}
                  items={empty}
                  onClick={handleAddColumn}
                  placeholder
                >
                  + Add Sequence
                </DroppableContainer>
              )}
            </div>
            <div>
            <DroppableContainer
              id={FILTER_ID}
              disabled={isSortingContainer}
              items={empty}
            >
              <SortableContext items={items[FILTER_ID].items.map((item)=> item.id)} strategy={strategy}>
                  {items[FILTER_ID].items.map((item, index) => {
                    return (
                      <SortableItem
                        disabled={isSortingContainer}
                        key={`${item.id}-${index}`}
                        id={item.id}
                        index={index}
                        handle={handle}
                        style={getItemStyles}
                        wrapperStyle={wrapperStyle}
                        renderItem={renderItem}
                        containerId={FILTER_ID}
                        getIndex={getIndex}
                      />
                    );
                  })}
                </SortableContext>
            </DroppableContainer>
            </div>
          </div>
          
         
        </SortableContext>
        </div>
      </div>
        {typeof window === 'object' ??createPortal(
        <DragOverlay adjustScale={adjustScale} dropAnimation={dropAnimation}>
          {activeId
            ? containers.includes(activeId)
              ? renderContainerDragOverlay(activeId)
              : renderSortableItemDragOverlay(activeId)
            : null}
        </DragOverlay>,
        document.body
      )}
      {trashable && activeId && !containers.includes(activeId) ? (
        <Trash id={TRASH_ID} />
      ) : null}
    </DndContext>
  );

  function renderSortableItemDragOverlay(id: string) {
    return (
      <Item
        value={id}
        handle={handle}
        style={getItemStyles({
          containerId: findContainer(id) as string,
          overIndex: -1,
          index: getIndex(id),
          value: id,
          isSorting: true,
          isDragging: true,
          isDragOverlay: true,
        })}
        wrapperStyle={wrapperStyle({index: 0})}
        renderItem={renderItem}
        dragOverlay
      />
    );
  }

  function renderContainerDragOverlay(containerId: string) {
    return (
      <Container
        label={`Sequence: ${containerId}`}
        style={{
          height: '100%',
        }}
        shadow
      >
        {items[containerId].map((item, index) => (
          <Item
            key={item}
            value={item}
            handle={handle}
            style={getItemStyles({
              containerId,
              overIndex: -1,
              index: getIndex(item),
              value: item,
              isDragging: false,
              isSorting: false,
              isDragOverlay: false,
            })}
            wrapperStyle={wrapperStyle({index})}
            renderItem={renderItem}
          />
        ))}
      </Container>
    );
  }

  function handleRemove(containerID: UniqueIdentifier) {
    setContainers((containers) =>
      containers.filter((id) => id !== containerID)
    );
  }

  function handleAddColumn() {
    const newContainerId = uuidv4();

    unstable_batchedUpdates(() => {
      setContainers((containers) => [...containers, newContainerId]);
      setItems((items) => ({
        ...items,
        [newContainerId]: {
          id: newContainerId,
          title: newContainerId,
          items: []
        },
      }));
    });
  }

  function getNextContainerId() {
    const containerIds = Object.keys(items);
    const lastContainerId = containerIds[containerIds.length - 1];

    return String.fromCharCode(lastContainerId.charCodeAt(0) + 1);
  }
}

function Trash({id}: {id: UniqueIdentifier}) {
  const {setNodeRef, isOver} = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        left: '50%',
        marginLeft: -150,
        bottom: 20,
        width: 300,
        height: 60,
        borderRadius: 5,
        border: '1px solid',
        borderColor: isOver ? 'red' : '#DDD',
      }}
    >
      Drop here to delete
    </div>
  );
}

interface SortableItemProps {
  containerId: string;
  id: string;
  index: number;
  handle: boolean;
  disabled?: boolean;
  style(args: any): React.CSSProperties;
  getIndex(id: string): number;
  renderItem(): React.ReactElement;
  wrapperStyle({index}: {index: number}): React.CSSProperties;
}

function SortableItem({
  disabled,
  id,
  index,
  handle,
  renderItem,
  style,
  containerId,
  getIndex,
  wrapperStyle,
}: SortableItemProps) {
  const {
    setNodeRef,
    listeners,
    isDragging,
    isSorting,
    over,
    overIndex,
    transform,
    transition,
  } = useSortable({
    id,
  });
  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <Item
      ref={disabled ? undefined : setNodeRef}
      value={id}
      dragging={isDragging}
      sorting={isSorting}
      handle={handle}
      index={index}
      wrapperStyle={wrapperStyle({index})}
      style={style({
        index,
        value: id,
        isDragging,
        isSorting,
        overIndex: over ? getIndex(over.id) : overIndex,
        containerId,
      })}
      transition={transition}
      transform={transform}
      fadeIn={mountedWhileDragging}
      listeners={listeners}
      renderItem={renderItem}
    />
  );
}

function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);

    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}
