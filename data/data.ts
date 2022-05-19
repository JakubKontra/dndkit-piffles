
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
    id: 'container-1',
    title: `Container: 1`,
    items: [
        { id: 'item-1', code: 'XY-12' } as ContainerItem,
    ]
} as Container

const container2 = {
    id: 'container-2',
    title: `Container: 2`,
    items: [
        { id: 'item-2', code: 'XY-12' } as ContainerItem,
        { id: 'item-3', code: 'XY-13' } as ContainerItem,
    ]
} as Container

const container3 = {
    id: 'container-3',
    title: `Container: 3`,
    items: [
        { id: 'item-4', code: 'XY-13' } as ContainerItem,
        { id: 'item-5', code: 'XY-14' } as ContainerItem,
        { id: 'item-6', code: 'XY-15' } as ContainerItem,
    ]
} as Container

const container_items = {
    id: 'container_items',
    title: `Container Items`,
    items: [
        { id: 'item-7', code: 'XY-16' } as ContainerItem,
        { id: 'item-8', code: 'XY-17' } as ContainerItem,
        { id: 'item-9', code: 'XY-18' } as ContainerItem,
    ]
} as Container

const containers = [
    container1,
    container2,
    container3,
    container_items
]

const hashObject: Items = containers.reduce((acc, current) => {
  //@ts-ignore
  acc[current.id] = current
  return acc
}, {})


export const hashedItems: Items = hashObject