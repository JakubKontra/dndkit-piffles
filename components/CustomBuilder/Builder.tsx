import { Items } from '../../data/data';
import { MultipleContainers } from './MultipleContainers';

export const CustomBuilder = ({ items } : { items: Items }) => <MultipleContainers itemCount={5} vertical items={items} />;