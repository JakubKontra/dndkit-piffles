import { container_items, hashedItems } from 'data/data';
import { MultipleContainers } from './MultipleContainers';

export const Builder = () => <MultipleContainers vertical droppableItems={container_items} items={hashedItems}/>;