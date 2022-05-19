import { createRange } from '../../utilities';
import { MultipleContainers } from './MultipleContainers';

type Items = Record<string, string[]>;

const itemCount = 5
const items = {
    A: createRange(itemCount, (index) => `A${index + 1}`),
    B: createRange(itemCount, (index) => `B${index + 1}`),
    C: createRange(itemCount, (index) => `C${index + 1}`),
    D: createRange(itemCount, (index) => `D${index + 1}`),
    container_items: ['X1-1', 'X2-2', 'X3-3']
  } as Items
export const Builder = () => <MultipleContainers vertical  items={items}/>;