import { DatabaseConfig } from '../index';
import { assert } from 'chai';
import 'mocha';

describe('Missing configuration invocation', () => { 
    it('should result in configuration object to be undefined', () => {
        assert.isUndefined(DatabaseConfig.DynamoDBConfig);
    }); 
});

describe('Configuration', () => { 
    it('should setup configuration object', () => { 
        DatabaseConfig.init({
            apiVersion: '2012-08-10',
            maxRetries: 9,
            tables: [{
                name: 'Products',
                partitionKeyName: 'id',
                partitionKeyType: 'string'
            }]
        });
        assert.isDefined(DatabaseConfig.DynamoDBConfig);
    }); 
});
