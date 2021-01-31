import { DynamoDB } from 'aws-sdk';
import { ExpressionCreator } from './ExpressionCreator';
import { DB } from './DB';
import { DatabaseConfig } from '../util/DatabaseConfig';
import { Extender, DefaultExtender } from './Extender';
import { RelatedDeleter, DefaultRelatedDeleter } from './RelatedDeleter';
import { DynamoDBFastAccessError } from '../util/DynamoDBFastAccessError';

export function DBMutable<EntityModel, EntityRawModel, EntityUpdateModel>(
    tableName: string,
    extend: Extender<EntityModel, EntityRawModel> = DefaultExtender,
    deleteRelated: RelatedDeleter = DefaultRelatedDeleter,
) {
    return class DBMutable extends DB<EntityModel, EntityRawModel>(tableName, extend, deleteRelated) {
        /**
         * Updates the provided attributes of the object with the provided id.
         * @param id The id of the object to update.
         * @param updateAttributes The attributes of the object to update.
         */
        public static updateById(id: string, updateAttributes: EntityUpdateModel): Promise<EntityUpdateModel> {
            return DBMutable.updateByIdWithDelete(id, updateAttributes, []);
        }

        public static async updateByIdWithDelete(
            id: string,
            updateAttributes: EntityUpdateModel,
            deleteAttributes: string[],
        ): Promise<EntityUpdateModel> {
            if (
                (!updateAttributes || Object.keys(updateAttributes).length === 0) &&
                (!deleteAttributes || deleteAttributes.length === 0)
            ) {
                return {} as EntityUpdateModel;
            }

            const tableName = DBMutable.getTableName();
            const partitionKeyName = DBMutable.getPartitionKeyName();
            const sortKeyName = DBMutable.getSortKeyName();
            const sortKeySeparator = DBMutable.getSortKeySeparator();

            const deleteAttributesObject: any = {};
            for (const deleteAttribute of deleteAttributes) {
                deleteAttributesObject[deleteAttribute] = '';
            }

            const updateParams: DynamoDB.DocumentClient.UpdateItemInput = {
                TableName: tableName,
                Key: {},
                UpdateExpression: '',
                ReturnValues: 'UPDATED_NEW',
            };

            const ExpressionAttributeNames = ExpressionCreator.getExpressionAttributeNames(
                Object.assign({}, updateAttributes, deleteAttributesObject),
            );
            const ExpressionAttributeValues = ExpressionCreator.getExpressionAttributeValues(
                Object.assign({}, updateAttributes),
            );

            if (Object.keys(ExpressionAttributeNames).length > 0) {
                updateParams.ExpressionAttributeNames = ExpressionAttributeNames;
            }
            if (Object.keys(ExpressionAttributeValues).length > 0) {
                updateParams.ExpressionAttributeValues = ExpressionAttributeValues;
            }
            if (sortKeyName === undefined) {
                updateParams.Key[partitionKeyName] = id;
            } else {
                if (id.indexOf(sortKeySeparator) < 0) {
                    throw new DynamoDBFastAccessError(
                        'Composite key must include ' + sortKeySeparator + ' that separates the keys.',
                    );
                }
                updateParams.Key[partitionKeyName] = DBMutable._castKey(id).partitionKey;
                updateParams.Key[sortKeyName] = DBMutable._castKey(id).sortKey;
            }

            if (updateAttributes && Object.keys(updateAttributes).length > 0) {
                updateParams.UpdateExpression +=
                    'SET ' + ExpressionCreator.getUpdateExpression(Object.assign({}, updateAttributes));
            }

            if (deleteAttributes && deleteAttributes.length > 0) {
                updateParams.UpdateExpression +=
                    ' REMOVE ' + ExpressionCreator.getUpdateExpressionRemove(deleteAttributes);
            }

            const entityData = await DatabaseConfig.DynamoDBDocumentClient().update(updateParams).promise();
            if (!entityData.Attributes) return {} as EntityUpdateModel;

            return entityData.Attributes as EntityUpdateModel;
        }
    };
}
