import { DynamoDB } from 'aws-sdk';
import { DBGeneral } from './DBGeneral';
import { ListModel } from './../model/ListModel';
import { DatabaseConfig } from '../util/DatabaseConfig';

export function DBCompositeGeneral<EntityModel, EntityRawModel>(
    tableName: string, 
    extend: (rawEntity: EntityRawModel[]) => Promise<EntityModel[]>, 
    deleteStronglyRelateds: (rawEntities: EntityRawModel[]) => Promise<{}>) {
    
    return class DBCompositeGeneral extends DBGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds) {

        public static async queryEntitiesBeginsWithRecurse(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityModel[]> {
            const rawEntities = await DBCompositeGeneral.queryEntitiesBeginsWithRecurseRaw(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            return extend(rawEntities);
        }

        public static async queryEntitiesBeginsWithRecurseRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityRawModel[]> {
            const queryParams = DBCompositeGeneral.getBeginsWithQueryParameter(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            return DBCompositeGeneral.queryRecurse(queryParams, []);
        }

        public static async queryEntitiesRecurse(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityModel[]> {
            const rawEntities = await DBCompositeGeneral.queryEntitiesRecurseRaw(partitionKeyValue, exclusiveStartKey);
            return extend(rawEntities);
        }

        public static async queryEntitiesRecurseRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityRawModel[]> {
            const queryParams = DBCompositeGeneral.getQueryParameter(partitionKeyValue, exclusiveStartKey);
            return DBCompositeGeneral.queryRecurse(queryParams, []);
        }

        public static async queryEntitiesBeginsWith(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityModel>> {
            const queryParams = DBCompositeGeneral.getBeginsWithQueryParameter(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            
            const data = await DatabaseConfig.DynamoDBDocumentClient().query(queryParams).promise();

            return {
                items: data.Items ? await extend(data.Items as EntityRawModel[]) : [],
                lastEvaluatedKey: data.LastEvaluatedKey // TODO concatenate keys to a single string
            } as unknown as ListModel<EntityModel>;
        }

        public static async queryEntities(partitionKeyValue: string, exclusiveStartKey?: string): Promise<ListModel<EntityModel>> {
            const queryParams = DBCompositeGeneral.getQueryParameter(partitionKeyValue, exclusiveStartKey);
            
            const data = await DatabaseConfig.DynamoDBDocumentClient().query(queryParams).promise();

            return {
                items: data.Items ? await extend(data.Items as EntityRawModel[]) : [],
                lastEvaluatedKey: data.LastEvaluatedKey // TODO concatenate keys to a single string
            } as unknown as ListModel<EntityModel>;
        }

        public static async queryEntitiesBeginsWithRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>> {
            const queryParams = DBCompositeGeneral.getBeginsWithQueryParameter(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            
            const data = await DatabaseConfig.DynamoDBDocumentClient().query(queryParams).promise();

            return {
                items: data.Items ? data.Items as EntityRawModel[] : [],
                lastEvaluatedKey: data.LastEvaluatedKey // TODO concatenate keys to a single string
            } as unknown as ListModel<EntityRawModel>;
        }

        public static async queryEntitiesRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>> {
            const queryParams = DBCompositeGeneral.getBeginsWithQueryParameter(partitionKeyValue, exclusiveStartKey);
            
            const data = await DatabaseConfig.DynamoDBDocumentClient().query(queryParams).promise();

            return {
                items: data.Items ? data.Items as EntityRawModel[] : [],
                lastEvaluatedKey: data.LastEvaluatedKey // TODO concatenate keys to a single string
            } as unknown as ListModel<EntityRawModel>;
        }

        public static getBeginsWithQueryParameter(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): DynamoDB.DocumentClient.QueryInput {
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;
            const sortKeyName: string | undefined = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.sortKeyName;
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
                    [partitionKeyName]: exclusiveStartKey.split(DBCompositeGeneral.sortKeySeparator)[0],
                    [sortKeyName]: exclusiveStartKey.split(DBCompositeGeneral.sortKeySeparator).splice(1).join(DBCompositeGeneral.sortKeySeparator)
                };
            }

            return queryParams;
        }

        public static getQueryParameter(partitionKeyValue: string, exclusiveStartKey?: string): DynamoDB.DocumentClient.QueryInput {
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;
            const sortKeyName: string | undefined = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.sortKeyName;
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
                    [partitionKeyName]: exclusiveStartKey.split(DBCompositeGeneral.sortKeySeparator)[0],
                    [sortKeyName]: exclusiveStartKey.split(DBCompositeGeneral.sortKeySeparator).splice(1).join(DBCompositeGeneral.sortKeySeparator)
                };
            }

            return queryParams;
        }

        public static async queryRecurse(params: DynamoDB.DocumentClient.QueryInput, items: EntityRawModel[]): Promise<EntityRawModel[]> {
            const data = await DatabaseConfig.DynamoDBDocumentClient().query(params).promise();
                
            if(data.Items) items = items.concat(data.Items as EntityRawModel[]);
            
            if(!data.LastEvaluatedKey) return items;
            
            params.ExclusiveStartKey = data.LastEvaluatedKey;
    
            return DBCompositeGeneral.queryRecurse(params, items);
        }

    };
}
