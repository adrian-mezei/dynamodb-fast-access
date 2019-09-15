import { DBCompositeGeneral } from '../db/DBCompositeGeneral';
import { DatabaseConfig } from '../util/DatabaseConfig';
import config from './config.json';

DatabaseConfig.init(config);

const tableName = 'ExampleTableName';

interface ExampleRawModel {
    id: string;
    name: string;
    age: number;
}

interface ExampleModel extends ExampleRawModel {
    eyeColor: 'blue' | 'brown' | 'green'
}

async function extender(rawItems: ExampleRawModel[]): Promise<ExampleModel[]> {
    const extendedItems: ExampleModel[] = [];
    for(const item of rawItems){
        extendedItems.push({
            ...item,
            eyeColor: 'blue'
        });
    }
    return extendedItems;
}

async function deleter(rawItems: ExampleRawModel[]): Promise<{}> {
    return Promise.all(rawItems.map( async () => {
        // Delete some related items
    }));
}

export class ExampleDB extends DBCompositeGeneral<ExampleModel, ExampleRawModel>(
    tableName,
    extender,
    deleter
) {

    public createTwice(item: ExampleModel, id1: string, id2: string) {
        const partitionKeyName: string = DatabaseConfig.DynamoDBConfig.tables.find(x => x.name === tableName)!.partitionKeyName;

        const item1 = { ...item, [partitionKeyName]: id1 };
        const item2 = { ...item, [partitionKeyName]: id2 };
        
        return ExampleDB.createEntities([item1, item2]);
    }
}

async function example() {
    const items = await ExampleDB.getEntitiesByIDRaw(['id1', 'id2']);
}
