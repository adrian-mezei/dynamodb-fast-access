import { assert } from 'chai';
import { DB } from '../src/db/DB';

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

describe('Default related deleter function', () => {
    const item = {
        id: 'a12',
        timestamp: 1570354849343,
        name: 'coat',
        price: 100,
        size: 37,
        color: 'blue',
        keyWords: ['coat'],
        availableFromTime: '2019-09-09',
    };

    it('must return nothing', async () => {
        const returned = await ProductsDB.deleteRelated([item.id]);

        assert(returned === undefined);
    });
});
