type EntityExtender<EntityModel, EntityRawModel> = (rawEntities: EntityRawModel[]) => Promise<EntityModel[]>;
