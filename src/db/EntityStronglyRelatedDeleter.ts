interface EntityStronglyRelatedsDeleter<RawEntityType> {
    deleteStronglyRelateds(rawEntities: RawEntityType[]): Promise<{}>;
}
