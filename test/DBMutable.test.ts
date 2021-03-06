import * as AWS from 'aws-sdk';
import 'mocha';
import { assert } from 'chai';
import { DBMutable } from '../src/db/DBMutable';

AWS.config.update({ region: 'eu-west-1' });
AWS.config.update({ credentials: { accessKeyId: 'FakeAccessKey', secretAccessKey: 'FakeSecretAccessKey' } });

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
        availableFromTime: '2019-10-09',
    };

    before('create items', async () => {
        await ProductsDB.create(item);
    });

    it('should update the item', async () => {
        await ProductsDB.updateById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp, { color: 'red' });

        const result = await ProductsDB.getById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);

        assert(result.color === 'red');
    });

    after('delete created items', async () => {
        await ProductsDB.deleteById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);
    });
});

describe('updateByIdWithDelete function', () => {
    const item = {
        id: 'a13',
        timestamp: 1570354849343,
        name: 'coat',
        price: 100,
        size: 37,
        color: 'blue',
        keyWords: ['coat'],
        availableFromTime: '2019-10-09',
    };

    before('create items', async () => {
        await ProductsDB.create(item);
    });

    it('should update and delete at the same time', async () => {
        await ProductsDB.updateByIdWithDelete(
            item.id + ProductsDB.getSortKeySeparator() + item.timestamp,
            { color: 'red' },
            ['size'],
        );

        const result = await ProductsDB.getById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);

        assert(result.color === 'red');
        assert(result.size === undefined);
    });

    it('should delete if no update attribute is provided', async () => {
        await ProductsDB.updateByIdWithDelete(item.id + ProductsDB.getSortKeySeparator() + item.timestamp, {}, [
            'color',
        ]);

        const result = await ProductsDB.getById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);

        assert(result.color === undefined);
    });

    after('delete created items', async () => {
        await ProductsDB.deleteById(item.id + ProductsDB.getSortKeySeparator() + item.timestamp);
    });
});
