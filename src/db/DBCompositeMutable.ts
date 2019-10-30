import { DBComposite } from './DBComposite';
import { DBMutable } from './DBMutable';
import { Extender, DefaultExtender } from './Extender';
import { DefaultRelatedDeleter, RelatedDeleter } from './RelatedDeleter';

export function DBCompositeMutable<EntityModel, EntityRawModel, EntityUpdateModel>(
    tableName: string, 
    extend: Extender<EntityModel, EntityRawModel> = DefaultExtender, 
    deleteRelated: RelatedDeleter = DefaultRelatedDeleter) {
    
        return class DBCompositeMutable extends DBComposite<EntityModel, EntityRawModel>(tableName, extend, deleteRelated) {
            // Mutable extension
            public static updateById(id: string, updateAttributes: EntityUpdateModel): Promise<EntityUpdateModel> {
                return DBMutable<EntityModel, EntityRawModel, EntityUpdateModel>(tableName, extend, deleteRelated).updateById(id, updateAttributes); 
            }
            public static async updateByIdWithDelete(id: string, updateAttributes: EntityUpdateModel, deleteAttributes: string[]): Promise<EntityUpdateModel> {
                return DBMutable<EntityModel, EntityRawModel, EntityUpdateModel>(tableName, extend, deleteRelated).updateByIdWithDelete(id, updateAttributes, deleteAttributes);
            }
        };
}
