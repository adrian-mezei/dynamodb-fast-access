import { DynamoDB } from 'aws-sdk';
import { DB } from './DB';
import { ListModel } from '../model/ListModel';
import { DatabaseConfig } from '../util/DatabaseConfig';
import { StaticImplements } from '../util/StaticImplements';
import { IDBComposite } from '../model/db/IDBComposite';

export function DBComposite<EntityModel, EntityRawModel>(
    tableName: string, 
    extend: EntityExtender<EntityModel, EntityRawModel>, 
    deleteRelated: EntityRelatedDeleter) {
    
    @StaticImplements<IDBComposite<EntityModel, EntityRawModel>>()
    class DBComposite extends DB<EntityModel, EntityRawModel>(tableName, extend, deleteRelated) {

        public static async queryRecurseRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityRawModel[]> {
            const queryParams = DBComposite.getQueryParameter(partitionKeyValue, exclusiveStartKey);
            return DBComposite.queryRecurseNative(queryParams, []);
        }

        public static async queryRecurse(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityModel[]> {
            const rawEntities = await DBComposite.queryRecurseRaw(partitionKeyValue, exclusiveStartKey);
            return extend(rawEntities);
        }
        
        public static async queryBeginsWithRecurseRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityRawModel[]> {
            const queryParams = DBComposite.getBeginsWithQueryParameter(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            return DBComposite.queryRecurseNative(queryParams, []);
        }

        public static async queryBeginsWithRecurse(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityModel[]> {
            const rawEntities = await DBComposite.queryBeginsWithRecurseRaw(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            return extend(rawEntities);
        }

        public static async queryBeginsWithRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>> {
            const queryParams = DBComposite.getBeginsWithQueryParameter(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            
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
            const queryParams = DBComposite.getBeginsWithQueryParameter(partitionKeyValue, exclusiveStartKey);
            
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

        private static getBeginsWithQueryParameter(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): DynamoDB.DocumentClient.QueryInput {
            const tableName = DBComposite.getTableName();
            const partitionKeyName = DBComposite.getPartitionKeyName();
            const sortKeyName = DBComposite.getSortKeyName();
            const sortKeySeparator = DBComposite.getSortKeySeparator();
            
            if(sortKeyName === undefined) throw new Error('Sort key name is undefined for table ' + tableName + '.');

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
                    [partitionKeyName]: exclusiveStartKey.split(sortKeySeparator)[0],
                    [sortKeyName]: exclusiveStartKey.split(sortKeySeparator).splice(1).join(sortKeySeparator)
                };
            }

            return queryParams;
        }

        private static getQueryParameter(partitionKeyValue: string, exclusiveStartKey?: string): DynamoDB.DocumentClient.QueryInput {
            const tableName = DBComposite.getTableName();
            const partitionKeyName = DBComposite.getPartitionKeyName();
            const sortKeyName = DBComposite.getSortKeyName();
            const sortKeySeparator = DBComposite.getSortKeySeparator();
            if(sortKeyName === undefined) throw new Error('Sort key name is undefined for table ' + tableName + '.');

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
                    [partitionKeyName]: exclusiveStartKey.split(sortKeySeparator)[0],
                    [sortKeyName]: exclusiveStartKey.split(sortKeySeparator).splice(1).join(sortKeySeparator)
                };
            }

            return queryParams;
        }

        private static async queryRecurseNative(params: DynamoDB.DocumentClient.QueryInput, items: EntityRawModel[]): Promise<EntityRawModel[]> {
            const data = await DatabaseConfig.DynamoDBDocumentClient().query(params).promise();
                
            if(data.Items) items = items.concat(data.Items as EntityRawModel[]);
            
            if(!data.LastEvaluatedKey) return items;
            
            params.ExclusiveStartKey = data.LastEvaluatedKey;
    
            return DBComposite.queryRecurseNative(params, items);
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

    }

    return DBComposite;
}
