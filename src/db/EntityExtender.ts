type EntityExtender<EntityModel, EntityRawModel> = (rawEntities: EntityRawModel[]) => Promise<EntityModel[]>;

const DefaultEntityExtender = (x: any[]): Promise<any> => new Promise(res => res(x));

export { EntityExtender, DefaultEntityExtender };
