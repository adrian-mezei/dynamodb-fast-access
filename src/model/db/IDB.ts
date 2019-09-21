import { DynamoDB } from 'aws-sdk';

export interface IDB<EntityModel, EntityRawModel> {
    getSortKeySeparator(): string | undefined;

    getTableName(): string;
    getPartitionKeyName(): string;
    getSortKeyName(): string | undefined;

    getByIdRaw(id: string, attributes?: { ConsistentRead?: boolean }): Promise<EntityRawModel>;
    getById(id: string, attributes?: { ConsistentRead?: boolean} | undefined): Promise<EntityModel>;
    getByIdsRaw(ids: string[]): Promise<EntityRawModel[]>;
    getByIds(ids: string[]): Promise<EntityModel[]>;
    getFilteredRaw(filterAttributes: Partial<EntityRawModel> | undefined, arrayContainsAttribute: { arrayName: string, value: string } | undefined): Promise<EntityRawModel[]>;
    getFiltered(filterAttributes: undefined | object, arrayContainsAttribute: { arrayName: string, value: string } | undefined): Promise<EntityModel[]>;
    scan(params: DynamoDB.DocumentClient.ScanInput, items: EntityRawModel[]): Promise<EntityModel[]>;
    deleteById(id: string): Promise<string>;
    deleteByIds(ids: string[] | undefined): Promise<string[]>;
    deleteScanFiltered(filterAttributes: Partial<EntityRawModel> | undefined, arrayContains?: { arrayName: string, value: string } | undefined ): Promise<{}>;
    createRaw(entity: EntityRawModel): Promise<EntityRawModel>;
    create(entity: EntityRawModel): Promise<EntityModel>;
    createBatch(entities: EntityRawModel[]): Promise<EntityRawModel[]>;
}
