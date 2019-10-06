export interface IDB<EntityModel, EntityRawModel> {
    // Config
    getTableName(): string;
    getPartitionKeyName(): string;
    getSortKeyName(): string | undefined;
    getSortKeySeparator(): string;

    // Create
    createRaw(entity: EntityRawModel): Promise<EntityRawModel>;
    create(entity: EntityRawModel): Promise<EntityModel>;
    createBatchRaw(entities: EntityRawModel[]): Promise<EntityRawModel[]>;
    createBatch(entities: EntityRawModel[]): Promise<EntityModel[]>;
    // Get
    getByIdRaw(id: string, attributes?: { ConsistentRead?: boolean }): Promise<EntityRawModel>;
    getById(id: string, attributes?: { ConsistentRead?: boolean}): Promise<EntityModel>;
    getByIdsRaw(ids: string[]): Promise<EntityRawModel[]>;
    getByIds(ids: string[]): Promise<EntityModel[]>;
    // Scan
    scanFilteredRaw(filterAttributes?: Partial<EntityRawModel>, arrayContainsAttribute?: { arrayName: string, value: string }): Promise<EntityRawModel[]>;
    scanFiltered(filterAttributes?: | object, arrayContainsAttribute?: { arrayName: string, value: string }): Promise<EntityModel[]>;
    // Delete
    deleteById(id: string): Promise<string>;
    deleteByIds(ids?: string[]): Promise<string[]>;
    deleteScanFiltered(filterAttributes?: Partial<EntityRawModel>, arrayContains?: { arrayName: string, value: string } ): Promise<{}>;
}
