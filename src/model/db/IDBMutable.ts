import { IDB } from './IDB';

export interface IDBMutable<EntityModel, EntityRawModel, EntityUpdateModel> extends IDB<EntityModel, EntityRawModel> {
    // Update
    updateById(id: string, updateAttributes: EntityUpdateModel): Promise<EntityUpdateModel>;
    updateByIdWithDelete(id: string, updateAttributes: EntityUpdateModel, deleteAttributes: string[]): Promise<EntityUpdateModel>;
}
