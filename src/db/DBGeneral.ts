import { DynamoDB } from 'aws-sdk';
import { ExpressionCreator } from './ExpressionCreator';
import { DatabaseConfig } from '../util/DatabaseConfig';

export function DBGeneral<EntityModel, EntityRawModel>(
    tableName: string, 
    extend: (rawEntity: EntityRawModel[]) => Promise<EntityModel[]>, 
    deleteStronglyRelateds: (rawEntities: EntityRawModel[]) => Promise<{}>) {
    
    return class DBGeneral {
        public static sortKeySeparator = '$';

        public static async getEntityByIDRaw(entityID: string, attributes?: { ConsistentRead?: boolean }): Promise<EntityRawModel> {
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;
            const sortKeyName: string | undefined = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.sortKeyName;
            
            const params: DynamoDB.DocumentClient.GetItemInput = {
                TableName: tableName,
                Key: { [partitionKeyName]: entityID }
            };
            if(attributes) {
                params.ConsistentRead = attributes.ConsistentRead;
            }

            if(sortKeyName !== undefined) {
                if(entityID.indexOf(DBGeneral.sortKeySeparator) < 0) throw new Error('Composite key must include ' + DBGeneral.sortKeySeparator + ' that separates the keys.');
                params.Key[partitionKeyName] = entityID.split(DBGeneral.sortKeySeparator)[0];
                params.Key[sortKeyName] = entityID.split(DBGeneral.sortKeySeparator).splice(1).join(DBGeneral.sortKeySeparator);
            }
            
            const entityData = await DatabaseConfig.DynamoDBDocumentClient().get(params).promise();
            if(!entityData.Item) throw new Error('Resource does not exist.');
            
            return entityData.Item as EntityRawModel;
        }

        public static async getEntitiesByIDRaw(entityIDs: string[]): Promise<EntityRawModel[]> {
            if(entityIDs.length === 0) return [];

            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;
            const sortKeyName: string | undefined = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.sortKeyName;

            const entityIDsParts: any[] = [];
            const partsSize = 100;
            for (let i=0, j=entityIDs.length; i<j; i+=partsSize) {
                entityIDsParts.push(entityIDs.slice(i,i+partsSize));
            }
            
            const dataArray = await Promise.all(entityIDsParts.map((entityIDsPart) => {
                const params: DynamoDB.BatchGetItemInput  = {
                    RequestItems: {
                        [tableName]: {
                            Keys: []
                        }
                    }
                };
                
                for(const entityID of entityIDsPart) {
                    if(sortKeyName === undefined) {
                        params.RequestItems[tableName].Keys.push({
                            [partitionKeyName]: entityID
                        }); 
                    } else {
                        if(entityID.indexOf(DBGeneral.sortKeySeparator) < 0) throw new Error('Composite key must include ' + DBGeneral.sortKeySeparator + ' that separates the keys.');
                        params.RequestItems[tableName].Keys.push({
                            [partitionKeyName]: entityID.split(DBGeneral.sortKeySeparator)[0],
                            [sortKeyName]: entityID.split(DBGeneral.sortKeySeparator).splice(1).join(DBGeneral.sortKeySeparator)
                        });
                    }
                }
                
                return DatabaseConfig.DynamoDBDocumentClient().batchGet(params).promise();
            }));

            let rawEtities: EntityRawModel[] = [];
            for(const data of dataArray) {
                rawEtities = rawEtities.concat(data.Responses![tableName] as EntityRawModel[]);
            }
            
            return rawEtities;
        }

        public static async getEntityByID(entityID: string, attributes?: { ConsistentRead?: boolean} | undefined): Promise<EntityModel> {

            const rawEntity = await DBGeneral.getEntityByIDRaw(entityID, attributes);
                
            const data = await extend([rawEntity]);
            return data[0];
        }
    
        public static async getEntitiesByID(entityIDs: string[]): Promise<EntityModel[]> {
            const rawEntities = await DBGeneral.getEntitiesByIDRaw(entityIDs);
            
            return extend(rawEntities);
        }

        public static getEntitiesFilteredRaw(matchingAttributes: Partial<EntityRawModel> | undefined, arrayContainsAttribute: { arrayName: string, value: string } | undefined): Promise<EntityRawModel[]> {
            const scanParams = DBGeneral.buildScanParams(matchingAttributes, arrayContainsAttribute);
            return DBGeneral.scan(scanParams, []);
        }

        public static async scan(params: DynamoDB.DocumentClient.ScanInput, items: EntityRawModel[]): Promise<EntityRawModel[]> {
            const data = await DatabaseConfig.DynamoDBDocumentClient().scan(params).promise();
            if(data.Items) items = items.concat(data.Items as EntityRawModel[]);
            if(!data.LastEvaluatedKey) return items;
            
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            return DBGeneral.scan(params, items); 
        }

        public static async getEntitiesFiltered(filterAttributes: undefined | object, arrayContainsAttribute: { arrayName: string, value: string } | undefined): Promise<EntityModel[]> {
            const rawEntities = await DBGeneral.getEntitiesFilteredRaw(filterAttributes, arrayContainsAttribute);

            return extend(rawEntities);
        }

        public static async deleteEntityByID(entityID: string): Promise<{}> {
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;
            const sortKeyName: string | undefined = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.sortKeyName;

            const params: DynamoDB.DocumentClient.DeleteItemInput = {
                TableName: tableName,
                Key: {[partitionKeyName]: entityID}
            };

            if(sortKeyName !== undefined) {
                if(entityID.indexOf(DBGeneral.sortKeySeparator) < 0) throw new Error('Composite key must include ' + DBGeneral.sortKeySeparator + ' that separates the keys.');
                params.Key[partitionKeyName] = entityID.split(DBGeneral.sortKeySeparator)[0];
                params.Key[sortKeyName] = entityID.split(DBGeneral.sortKeySeparator).splice(1).join(DBGeneral.sortKeySeparator);
            }

            await DatabaseConfig.DynamoDBDocumentClient().delete(params).promise().catch((err: Error) => {
                if(err.name !== 'ResourceNotFoundException') throw err;
                else return {};
            });

            return {};
        }

        public static async deleteEntitiesByID(entityIDs: string[] | undefined): Promise<{}> {
            if(!entityIDs || entityIDs.length === 0) return {};
            
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;
            const sortKeyName: string | undefined = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.sortKeyName;

            const entityIDsPartsArray: any[] = [];
            const partsSize = 25;
            for (let i=0, j=entityIDs.length; i<j; i+=partsSize) {
                entityIDsPartsArray.push(entityIDs.slice(i,i+partsSize));
            }

            for(const entityIDsParts of entityIDsPartsArray) {
                const batchWriteParams: DynamoDB.BatchWriteItemInput = {
                    RequestItems: {
                        [tableName]: []
                    }
                };

                for(const entityIDsPart of entityIDsParts) {
                    batchWriteParams.RequestItems[tableName].push({
                        DeleteRequest: {
                            Key: sortKeyName === undefined ? 
                                {[partitionKeyName]: entityIDsPart} : 
                                {
                                    [partitionKeyName]: entityIDsPart.split(DBGeneral.sortKeySeparator)[0],
                                    [sortKeyName]: entityIDsPart.split(DBGeneral.sortKeySeparator).splice(1).join(DBGeneral.sortKeySeparator)
                                }
                        }
                    });
                }

                await DBGeneral.batchWriteWithRetry(batchWriteParams, 0);
            }

            return {};
        }

        public static async deleteEntitiesWithStronglyRelatedsFiltered(matchingAttributes: Partial<EntityRawModel> | undefined, arrayContainsAttribute?: { arrayName: string, value: string } | undefined ): Promise<{}> {
            const scanParams = DBGeneral.buildScanParams(matchingAttributes, arrayContainsAttribute);
            return DBGeneral.scanDeleteWithStronglyRelateds(scanParams);
        }

        public static buildScanParams(matchingAttributes: Partial<EntityRawModel> | undefined, arrayContainsAttribute?: { arrayName: string, value: string } | undefined): DynamoDB.DocumentClient.ScanInput {
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            
            let FilterExpression = '';
            let ExpressionAttributeNames: any = {};
            let ExpressionAttributeValues: any = {};

            if(matchingAttributes) {
                FilterExpression = ExpressionCreator.getFilterExpression(matchingAttributes as any);
                ExpressionAttributeNames = ExpressionCreator.getExpressionAttributeNames(matchingAttributes);
                ExpressionAttributeValues = ExpressionCreator.getExpressionAttributeValues(matchingAttributes);
            }

            if(arrayContainsAttribute && arrayContainsAttribute.arrayName && arrayContainsAttribute.value) {
                FilterExpression += ' contains(#' + arrayContainsAttribute.arrayName + ', :attributeValue)';
                ExpressionAttributeNames['#' + arrayContainsAttribute.arrayName] = arrayContainsAttribute.arrayName;
                ExpressionAttributeValues[':attributeValue'] = arrayContainsAttribute.value;
            }

            const params: DynamoDB.DocumentClient.ScanInput = {
                TableName: tableName
            };
            if(FilterExpression !== '') params.FilterExpression = FilterExpression;
            if(Object.keys(ExpressionAttributeNames).length > 0) params.ExpressionAttributeNames = ExpressionAttributeNames;
            if(Object.keys(ExpressionAttributeValues).length > 0) params.ExpressionAttributeValues = ExpressionAttributeValues;

            return params;
        }

        public static async scanDeleteWithStronglyRelateds(params: DynamoDB.DocumentClient.ScanInput): Promise<{}> {
            const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;
            const sortKeyName: string | undefined = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.sortKeyName;

            const data = await DatabaseConfig.DynamoDBDocumentClient().scan(params).promise();

            if(data.Items) {
                const rawEntities = data.Items as EntityRawModel[];

                await Promise.all(rawEntities.map(async (rawEntity) => {
                    await Promise.all([
                        deleteStronglyRelateds([rawEntity]),
                        DBGeneral.deleteEntityByID(sortKeyName === undefined ? 
                            (rawEntity as any)[partitionKeyName] :
                            (rawEntity as any)[partitionKeyName] + DBGeneral.sortKeySeparator + (rawEntity as any)[sortKeyName])
                    ]);
                }));
            }
            if(!data.LastEvaluatedKey) return {};

            params.ExclusiveStartKey = data.LastEvaluatedKey;
            return DBGeneral.scanDeleteWithStronglyRelateds(params);
        }

        public static async createRawEntity(entity: EntityRawModel): Promise<EntityRawModel> {
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;

            const attributeMap: DynamoDB.DocumentClient.PutItemInputAttributeMap = entity;

            const params: DynamoDB.DocumentClient.PutItemInput = {
                TableName: tableName,
                Item: attributeMap
            };
    
            await DatabaseConfig.DynamoDBDocumentClient().put(params).promise();
            return attributeMap as EntityRawModel;
        }

        public static async createEntity(entity: EntityRawModel): Promise<EntityModel> {
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;

            const attributeMap: DynamoDB.DocumentClient.PutItemInputAttributeMap = entity;

            const params: DynamoDB.DocumentClient.PutItemInput = {
                TableName: tableName,
                Item: attributeMap
            };
    
            await DatabaseConfig.DynamoDBDocumentClient().put(params).promise();
            const extended = await extend([attributeMap as EntityRawModel]);
            return extended[0] as EntityModel;
        }

        public static async createEntities(entities: EntityRawModel[]): Promise<EntityRawModel[]> {
            const putRequests = [];
            for(const entity of entities) {
                putRequests.push({
                    PutRequest: {
                        Item: entity
                    }
                });
            }

            const putRequestParts: any[] = [];
            const partsSize = 25;
            for (let i=0, j=putRequests.length; i<j; i+=partsSize) {
                putRequestParts.push(putRequests.slice(i,i+partsSize));
            }
            
            const tableName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            
            for(const putRequestPart of putRequestParts) {
                const batchWriteParams: DynamoDB.BatchWriteItemInput = {
                    RequestItems: {
                        [tableName]: putRequestPart as any
                    }
                };
                await DBGeneral.batchWriteWithRetry(batchWriteParams, 0);
            }
            return entities as any;
        }

        /*
        *   @params: The parameter for the batchWrite operation.
        *   @retry: This should be 0 when called first, this will be incremented in the recursion.
        */
       public static async batchWriteWithRetry(params: DynamoDB.BatchWriteItemInput, retry: number): Promise<{}> {
            console.log('Retry: ' + retry);
            const data = await DatabaseConfig.DynamoDBDocumentClient().batchWrite(params).promise();
            if(retry > DatabaseConfig.DynamoDBConfig.maxRetries) throw new Error('Maximum number of batch write retries exceeded.');

            if(data.UnprocessedItems && Object.keys(data.UnprocessedItems).length > 0) {
                const waitTimeout = Math.pow(2, retry) * 50 * Math.random();
                params.RequestItems = data.UnprocessedItems;
                await new Promise(res => setTimeout(res, waitTimeout) );
                await DBGeneral.batchWriteWithRetry(params, retry + 1);
            }

            return {};
        }

    };
}
