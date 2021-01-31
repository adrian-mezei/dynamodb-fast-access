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

const discountPercent = 10;

function extender(x: ProductRawModel[]): Promise<ProductModel[]> {
    const response: ProductModel[] = [];
    for(const rawProduct of x) response.push({...rawProduct, discountPercent: discountPercent});
    return new Promise( res => res(response));
}

class ProductsDB extends DB<ProductModel, ProductRawModel>('ProductsTimestamp') {}

/* tslint:disable:max-classes-per-file */
class ProductsDB2 extends DB<ProductModel, ProductRawModel>('ProductsTimestamp', extender) {}

// ######## ########  ######  ########  ######  
//    ##    ##       ##    ##    ##    ##    ## 
//    ##    ##       ##          ##    ##       
//    ##    ######    ######     ##     ######  
//    ##    ##             ##    ##          ## 
//    ##    ##       ##    ##    ##    ##    ## 
//    ##    ########  ######     ##     ######  

describe('Default extend function', () => { 
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

    it('must not modify the item', async () => {
        const extendedItem = (await ProductsDB.extend([item]))[0];
        
        assert(item === extendedItem);
    });
});

describe('Overridden extend function', () => { 
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

    it('must override the default extend function functionality', async () => {
        const extendedItem = (await ProductsDB2.extend([item]))[0];
        
        assert(extendedItem.discountPercent === discountPercent);
    });
});
