import { DynamoDB } from 'aws-sdk';
import { DB } from './DB';
import { ListModel } from '../model/ListModel';
import { DatabaseConfig } from '../util/DatabaseConfig';
import { Extender, DefaultExtender } from './Extender';
import { DefaultRelatedDeleter, RelatedDeleter } from './RelatedDeleter';
import { DynamoDBFastAccessError } from '../util/DynamoDBFastAccessError';

export function DBComposite<EntityModel, EntityRawModel>(
    tableName: string, 
    extend: Extender<EntityModel, EntityRawModel> = DefaultExtender, 
    deleteRelated: RelatedDeleter = DefaultRelatedDeleter) {

        return class DBComposite extends DB<EntityModel, EntityRawModel>(tableName, extend, deleteRelated) {

            public static async queryRecurseRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityRawModel[]> {
                const queryParams = DBComposite._getQueryParameter(partitionKeyValue, exclusiveStartKey);
                return DBComposite._queryRecurseNative(queryParams, []);
            }

            public static async queryRecurse(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityModel[]> {
                const rawEntities = await DBComposite.queryRecurseRaw(partitionKeyValue, exclusiveStartKey);
                return extend(rawEntities);
            }
            
            public static async queryBeginsWithRecurseRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityRawModel[]> {
                const queryParams = DBComposite._getBeginsWithQueryParameter(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
                return DBComposite._queryRecurseNative(queryParams, []);
            }

            public static async queryBeginsWithRecurse(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityModel[]> {
                const rawEntities = await DBComposite.queryBeginsWithRecurseRaw(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
                return extend(rawEntities);
            }

            public static async queryBeginsWithRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>> {
                const queryParams = DBComposite._getBeginsWithQueryParameter(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
                
                const data = await DatabaseConfig.DynamoDBDocumentClient().query(queryParams).promise();

                return {
                    items: data.Items ? data.Items as EntityRawModel[] : [],
                    lastEvaluatedKey: data.LastEvaluatedKey ? DBComposite.combineKeys(data.LastEvaluatedKey) : undefined
                };
            }

            public static async queryBeginsWith(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityModel>> {
                const data = await DBComposite.queryBeginsWithRaw(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);

                return {
                    items: await extend(data.items),
                    lastEvaluatedKey: data.lastEvaluatedKey
                };
            }

            public static async queryRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>> {
                const queryParams = DBComposite._getBeginsWithQueryParameter(partitionKeyValue, exclusiveStartKey);
                
                const data = await DatabaseConfig.DynamoDBDocumentClient().query(queryParams).promise();

                return {
                    items: data.Items ? data.Items as EntityRawModel[] : [],
                    lastEvaluatedKey: data.LastEvaluatedKey ? DBComposite.combineKeys(data.LastEvaluatedKey) : undefined
                };
            }

            public static async query(partitionKeyValue: string, exclusiveStartKey?: string): Promise<ListModel<EntityModel>> {
                const data = await DBComposite.queryRaw(partitionKeyValue, exclusiveStartKey);
                
                return {
                    items: await extend(data.items),
                    lastEvaluatedKey: data.lastEvaluatedKey
                };
            }

            public static _getBeginsWithQueryParameter(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): DynamoDB.DocumentClient.QueryInput {
                const tableName = DBComposite.getTableName();
                const partitionKeyName = DBComposite.getPartitionKeyName();
                const sortKeyName = DBComposite.getSortKeyName();
                
                if(sortKeyName === undefined) throw new DynamoDBFastAccessError('Sort key name is undefined for table ' + tableName + '.');

                const queryParams: DynamoDB.DocumentClient.QueryInput = {
                    TableName: tableName,
                    KeyConditionExpression: '#partitionKeyName = :partitionKeyValue',
                    ExpressionAttributeNames: {
                        '#partitionKeyName': partitionKeyName
                    },
                    ExpressionAttributeValues: {
                        ':partitionKeyValue': partitionKeyValue
                    }
                };

                if(sortKeyBeginsWithValue !== undefined) {
                    queryParams.KeyConditionExpression += ' AND begins_with(#sortKeyName, :sortKeyBeginsWithValue)';
                    queryParams.ExpressionAttributeNames!['#sortKeyName'] = sortKeyName;
                    queryParams.ExpressionAttributeValues![':sortKeyBeginsWithValue'] = sortKeyBeginsWithValue;
                }

                if(exclusiveStartKey !== undefined) {
                    queryParams.ExclusiveStartKey = {
                        [partitionKeyName]: DBComposite._castKey(exclusiveStartKey).partitionKey,
                        [sortKeyName]: DBComposite._castKey(exclusiveStartKey).sortKey
                    };
                }

                return queryParams;
            }

            public static _getQueryParameter(partitionKeyValue: string, exclusiveStartKey?: string): DynamoDB.DocumentClient.QueryInput {
                const tableName = DBComposite.getTableName();
                const partitionKeyName = DBComposite.getPartitionKeyName();
                const sortKeyName = DBComposite.getSortKeyName();
                if(sortKeyName === undefined) throw new DynamoDBFastAccessError('Sort key name is undefined for table ' + tableName + '.');

                const queryParams: DynamoDB.DocumentClient.QueryInput = {
                    TableName: tableName,
                    KeyConditionExpression: '#partitionKeyName = :partitionKeyValue',
                    ExpressionAttributeNames: {
                        '#partitionKeyName': partitionKeyName
                    },
                    ExpressionAttributeValues: {
                        ':partitionKeyValue': partitionKeyValue
                    }
                };

                if(exclusiveStartKey !== undefined) {
                    queryParams.ExclusiveStartKey = {
                        [partitionKeyName]: DBComposite._castKey(exclusiveStartKey).partitionKey,
                        [sortKeyName]: DBComposite._castKey(exclusiveStartKey).sortKey
                    };
                }

                return queryParams;
            }

            public static async _queryRecurseNative(params: DynamoDB.DocumentClient.QueryInput, items: EntityRawModel[]): Promise<EntityRawModel[]> {
                const data = await DatabaseConfig.DynamoDBDocumentClient().query(params).promise();
                    
                if(data.Items) items = items.concat(data.Items as EntityRawModel[]);
                
                if(!data.LastEvaluatedKey) return items;
                
                params.ExclusiveStartKey = data.LastEvaluatedKey;
        
                return DBComposite._queryRecurseNative(params, items);
            }

            public static combineKeys(dynamoDBKey: DynamoDB.DocumentClient.Key): string {
                const partitionKeyName = DBComposite.getPartitionKeyName();
                const sortKeyName = DBComposite.getSortKeyName();
                const sortKeySeparator = DBComposite.getSortKeySeparator();
                
                const partitionKeyValue = dynamoDBKey[partitionKeyName];
                let sortKeyValue;
                if(sortKeyName !== undefined) {
                    sortKeyValue = dynamoDBKey[sortKeyName];
                }

                let key = '';
                if(partitionKeyValue !== undefined) key += partitionKeyValue;
                if(sortKeyValue !== undefined) {
                    key += sortKeySeparator;
                    key += sortKeyValue;
                }

                return key;
            }

        };
}
