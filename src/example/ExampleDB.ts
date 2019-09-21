import { DatabaseConfig } from '../util/DatabaseConfig';
import config from './config.json';
import { DBCompositeMutable } from '../db/DBCompositeMutable';

// Initiate by passing the config file
DatabaseConfig.init(config);

// Define model with the attributes that will be stored in the database
interface ExampleRawModel {
    id: string;
    name: string;
    age: number;
}

// Create an extension model of the database model that contains derived attributes
interface ExampleModel extends ExampleRawModel {
    eyeColor: 'blue' | 'brown' | 'green';
}

// Create a model of those attributes that can be updated (for example one with everything but the id)
type ExampleUpdateModel = Omit<ExampleRawModel, 'id'>;

// Create the extender function that calculates the derived attribute values
async function extender(rawItems: ExampleRawModel[]): Promise<ExampleModel[]> {
    const extendedItems: ExampleModel[] = [];
    for(const item of rawItems) {
        extendedItems.push({
            ...item,
            eyeColor: 'blue'
        });
    }
    return extendedItems;
}

// Create a deleter function that is called before the item is deleted from the database
async function deleter(ids: string[]): Promise<{}> {
    return Promise.all(ids.map( async () => {
        // Delete some related items
    }));
}

export class ExampleDB extends DBCompositeMutable<ExampleModel, ExampleRawModel, ExampleUpdateModel>(
    'ExampleTableName',
    extender,
    deleter
) {

    public createTwice(item: ExampleModel, id1: string, id2: string) {
        const partitionKeyName = ExampleDB.getPartitionKeyName();

        const item1 = { ...item, [partitionKeyName]: id1 };
        const item2 = { ...item, [partitionKeyName]: id2 };
        
        return ExampleDB.createBatch([item1, item2]);
    }
}

async function example() {
    const items = await ExampleDB.query('a');
}
