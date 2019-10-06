import { DBComposite } from './DBComposite';
import { DB } from './DB';
import { DBMutable } from './DBMutable';
import { ListModel } from '../model/ListModel';
import { DynamoDB } from 'aws-sdk';
import { EntityExtender, DefaultEntityExtender } from './EntityExtender';
import { DefaultEntityRelatedDeleter, EntityRelatedDeleter } from './EntityRelatedDeleter';

export function DBCompositeMutable<EntityModel, EntityRawModel, EntityUpdateModel>(
    tableName: string, 
    extend: EntityExtender<EntityModel, EntityRawModel> = DefaultEntityExtender, 
    deleteRelated: EntityRelatedDeleter = DefaultEntityRelatedDeleter) {
    
        return class DBCompositeMutable extends DB<EntityModel, EntityRawModel>(tableName, extend, deleteRelated) {
            // Mutable extension
            public static updateById(id: string, updateAttributes: EntityUpdateModel): Promise<EntityUpdateModel> {
                return DBMutable<EntityModel, EntityRawModel, EntityUpdateModel>(tableName, extend, deleteRelated).updateById(id, updateAttributes); 
            }
            public static async updateByIdWithDelete(id: string, updateAttributes: EntityUpdateModel, deleteAttributes: string[]): Promise<EntityUpdateModel> {
                return DBMutable<EntityModel, EntityRawModel, EntityUpdateModel>(tableName, extend, deleteRelated).updateByIdWithDelete(id, updateAttributes, deleteAttributes);
            }

            // Composite extension
            public static queryRecurseRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityRawModel[]> {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).queryRecurseRaw(partitionKeyValue, exclusiveStartKey);
            }
            public static queryRecurse(partitionKeyValue: string, exclusiveStartKey?: string): Promise<EntityModel[]> {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).queryRecurse(partitionKeyValue, exclusiveStartKey);
            }
            public static queryBeginsWithRecurseRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityRawModel[]> {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).queryBeginsWithRecurseRaw(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            }
            public static queryBeginsWithRecurse(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<EntityModel[]> {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).queryBeginsWithRecurse(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            }
            public static queryBeginsWithRaw(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>> {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).queryBeginsWithRaw(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            }
            public static queryBeginsWith(partitionKeyValue: string, sortKeyBeginsWithValue?: string, exclusiveStartKey?: string): Promise<ListModel<EntityModel>> {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).queryBeginsWith(partitionKeyValue, sortKeyBeginsWithValue, exclusiveStartKey);
            }
            public static queryRaw(partitionKeyValue: string, exclusiveStartKey?: string): Promise<ListModel<EntityRawModel>> {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).queryRaw(partitionKeyValue, exclusiveStartKey);
            }
            public static query(partitionKeyValue: string, exclusiveStartKey?: string): Promise<ListModel<EntityModel>> {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).query(partitionKeyValue, exclusiveStartKey);
            }
            public static combineKeys(dynamoDBKey: DynamoDB.DocumentClient.Key): string {
                return DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated).combineKeys(dynamoDBKey);
            }
        };
}
