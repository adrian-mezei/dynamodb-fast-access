import { DatabaseConfig } from '../../src/util/DatabaseConfig';
import { DBMutable } from '../../src/db/DBMutable';
import { KeyTypeEnum } from '../../src/model/ConfigModels';

// Initiate by passing the config (you can also load this from a config file)
DatabaseConfig.init({
    apiVersion: '2012-08-10',
    maxRetries: 9,
    tables: [{
        tableAlias: 'Products',
        tableName: 'Products',
        partitionKeyName: 'id',
        partitionKeyType: KeyTypeEnum.string,
    }]
});

// You can also provide models, an extender function and a deleter function (these are described in the composite example)
export class ProductsDB extends DBMutable<any, any, any>('Products') {
    // You inherit a lot of basic functions
    // You can write further DB queries here
}

/////////////////////////////////////////////////
//        _   _ ____    _    ____ _____        //
//       | | | / ___|  / \  / ___| ____|       //
//       | | | \___ \ / _ \| |  _|  _|         //
//       | |_| |___) / ___ \ |_| | |___        //
//        \___/|____/_/   \_\____|_____|       //
//                                             //
/////////////////////////////////////////////////

const item = { 
    id: 'a12', 
    name: 'coat', 
    price: 100, 
    size: '37',
    color: 'blue', 
    keyWords: ['coat'], 
    availableFromTime: '2019-09-09'
};

// Create
ProductsDB.create(item);
ProductsDB.createRaw(item);
ProductsDB.createBatch([item, {...item, id: 'ab12'}]);
ProductsDB.createBatchRaw([item, {...item, id: 'ab12'}]);

// Get
ProductsDB.getById('a12');
ProductsDB.getByIdRaw('a12');
ProductsDB.getByIds(['a12', 'ab12']);
ProductsDB.getByIdsRaw(['a12', 'ab12']);

// Scan
ProductsDB.scanFiltered({ color: 'red'});
ProductsDB.scanFiltered(undefined, { arrayName: 'keyWords', value: 'coat'});
ProductsDB.scanFiltered({ color: 'red'}, { arrayName: 'keyWords', value: 'coat'});
ProductsDB.scanFilteredRaw({ color: 'red'});
ProductsDB.scanFilteredRaw(undefined, { arrayName: 'keyWords', value: 'coat'});
ProductsDB.scanFilteredRaw({ color: 'red'}, { arrayName: 'keyWords', value: 'coat'});

// Update
ProductsDB.updateById('a12', { color: 'green', price: 110 });
ProductsDB.updateByIdWithDelete('a12', undefined, ['size']);
ProductsDB.updateByIdWithDelete('a12', { color: 'green'}, ['size']);

// Delete
ProductsDB.deleteById('a12');
ProductsDB.deleteByIds(['a12', 'ab12']);
ProductsDB.deleteScanFiltered({ color: 'red'});
ProductsDB.deleteScanFiltered(undefined, { arrayName: 'keyWords', value: 'coat'});
ProductsDB.deleteScanFiltered({ color: 'red'}, { arrayName: 'keyWords', value: 'coat'});

// Other
ProductsDB.getTableName();
ProductsDB.getPartitionKeyName();
ProductsDB.getSortKeyName();
ProductsDB.getSortKeySeparator();
