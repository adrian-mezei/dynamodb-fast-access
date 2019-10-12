import * as AWS from 'aws-sdk';
import 'mocha';
import { assert } from 'chai';
import { DB } from '../db/DB';

AWS.config.update({region: 'eu-west-1'});
AWS.config.update({credentials: {accessKeyId: 'FakeAccessKey', secretAccessKey: 'FakeSecretAccessKey'}});

const dynamoConfig = {
    apiVersion: '2012-08-10',
    region: 'local',
    endpoint: 'http://localhost:3000'
};
const DynamoDB = new AWS.DynamoDB(dynamoConfig);

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
interface ProductModel extends ProductRawModel {
    discountPercent: number;
}
class ProductsDB extends DB<ProductModel, ProductRawModel>('ProductsTimestamp') {}

// ######## ########  ######  ########  ######  
//    ##    ##       ##    ##    ##    ##    ## 
//    ##    ##       ##          ##    ##       
//    ##    ######    ######     ##     ######  
//    ##    ##             ##    ##          ## 
//    ##    ##       ##    ##    ##    ##    ## 
//    ##    ########  ######     ##     ######  

describe('Create function', () => { 
    const item = { 
        id: 'a12', 
        timestamp: 1570354849343,
        name: 'coat', 
        price: 100, 
        size: 37, 
        color: 'blue', 
        keyWords: ['coat'], 
        availableFromTime: '2019-09-09'
    };

    it('should create a new item in the database', async () => {
        await ProductsDB.create(item);

        const result = await DynamoDB.getItem({
            TableName: ProductsDB.getTableName(), 
            Key: {
                id: { S: item.id},
                timestamp: { N: item.timestamp + ''}
            }
        }).promise();

        assert(result!.Item!.id.S === item.id);
    }); 

    after('delete created item', async () => {
        await DynamoDB.deleteItem({
            TableName: ProductsDB.getTableName(), 
            Key: {
                id: { S: item.id },
                timestamp: { N: item.timestamp + ''}
            }
        }).promise();
    });
});

describe('DeleteById function', () => { 
    const item = { 
        id: 'a12', 
        timestamp: 1570354849343,
        name: 'coat', 
        price: 100, 
        size: 37, 
        color: 'blue', 
        keyWords: ['coat'], 
        availableFromTime: '2019-09-09'
    };

    before('create an item', async () => {
        await ProductsDB.create(item);
    });

    it('should delete an item from the database', async () => {
        await ProductsDB.deleteById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);

        const result = await DynamoDB.getItem({
            TableName: ProductsDB.getTableName(), 
            Key: {
                id: { S: item.id},
                timestamp: { N: item.timestamp + ''}
            }
        }).promise();

        assert(result.Item === undefined);
    }); 
});

describe('GetById function', () => { 
    const item = { 
        id: 'a12', 
        timestamp: 1570354849343,
        name: 'coat', 
        price: 100, 
        size: 37, 
        color: 'blue', 
        keyWords: ['coat'], 
        availableFromTime: '2019-09-09'
    };

    before('create an item', async () => {
        await ProductsDB.create(item);
    });

    it('should return an existing item', async () => {
        const result = await ProductsDB.getById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);
        
        assert(result.id === item.id);
    }); 

    after('delete created item', async () => {
        await ProductsDB.deleteById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);
    });
});

describe('CreateBatch function', () => { 
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
        id: 'a13', 
        timestamp: 1570354849343,
        name: 'coat', 
        price: 100, 
        size: 37, 
        color: 'blue', 
        keyWords: ['coat'], 
        availableFromTime: '2019-09-09'
    }];

    it('should create all items', async () => {
        await ProductsDB.createBatch(items);

        const result1 = await ProductsDB.getById(items[0].id + ProductsDB.getSortKeySeparator() + items[0].timestamp);
        const result2 = await ProductsDB.getById(items[1].id + ProductsDB.getSortKeySeparator() + items[1].timestamp);

        assert(result1.id === items[0].id);
        assert(result2.id === items[1].id);
    }); 

    after('delete created items', async () => {
        await ProductsDB.deleteById(items[0].id + ProductsDB.getSortKeySeparator() + items[0].timestamp);
        await ProductsDB.deleteById(items[1].id + ProductsDB.getSortKeySeparator() + items[1].timestamp);
    });
});

describe('DeleteByIds function', () => { 
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
        id: 'a13', 
        timestamp: 1570354849343,
        name: 'coat', 
        price: 100, 
        size: 37, 
        color: 'blue', 
        keyWords: ['coat'], 
        availableFromTime: '2019-09-09'
    }];

    before('create items', async () => {
        await ProductsDB.createBatch(items);
    });

    it('should delete all items', async () => {
        await ProductsDB.deleteByIds(items.map(x => x.id + ProductsDB.getSortKeySeparator() + x.timestamp));

        await ProductsDB.getById(items[0].id + ProductsDB.getSortKeySeparator() + items[0].timestamp).catch(e => {
            assert(e.message === 'Resource does not exist.');
        });
        
        await ProductsDB.getById(items[1].id + ProductsDB.getSortKeySeparator() + items[1].timestamp).catch(e => {
            assert(e.message === 'Resource does not exist.');
        });
    });
});

describe('GetByIds function', () => { 
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
        id: 'a13', 
        timestamp: 1570354849343,
        name: 'coat', 
        price: 100, 
        size: 37, 
        color: 'blue', 
        keyWords: ['coat'], 
        availableFromTime: '2019-09-09'
    }];

    before('create items', async () => {
        await ProductsDB.createBatch(items);
    });

    it('should return all items by the provided ids', async () => {
        const results = await ProductsDB.getByIds(items.map(x => x.id + ProductsDB.getSortKeySeparator() + x.timestamp));

        assert(results[0].id === items[0].id);
        assert(results[1].id === items[1].id);
    }); 

    after('delete created items', async () => {
        await ProductsDB.deleteByIds(items.map(x => x.id + ProductsDB.getSortKeySeparator() + x.timestamp));
    });
});
