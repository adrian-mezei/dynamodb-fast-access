import { DynamoDB } from 'aws-sdk';
import { ListModel } from '../ListModel';
import { IDB } from './IDB';

export interface IDBComposite<EntityModel, EntityRawModel> extends IDB<EntityModel, EntityRawModel> {
    // Query
    queryRecurseRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityRawModel[]>;
    queryRecurse(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityModel[]>;
    queryBeginsWithRecurseRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityRawModel[]>;
    queryBeginsWithRecurse(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityModel[]>;
    queryBeginsWithRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>>;
    queryBeginsWith(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityModel>>;
    queryRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>>;
    query(partitionKeyValue: string, exclusiveStartKey?: string): Promise<ListModel<EntityModel>>;
    
    // Util
    combineKeys(dynamoDBKey: DynamoDB.DocumentClient.Key): string;
}
