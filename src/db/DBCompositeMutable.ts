import { DBComposite } from './DBComposite';
import { DBMutable } from './DBMutable';
import { EntityExtender, DefaultEntityExtender } from './EntityExtender';
import { DefaultEntityRelatedDeleter, EntityRelatedDeleter } from './EntityRelatedDeleter';

export function DBCompositeMutable<EntityModel, EntityRawModel, EntityUpdateModel>(
    tableName: string, 
    extend: EntityExtender<EntityModel, EntityRawModel> = DefaultEntityExtender, 
    deleteRelated: EntityRelatedDeleter = DefaultEntityRelatedDeleter) {
    
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
