import * as AWS from 'aws-sdk';
import 'mocha';
import { assert } from 'chai';
import { DBComposite } from '../src/db/DBComposite';

AWS.config.update({ region: 'eu-west-1' });
AWS.config.update({ credentials: { accessKeyId: 'FakeAccessKey', secretAccessKey: 'FakeSecretAccessKey' } });

interface ProductRawModel {
    id: string;
    day: string;
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
class ProductsDB extends DBComposite<ProductModel, ProductRawModel>('ProductsDay') {}

// ######## ########  ######  ########  ######
//    ##    ##       ##    ##    ##    ##    ##
//    ##    ##       ##          ##    ##
//    ##    ######    ######     ##     ######
//    ##    ##             ##    ##          ##
//    ##    ##       ##    ##    ##    ##    ##
//    ##    ########  ######     ##     ######

describe('QueryBeginsWithRecurse function', () => {
    const items = [
        {
            id: 'a12',
            day: '2019-09-09',
            name: 'coat',
            price: 100,
            size: 37,
            color: 'blue',
            keyWords: ['coat'],
            availableFromTime: '2019-09-09',
        },
        {
            id: 'a12',
            day: '2019-09-10',
            name: 'coat',
            price: 100,
            size: 37,
            color: 'blue',
            keyWords: ['coat'],
            availableFromTime: '2019-09-09',
        },
        {
            id: 'a13',
            day: '2019-09-10',
            name: 'coat',
            price: 100,
            size: 37,
            color: 'blue',
            keyWords: ['coat'],
            availableFromTime: '2019-10-09',
        },
        {
            id: 'a13',
            day: '2019-10-10',
            name: 'coat',
            price: 100,
            size: 37,
            color: 'blue',
            keyWords: ['coat'],
            availableFromTime: '2019-10-09',
        },
    ];

    before('create items', async () => {
        await ProductsDB.createBatch(items);
    });

    it('should return all item that begins with the provided value', async () => {
        const results = await ProductsDB.queryBeginsWithRecurse(items[0].id, '2019-09-');

        assert(results[0].id === items[0].id);
        assert(results[1].id === items[1].id);
        assert(!results.map(x => x.id).includes(items[2].id));

        assert(results.map(x => x.day).includes(items[0].day));
        assert(results.map(x => x.day).includes(items[1].day));
        assert(!results.map(x => x.day).includes(items[3].day));
    });

    after('delete created items', async () => {
        await ProductsDB.deleteByIds(items.map(x => x.id + ProductsDB.getSortKeySeparator() + x.day));
    });
});
