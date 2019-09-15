interface EntityExtender<RawEntityType, EntityType> {
    extend(rawEntities: RawEntityType[]): Promise<EntityType[]>;
}
