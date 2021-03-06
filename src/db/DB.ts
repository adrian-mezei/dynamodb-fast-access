import { DynamoDB } from 'aws-sdk';
import { ExpressionCreator } from './ExpressionCreator';
import { DatabaseConfig } from '../util/DatabaseConfig';
import { Extender, DefaultExtender } from './Extender';
import { RelatedDeleter, DefaultRelatedDeleter } from './RelatedDeleter';
import { DynamoDBKey, DynamoDBTable, KeyType } from '../model/ConfigModels';
import { DynamoDBFastAccessError } from '../util/DynamoDBFastAccessError';

export function DB<EntityModel, EntityRawModel>(
    tableAlias: string,
    extend: Extender<EntityModel, EntityRawModel> = DefaultExtender,
    deleteRelated: RelatedDeleter = DefaultRelatedDeleter,
) {
    return class DB {
        public static getTableConfig(): DynamoDBTable {
            const tableConfig = DatabaseConfig.DynamoDBConfig.tables.find(x => x.tableAlias === tableAlias);
            if (tableConfig === undefined) {
                throw new DynamoDBFastAccessError('Table configuration with the given alias does not exist.');
            }

            return tableConfig;
        }

        public static getSortKeySeparator(): string {
            const sortKeySeparator = DB.getTableConfig().sortKeySeparator;
            return sortKeySeparator === undefined ? '$' : sortKeySeparator;
        }

        public static getTableAlias(): string {
            return DB.getTableConfig().tableAlias;
        }

        /**
         * Returns the name of the table.
         */
        public static getTableName(): string {
            return DB.getTableConfig().tableName;
        }

        public static getPartitionKeyName(): string {
            return DB.getTableConfig().partitionKeyName;
        }

        public static getPartitionKeyType(): KeyType {
            return DB.getTableConfig().partitionKeyType;
        }

        public static getSortKeyName(): string | undefined {
            return DB.getTableConfig().sortKeyName;
        }

        public static getSortKeyType(): KeyType | undefined {
            return DB.getTableConfig().sortKeyType;
        }

        public static extend(rawEntities: EntityRawModel[]): Promise<EntityModel[]> {
            return extend(rawEntities);
        }

        public static deleteRelated(ids: string[]): Promise<void> {
            return deleteRelated(ids);
        }

        public static async getByIdRaw(id: string, attributes?: { ConsistentRead?: boolean }): Promise<EntityRawModel> {
            const tableName = DB.getTableName();
            const partitionKeyName = DB.getPartitionKeyName();
            const sortKeyName = DB.getSortKeyName();
            const sortKeySeparator = DB.getSortKeySeparator();

            const params: DynamoDB.DocumentClient.GetItemInput = {
                TableName: tableName,
                Key: { [partitionKeyName]: DB._castKey(id).partitionKey },
            };
            if (attributes) {
                params.ConsistentRead = attributes.ConsistentRead;
            }

            if (sortKeyName !== undefined) {
                if (id.indexOf(sortKeySeparator) < 0) {
                    throw new DynamoDBFastAccessError(
                        'Composite key must include ' + sortKeySeparator + ' that separates the keys.',
                    );
                }
                params.Key[partitionKeyName] = DB._castKey(id).partitionKey;
                params.Key[sortKeyName] = DB._castKey(id).sortKey;
            }

            const entityData = await DatabaseConfig.DynamoDBDocumentClient().get(params).promise();
            if (!entityData.Item) throw new DynamoDBFastAccessError('Resource does not exist.');

            return entityData.Item as EntityRawModel;
        }

        public static async getById(
            id: string,
            attributes?: { ConsistentRead?: boolean } | undefined,
        ): Promise<EntityModel> {
            const rawEntity = await DB.getByIdRaw(id, attributes);

            return (await extend([rawEntity]))[0];
        }

        public static async getByIdsRaw(ids: string[]): Promise<EntityRawModel[]> {
            if (ids.length === 0) return [];

            const tableName = DB.getTableName();
            const partitionKeyName = DB.getPartitionKeyName();
            const sortKeyName = DB.getSortKeyName();
            const sortKeySeparator = DB.getSortKeySeparator();

            const entityIDsParts: any[] = [];
            const partsSize = 100;
            for (let i = 0, j = ids.length; i < j; i += partsSize) {
                entityIDsParts.push(ids.slice(i, i + partsSize));
            }

            const dataArray = await Promise.all(
                entityIDsParts.map(entityIDsPart => {
                    const params: DynamoDB.DocumentClient.BatchGetItemInput = {
                        RequestItems: {
                            [tableName]: {
                                Keys: [],
                            },
                        },
                    };

                    for (const entityID of entityIDsPart) {
                        if (sortKeyName === undefined) {
                            params.RequestItems[tableName].Keys.push({
                                [partitionKeyName]: entityID,
                            });
                        } else {
                            if (entityID.indexOf(sortKeySeparator) < 0) {
                                throw new DynamoDBFastAccessError(
                                    'Composite key must include ' + sortKeySeparator + ' that separates the keys.',
                                );
                            }
                            params.RequestItems[tableName].Keys.push({
                                [partitionKeyName]: DB._castKey(entityID).partitionKey,
                                [sortKeyName]: DB._castKey(entityID).sortKey,
                            });
                        }
                    }

                    return DatabaseConfig.DynamoDBDocumentClient().batchGet(params).promise();
                }),
            );

            let rawEntities: EntityRawModel[] = [];
            for (const data of dataArray) {
                rawEntities = rawEntities.concat(data.Responses![tableName] as EntityRawModel[]);
            }

            return rawEntities;
        }

        public static async getByIds(ids: string[]): Promise<EntityModel[]> {
            const rawEntities = await DB.getByIdsRaw(ids);

            return extend(rawEntities);
        }

        public static scanFilteredRaw(
            filterAttributes?: Partial<EntityRawModel>,
            arrayContainsAttribute?: { arrayName: string; value: string },
        ): Promise<EntityRawModel[]> {
            const scanParams = DB._buildScanParams(filterAttributes, arrayContainsAttribute);
            return DB._scanRaw(scanParams, []);
        }

        public static async scanFiltered(
            filterAttributes?: object,
            arrayContainsAttribute?: { arrayName: string; value: string },
        ): Promise<EntityModel[]> {
            const rawEntities = await DB.scanFilteredRaw(filterAttributes, arrayContainsAttribute);

            return extend(rawEntities);
        }

        public static async _scanRaw(
            params: DynamoDB.DocumentClient.ScanInput,
            items: EntityRawModel[],
        ): Promise<EntityRawModel[]> {
            const data = await DatabaseConfig.DynamoDBDocumentClient().scan(params).promise();
            if (data.Items) items = items.concat(data.Items as EntityRawModel[]);
            if (!data.LastEvaluatedKey) return items;

            params.ExclusiveStartKey = data.LastEvaluatedKey;
            return DB._scanRaw(params, items);
        }

        public static async _scan(
            params: DynamoDB.DocumentClient.ScanInput,
            items: EntityRawModel[],
        ): Promise<EntityModel[]> {
            const data = await DatabaseConfig.DynamoDBDocumentClient().scan(params).promise();
            if (data.Items) items = items.concat(data.Items as EntityRawModel[]);
            if (!data.LastEvaluatedKey) return extend(items);

            params.ExclusiveStartKey = data.LastEvaluatedKey;
            return extend(await DB._scanRaw(params, items));
        }

        public static async deleteById(id: string): Promise<string> {
            const tableName = DB.getTableName();
            const partitionKeyName = DB.getPartitionKeyName();
            const sortKeyName = DB.getSortKeyName();
            const sortKeySeparator = DB.getSortKeySeparator();

            const params: DynamoDB.DocumentClient.DeleteItemInput = {
                TableName: tableName,
                Key: { [partitionKeyName]: DB._castKey(id).partitionKey },
            };

            if (sortKeyName !== undefined) {
                if (id.indexOf(sortKeySeparator) < 0) {
                    throw new DynamoDBFastAccessError(
                        'Composite key must include ' + sortKeySeparator + ' that separates the keys.',
                    );
                }
                params.Key[partitionKeyName] = DB._castKey(id).partitionKey;
                params.Key[sortKeyName] = DB._castKey(id).sortKey;
            }

            await deleteRelated([id]);
            await DatabaseConfig.DynamoDBDocumentClient()
                .delete(params)
                .promise()
                .catch((err: Error) => {
                    if (err.name !== 'ResourceNotFoundException') throw err;
                    else return id;
                });

            return id;
        }

        public static async deleteByIds(ids?: string[]): Promise<string[]> {
            if (!ids || ids.length === 0) return [];

            const tableName = DB.getTableName();
            const partitionKeyName = DB.getPartitionKeyName();
            const sortKeyName = DB.getSortKeyName();

            const entityIDsPartsArray: string[][] = [];
            const partsSize = 25;
            for (let i = 0, j = ids.length; i < j; i += partsSize) {
                entityIDsPartsArray.push(ids.slice(i, i + partsSize));
            }

            for (const entityIDsParts of entityIDsPartsArray) {
                const batchWriteParams: DynamoDB.DocumentClient.BatchWriteItemInput = {
                    RequestItems: {
                        [tableName]: [],
                    },
                };

                for (const entityIDsPart of entityIDsParts) {
                    batchWriteParams.RequestItems[tableName].push({
                        DeleteRequest: {
                            Key:
                                sortKeyName === undefined
                                    ? { [partitionKeyName]: entityIDsPart }
                                    : {
                                          [partitionKeyName]: DB._castKey(entityIDsPart).partitionKey,
                                          [sortKeyName]: DB._castKey(entityIDsPart).sortKey,
                                      },
                        },
                    });
                }

                await deleteRelated(entityIDsParts);
                await DB._batchWriteWithRetry(batchWriteParams, 0);
            }

            return ids;
        }

        public static async deleteScanFiltered(
            filterAttributes?: Partial<EntityRawModel>,
            arrayContains?: { arrayName: string; value: string },
        ): Promise<{}> {
            const scanParams = DB._buildScanParams(filterAttributes, arrayContains);
            return DB._scanDelete(scanParams);
        }

        public static _buildScanParams(
            filterAttributes?: Partial<EntityRawModel>,
            arrayContainsAttribute?: { arrayName: string; value: string },
        ): DynamoDB.DocumentClient.ScanInput {
            const tableName = DB.getTableName();

            let FilterExpression = '';
            let ExpressionAttributeNames: any = {};
            let ExpressionAttributeValues: any = {};

            if (filterAttributes) {
                FilterExpression = ExpressionCreator.getFilterExpression(filterAttributes);
                ExpressionAttributeNames = ExpressionCreator.getExpressionAttributeNames(filterAttributes);
                ExpressionAttributeValues = ExpressionCreator.getExpressionAttributeValues(filterAttributes);
            }

            if (arrayContainsAttribute && arrayContainsAttribute.arrayName && arrayContainsAttribute.value) {
                FilterExpression += ' contains(#' + arrayContainsAttribute.arrayName + ', :attributeValue)';
                ExpressionAttributeNames['#' + arrayContainsAttribute.arrayName] = arrayContainsAttribute.arrayName;
                ExpressionAttributeValues[':attributeValue'] = arrayContainsAttribute.value;
            }

            const params: DynamoDB.DocumentClient.ScanInput = {
                TableName: tableName,
            };
            if (FilterExpression !== '') params.FilterExpression = FilterExpression;
            if (Object.keys(ExpressionAttributeNames).length > 0) {
                params.ExpressionAttributeNames = ExpressionAttributeNames;
            }
            if (Object.keys(ExpressionAttributeValues).length > 0) {
                params.ExpressionAttributeValues = ExpressionAttributeValues;
            }

            return params;
        }

        public static async _scanDelete(params: DynamoDB.DocumentClient.ScanInput): Promise<{}> {
            const partitionKeyName = DB.getPartitionKeyName();
            const sortKeyName = DB.getSortKeyName();
            const sortKeySeparator = DB.getSortKeySeparator();

            const data = await DatabaseConfig.DynamoDBDocumentClient().scan(params).promise();

            if (data.Items) {
                const rawEntities = data.Items as EntityRawModel[];

                await Promise.all(
                    rawEntities.map(async rawEntity => {
                        const entityId =
                            sortKeyName === undefined
                                ? (rawEntity as any)[partitionKeyName]
                                : (rawEntity as any)[partitionKeyName] +
                                  sortKeySeparator +
                                  (rawEntity as any)[sortKeyName];
                        await deleteRelated([entityId]);
                        await DB.deleteById(entityId);
                    }),
                );
            }
            if (!data.LastEvaluatedKey) return {};

            params.ExclusiveStartKey = data.LastEvaluatedKey;
            return DB._scanDelete(params);
        }

        public static async createRaw(entity: EntityRawModel): Promise<EntityRawModel> {
            const tableName = DB.getTableName();

            const attributeMap: DynamoDB.DocumentClient.PutItemInputAttributeMap = entity;

            const params: DynamoDB.DocumentClient.PutItemInput = {
                TableName: tableName,
                Item: attributeMap,
            };

            await DatabaseConfig.DynamoDBDocumentClient().put(params).promise();
            return attributeMap as EntityRawModel;
        }

        public static async create(entity: EntityRawModel): Promise<EntityModel> {
            const attributeMap = await DB.createRaw(entity);
            const extended = await extend([attributeMap as EntityRawModel]);
            return extended[0] as EntityModel;
        }

        public static async createBatchRaw(entities: EntityRawModel[]): Promise<EntityRawModel[]> {
            const putRequests = [];
            for (const entity of entities) {
                putRequests.push({
                    PutRequest: {
                        Item: entity,
                    },
                });
            }

            const putRequestParts = [];
            const partsSize = 25;
            for (let i = 0, j = putRequests.length; i < j; i += partsSize) {
                putRequestParts.push(putRequests.slice(i, i + partsSize));
            }

            for (const putRequestPart of putRequestParts) {
                const batchWriteParams: DynamoDB.DocumentClient.BatchWriteItemInput = {
                    RequestItems: {
                        [DB.getTableName()]: putRequestPart,
                    },
                };
                await DB._batchWriteWithRetry(batchWriteParams, 0);
            }
            return entities;
        }

        public static async createBatch(entities: EntityRawModel[]): Promise<EntityModel[]> {
            return extend(await DB.createBatchRaw(entities));
        }

        /**
         *   @params: The parameter for the batchWrite operation.
         *   @retry: This should be 0 when called first, this will be incremented in the recursion.
         */
        public static async _batchWriteWithRetry(
            params: DynamoDB.DocumentClient.BatchWriteItemInput,
            retry: number,
        ): Promise<{}> {
            if (retry > 0) console.log('Retry: ' + retry);
            if (retry > DatabaseConfig.DynamoDBConfig.maxRetries) {
                throw new DynamoDBFastAccessError('Maximum number of batch write retries exceeded.');
            }

            const data = await DatabaseConfig.DynamoDBDocumentClient().batchWrite(params).promise();

            if (data.UnprocessedItems && Object.keys(data.UnprocessedItems).length > 0) {
                const waitTimeout = Math.pow(2, retry) * 50 * Math.random();
                params.RequestItems = data.UnprocessedItems;
                await new Promise(res => setTimeout(res, waitTimeout));
                await DB._batchWriteWithRetry(params, retry + 1);
            }

            return {};
        }

        public static _castKey(key: string): DynamoDBKey {
            const partitionKey = key.split(DB.getSortKeySeparator())[0];
            const sortKey = key.split(DB.getSortKeySeparator()).splice(1).join(DB.getSortKeySeparator());

            let partitionKeyTyped: string | number;
            switch (DB.getPartitionKeyType()) {
                case 'string':
                    partitionKeyTyped = partitionKey;
                    break;
                case 'number':
                    partitionKeyTyped = +partitionKey;
                    break;
            }

            if (!DB.getSortKeyName()) return { partitionKey: partitionKeyTyped! };

            let sortKeyTyped: string | number;
            switch (DB.getSortKeyType()) {
                case 'string':
                    sortKeyTyped = sortKey;
                    break;
                case 'number':
                    sortKeyTyped = +sortKey;
                    break;
            }

            return {
                partitionKey: partitionKeyTyped!,
                sortKey: sortKeyTyped!,
            };
        }
    };
}
