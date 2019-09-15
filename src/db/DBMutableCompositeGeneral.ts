import { DBCompositeGeneral } from './DBCompositeGeneral';
import { DBGeneral } from './DBGeneral';
import { DBMutableGeneral } from './DBMutableGeneral';

export function DBMutableCompositeGeneral<EntityModel, EntityRawModel, EntityUpdateModel>(
    tableName: string, 
    extend: (rawEntity: EntityRawModel[]) => Promise<EntityModel[]>,
    deleteStronglyRelateds: (rawEntities: EntityRawModel[]) => Promise<{}>) {
    
    return class extends DBGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds) {

        public static updateEntityByID = DBMutableGeneral<EntityModel, EntityRawModel, EntityUpdateModel>(tableName, extend, deleteStronglyRelateds).updateEntityByID;
        public static updateEntityByIDWithDelete = DBMutableGeneral<EntityModel, EntityRawModel, EntityUpdateModel>(tableName, extend, deleteStronglyRelateds).updateEntityByIDWithDelete;

        public static queryEntitiesBeginsWithRecurse = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryEntitiesBeginsWithRecurse;
        public static queryEntitiesRecurse = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryEntitiesRecurse;
        public static queryEntitiesBeginsWithRecurseRaw = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryEntitiesBeginsWithRecurseRaw;
        public static queryEntitiesRecurseRaw = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryEntitiesRecurseRaw;
        public static queryEntitiesBeginsWith = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryEntitiesBeginsWith;
        public static queryEntities = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryEntities;
        public static queryEntitiesBeginsWithRaw = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryEntitiesBeginsWithRaw;
        public static queryEntitiesRaw = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryEntitiesRaw;

        public static queryRecurse = DBCompositeGeneral<EntityModel, EntityRawModel>(tableName, extend, deleteStronglyRelateds).queryRecurse;
    };
}
