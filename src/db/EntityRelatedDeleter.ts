type EntityRelatedDeleter = (ids: string[]) => Promise<void[]>;

const DefaultEntityRelatedDeleter = (): Promise<void[]> => new Promise(res => res());

export { EntityRelatedDeleter, DefaultEntityRelatedDeleter };
