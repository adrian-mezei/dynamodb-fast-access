import { DynamoDB } from 'aws-sdk';
import { ExpressionCreator } from './ExpressionCreator';
import { DBGeneral } from './DBGeneral';
import { DatabaseConfig } from './../util/DatabaseConfig';

export function DBMutableGeneral<EntityModel, EntityRawModel, EntityUpdateModel>(
    tableName: string, 
    extend: (rawEntity: EntityRawModel[]) => Promise<EntityModel[]>,
    deleteStronglyRelateds: (rawEntities: EntityRawModel[]) => Promise<{}>) {
    
    return class DBMutableGeneral extends DBGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds) {

        public static updateEntityByID(entityID: string, updateAttributes: EntityUpdateModel): Promise<EntityUpdateModel> {
            return DBMutableGeneral.updateEntityByIDWithDelete(entityID, updateAttributes, []);
        }

        public static async updateEntityByIDWithDelete(entityID: string, updateAttributes: EntityUpdateModel, deleteAttributes: string[]): Promise<EntityUpdateModel> {
            if((!updateAttributes || Object.keys(updateAttributes).length === 0) && (!deleteAttributes || deleteAttributes.length === 0)) return {} as EntityUpdateModel;
            
            const tableName: string =  DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.name;
            const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;
            const sortKeyName: string | undefined = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.sortKeyName;

            const deleteAttributesObject: any = {};
            for(const deleteAttribute of deleteAttributes) {
                deleteAttributesObject[deleteAttribute] = '';
            }

            const updateParams: DynamoDB.DocumentClient.UpdateItemInput = {
                TableName: tableName,
                Key: { [partitionKeyName]: entityID },
                UpdateExpression: '',
                ExpressionAttributeNames: ExpressionCreator.getExpressionAttributeNames(Object.assign({}, updateAttributes, deleteAttributesObject)),
                ExpressionAttributeValues: ExpressionCreator.getExpressionAttributeValues(Object.assign({}, updateAttributes)),
                ReturnValues: 'UPDATED_NEW'
            };

            if(sortKeyName !== undefined) {
                if(entityID.indexOf(DBMutableGeneral.sortKeySeparator) < 0) throw new Error('Composite key must include ' + DBMutableGeneral.sortKeySeparator + ' that separates the keys.');
                updateParams.Key[partitionKeyName] = entityID.split(DBMutableGeneral.sortKeySeparator)[0];
                updateParams.Key[sortKeyName] = entityID.split(DBMutableGeneral.sortKeySeparator).splice(1).join(DBMutableGeneral.sortKeySeparator);
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

    };
}
