import { DynamoDB } from 'aws-sdk';
import { ExpressionCreator } from './ExpressionCreator';
import { DB } from './DB';
import { DatabaseConfig } from '../util/DatabaseConfig';
import { IDBMutable } from '../model/db/IDBMutable';
import { StaticImplements } from '../util/StaticImplements';

export function DBMutable<EntityModel, EntityRawModel, EntityUpdateModel>(
    tableName: string, 
    extend: EntityExtender<EntityModel, EntityRawModel>, 
    deleteRelated: EntityRelatedDeleter) {
       
    @StaticImplements<IDBMutable<EntityModel, EntityRawModel, EntityUpdateModel>>()
    class DBMutable extends DB<EntityModel, EntityRawModel>(tableName, extend, deleteRelated) {
        public static updateById(id: string, updateAttributes: EntityUpdateModel): Promise<EntityUpdateModel> {
            return DBMutable.updateByIdWithDelete(id, updateAttributes, []);
        }

        public static async updateByIdWithDelete(id: string, updateAttributes: EntityUpdateModel, deleteAttributes: string[]): Promise<EntityUpdateModel> {
            if((!updateAttributes || Object.keys(updateAttributes).length === 0) && (!deleteAttributes || deleteAttributes.length === 0)) return {} as EntityUpdateModel;
            
            const tableName = DBMutable.getTableName();
            const partitionKeyName = DBMutable.getPartitionKeyName();
            const sortKeyName = DBMutable.getSortKeyName();
            const sortKeySeparator = DBMutable.getSortKeySeparator();
            
            const deleteAttributesObject: any = {};
            for(const deleteAttribute of deleteAttributes) {
                deleteAttributesObject[deleteAttribute] = '';
            }

            const updateParams: DynamoDB.DocumentClient.UpdateItemInput = {
                TableName: tableName,
                Key: { [partitionKeyName]: id },
                UpdateExpression: '',
                ExpressionAttributeNames: ExpressionCreator.getExpressionAttributeNames(Object.assign({}, updateAttributes, deleteAttributesObject)),
                ExpressionAttributeValues: ExpressionCreator.getExpressionAttributeValues(Object.assign({}, updateAttributes)),
                ReturnValues: 'UPDATED_NEW'
            };

            if(sortKeyName !== undefined) {
                if(id.indexOf(sortKeySeparator) < 0) throw new Error('Composite key must include ' + sortKeySeparator + ' that separates the keys.');
                updateParams.Key[partitionKeyName] = id.split(sortKeySeparator)[0];
                updateParams.Key[sortKeyName] = id.split(sortKeySeparator).splice(1).join(sortKeySeparator);
            }

            if(updateAttributes && Object.keys(updateAttributes).length >= 0) {
                updateParams.UpdateExpression += 'SET ' + ExpressionCreator.getUpdateExpression(Object.assign({}, updateAttributes));
            }

            if(deleteAttributes && deleteAttributes.length > 0) {
                updateParams.UpdateExpression += ' REMOVE ' + ExpressionCreator.getUpdateExpressionRemove(deleteAttributes);
            }

            const entityData = await DatabaseConfig.DynamoDBDocumentClient().update(updateParams).promise();
            if(!entityData.Attributes) return {} as EntityUpdateModel;
            
            return entityData.Attributes as EntityUpdateModel;   

        }

    }

    return DBMutable;
}
