export type Extender<EntityModel, EntityRawModel> = (rawEntities: EntityRawModel[]) => Promise<EntityModel[]>;

export const DefaultExtender = (rawEntities: any[]): Promise<any[]> => new Promise(res => res(rawEntities));
