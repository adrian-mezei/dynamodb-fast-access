import * as AWS from 'aws-sdk';
import 'mocha';
import { assert } from 'chai';
import { DBMutable } from '../db/DBMutable';

AWS.config.update({region: 'eu-west-1'});
AWS.config.update({credentials: {accessKeyId: 'FakeAccessKey', secretAccessKey: 'FakeSecretAccessKey'}});

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
type ProductUpdateModel = Partial<Omit<Omit<ProductRawModel, 'id'>, 'timestamp'>>; // For example everything but the id and the timestamp

class ProductsDB extends DBMutable<ProductModel, ProductRawModel, ProductUpdateModel>('ProductsTimestamp') {}

// ######## ########  ######  ########  ######  
//    ##    ##       ##    ##    ##    ##    ## 
//    ##    ##       ##          ##    ##       
//    ##    ######    ######     ##     ######  
//    ##    ##             ##    ##          ## 
//    ##    ##       ##    ##    ##    ##    ## 
//    ##    ########  ######     ##     ######                                                           

describe('UpdateById function', () => { 
    const item = { 
        id: 'a13', 
        timestamp: 1570354849343,
        name: 'coat', 
        price: 100, 
        size: 37, 
        color: 'blue', 
        keyWords: ['coat'], 
        availableFromTime: '2019-10-09'
    };

    before('create items', async () => {
        await ProductsDB.create(item);
    });

    it('should update the item', async () => {
        await ProductsDB.updateById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp, {color: 'red'});

        const result = await ProductsDB.getById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);

        assert(result.color === 'red');
    }); 

    after('delete created items', async () => {
        await ProductsDB.deleteById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);
    });
});
