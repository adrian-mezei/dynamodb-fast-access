import { DBCompositeMutable } from '../../db/DBCompositeMutable';
import { DatabaseConfig } from '../../util/DatabaseConfig';
import { KeyTypeEnum } from '../../model/ConfigModels';

// Initiate by passing the config (you can also load this from a config file)
DatabaseConfig.init({
    apiVersion: '2012-08-10',
    maxRetries: 9,
    tables: [{
        name: 'Products',
        partitionKeyName: 'id',
        partitionKeyType: KeyTypeEnum.string,
        sortKeyName: 'timestamp',
        sortKeyType: KeyTypeEnum.number,
        sortKeySeparator: '$'
    }]
});

// Define model with the attributes that will be stored in the database
interface ProductRawModel {
    id: string;
    timestamp: number;
    name: string;
    price: number;
    size: number;
    color: string;
    keyWords: string[];
    availableFromTime: string;
}

// Create an extension model of the database model that have derived attributes
interface ProductModel extends ProductRawModel {
    discountPercent: number;
}

// Create a model of those attributes that can be updated
type ProductUpdateModel = Partial<Omit<Omit<ProductRawModel, 'id'>, 'timestamp'>>; // For example anything but the id and the timestamp

// Create the extender function that calculates the derived attribute values
async function extender(rawItems: ProductRawModel[]): Promise<ProductModel[]> {
    const extendedItems: ProductModel[] = [];
    for(const item of rawItems) {
        const daysAvailable = (new Date().valueOf() - new Date(item.availableFromTime).valueOf())/(1000*60*60*24);
        extendedItems.push({
            ...item,
            discountPercent: daysAvailable > 365 ? 20 : 0 // 20% discount if older than a year
        });
    }
    return extendedItems;
}

// Create a deleter function that is called before the item is deleted from the database
async function deleter(ids: string[]): Promise<void[]> {
    return Promise.all(ids.map( async () => {
        // Delete some related item, or a document
    }));
}

// Create your database class
export class ProductsDB extends DBCompositeMutable<ProductModel, ProductRawModel, ProductUpdateModel>(
    'Products',
    extender,
    deleter
) {

    // Define your own DB queries like this
    public createTwice(item: ProductModel, id1: string, id2: string) {
        const partitionKeyName = ProductsDB.getPartitionKeyName();

        const item1 = { ...item, [partitionKeyName]: id1 };
        const item2 = { ...item, [partitionKeyName]: id2 };
        
        return ProductsDB.createBatch([item1, item2]);
    }
}

/////////////////////////////////////////////////
//        _   _ ____    _    ____ _____        //
//       | | | / ___|  / \  / ___| ____|       //
//       | | | \___ \ / _ \| |  _|  _|         //
//       | |_| |___) / ___ \ |_| | |___        //
//        \___/|____/_/   \_\____|_____|       //
//                                             //
/////////////////////////////////////////////////

// Everything included in the simple example works here as well.
const items = [{ 
    id: 'a12', 
    timestamp: 1570354849343,
    name: 'coat', 
    price: 100, 
    size: 37, 
    color: 'blue', 
    keyWords: ['coat'], 
    availableFromTime: '2019-09-09'
},{ 
    id: 'a12', 
    timestamp: 1570354883182,
    name: 'coat', 
    price: 100, 
    size: 37, 
    color: 'blue', 
    keyWords: ['coat'], 
    availableFromTime: '2019-09-09'
}];

ProductsDB.createBatch(items);

// Query
ProductsDB.query('a12');
ProductsDB.query('a12', ProductsDB.combineKeys({ id: 'a12', timestamp: '1570354849343' }));
ProductsDB.queryRaw('a12');
ProductsDB.queryRaw('a12', ProductsDB.combineKeys({ id: 'a12', timestamp: '1570354849343' }));

// Query recurse
ProductsDB.queryRecurse('a12');
ProductsDB.queryRecurse('a12', ProductsDB.combineKeys({ id: 'a12', timestamp: '1570354849343' }));
ProductsDB.queryRecurseRaw('a12');
ProductsDB.queryRecurseRaw('a12', ProductsDB.combineKeys({ id: 'a12', timestamp: '1570354849343' }));

// Query begins with
ProductsDB.queryBeginsWith('a12', '15703548');
ProductsDB.queryBeginsWith('a12', '15703548', ProductsDB.combineKeys({ id: 'a12', timestamp: '1570354849343' }));
ProductsDB.queryBeginsWithRaw('a12', '15703548');
ProductsDB.queryBeginsWithRaw('a12', '15703548', ProductsDB.combineKeys({ id: 'a12', timestamp: '1570354849343' }));

// Query begins with recurse
ProductsDB.queryBeginsWithRecurse('a12', '15703548');
ProductsDB.queryBeginsWithRecurse('a12', '15703548', ProductsDB.combineKeys({ id: 'a12', timestamp: '1570354849343' }));
ProductsDB.queryBeginsWithRecurseRaw('a12', '15703548');
ProductsDB.queryBeginsWithRecurseRaw('a12', '15703548', ProductsDB.combineKeys({ id: 'a12', timestamp: '1570354849343' }));
