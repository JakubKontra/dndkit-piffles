
import { v4 as uuidv4 } from 'uuid';
export type Items = Record<string, Container>

export type Container = {
    id: string,
    title: string,
    items: ContainerItem[]
}

export type ContainerItem = {
    id: string,
    code: string
}

const container1 = {
    id: uuidv4(),
    title: `Container: ${uuidv4()}`,
    items: [
        { id: uuidv4(), code: uuidv4() } as ContainerItem,
    ]
} as Container

const container2 = {
    id: uuidv4(),
    title: `Container: ${uuidv4()}`,
    items: [
        { id: uuidv4(), code: uuidv4() } as ContainerItem,
        { id: uuidv4(), code: uuidv4() } as ContainerItem,
    ]
} as Container

const container3 = {
    id: uuidv4(),
    title: `Container: ${uuidv4()}`,
    items: [
        { id: uuidv4(), code: uuidv4() } as ContainerItem,
        { id: uuidv4(), code: uuidv4() } as ContainerItem,
        { id: uuidv4(), code: uuidv4() } as ContainerItem,
    ]
} as Container

const containers = [
    container1,
    container2,
    container3
]

const hashObject: Items = containers.reduce((acc, current) => {
  //@ts-ignore
  acc[current.id] = current
  return acc
}, {})

export const hashedItems: Items = hashObject