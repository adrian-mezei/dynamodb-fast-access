# dynamodb-fast-access
Default CRUD operations for managing AWS DynamoDB table items in an easy-to-extend structure.

[![Build Status](https://travis-ci.org/adrian-mezei/dynamodb-fast-access.svg?branch=master)](https://travis-ci.org/adrian-mezei/dynamodb-fast-access)
[![Npm version](https://img.shields.io/npm/v/dynamodb-fast-access.svg?style=flat)](https://www.npmjs.com/package/dynamodb-fast-access)
[![GitHub license](https://img.shields.io/github/license/adrian-mezei/dynamodb-fast-access)](https://github.com/adrian-mezei/dynamodb-fast-access/blob/master/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/adrian-mezei/dynamodb-fast-access/badge.svg?branch=master)](https://coveralls.io/github/adrian-mezei/dynamodb-fast-access?branch=master)

## Quick example
```javascript
import * as DDFA from 'dynamodb-fast-access';

DDFA.DatabaseConfig.init({
    apiVersion: '2012-08-10',
    maxRetries: 9,
    tables: [{
        name: 'Products',
        partitionKeyName: 'id',
        partitionKeyType: KeyTypeEnum.string,
    }]
});

class ProductsDB extends DDFA.DBMutable<any, any, any>('Products') {
    // You inherit a lot of basic functions
    // You can write further DB queries here
}

ProductsDB.create({ id: '123456abc', name: 'gloves', color: 'red' });
ProductsDB.getById('123456abc');
ProductsDB.deleteById('123456abc');
// And a lot more...
```

## Usage

1. Configure the library by invoking the `init` function with the database configuration parameters. You can optionally provide your own configured AWS DynamoDB DocumentClient instance, otherwise it will be created.

1. (optional) Create the models for your database objects:
    - **RawModel**: that describes the object that is stored in the database.
    - **Model**: that describes the object that is stored in the database extended by additional derived attributes.
    - **UpdateModel**: that describes the attributes of the object that is stored in the database that are mutable.

1. (otional) Create the **extender** function that accepts **RawModel** type object array and returns **Model** type object array. This will extend your the raw database object upon request. (The default **extender** function does not modify the database objects.)

1. (otional) Create the **deleter** function to perform some task before the object is being deleted. This function is invoked before an item is deleted. (The default **deleter** function does not do anything.)

1. Create the database class by extending one of the provided base classes that provide a lot of basic functions to access the database. You can write your own database functions here as well.


## Database configuration parameters
| Attribute | Required | Type | Description |
|-----------|:--------:|:----:|-------------|
| apiVersion | false | string | DynamoDB javascript SDK api version [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html). |
| maxRetries | true | number | Maximum number of retries for batch write with an exponential backoff algorithm as it is recommended in the DynamoDB API reference [here](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html). |
| tables | true | array | The array of DynamoDB table configurations. |
| tables[].name | true | string | The name of the DynamoDB table. |
| tables[].partitionKeyName | true | string | The name of the partition key of the DynamoDB table. |
| tables[].partitionKeyType | true | enum | The type of the partition key of the DynamoDB table. Possible values: 'string', 'number'. |
| tables[].sortKeyName | false | string | The name of the sort key of the DynamoDB table. |
| tables[].sortKeyType | false | enum | The type of the sort key of the DynamoDB table. Possible values: 'string', 'number'. |
| tables[].sortKeySeparator | false | string | In case of composite key, the item id (required by some functions) is the partition key concatenated with the sort key with this separator. |
| tables[].indices | false | array | The array of DynamoDB table index configurations. |
| tables[].indices[].name | true | string | The name of the DynamoDB table index. |
| tables[].indices[].partitionKeyName | true | string | The name of the partition key of the DynamoDB table index. |
| tables[].indices[].partitionKeyType | true | string | The type of the partition key of the DynamoDB table index. Possible values: 'string', 'number'. |
| tables[].indices[].sortKeyName | false | string | The name of the sort key of the DynamoDB table index. |
| tables[].indices[].sortKeyType | false | string | The type of the sort key of the DynamoDB table index. Possible values: 'string', 'number'. |
| tables[].indices[].sortKeySeparator | false | string | In case of composite key, the item id (required by some functions) is the partition key concatenated with the sort key with this separator. |

Example:
```javascript
{
    apiVersion: '2012-08-10',
    maxRetries: 9,
    tables: [{
        name: 'Products',
        partitionKeyName: 'id',
        partitionKeyType: 'string',
        sortKeyName: 'timestamp',
        sortKeyType: 'number',
        sortKeySeparator: '$'
    }]
}
```

## Provided function descriptions
| Function | Description |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| getTableName | Returns the configured name of the DynamoDB table. |
| getPartitionKeyName | Returns the configured name of the partition key of the DynamoDB table. |
| getSortKeyName | Returns the configured name of the sort key of the DynamoDB table. |
| getSortKeySeparator | Returns the string that separates the partition key and sort key. |
| create | Creates an entry in the DynamoDB table and returns the extended entry. |
| createRaw | Creates an entry in the DynamoDB table and returns the raw entry. |
| createBatch | Creates entries in the DynamoDB table and returns the extended entries. |
| createBatchRaw | Creates entries in the DynamoDB table and returns the raw entries. |
| getById | Returns the extended entry from the DynamoDB table by its id. Throws 'Resource does not exist.' error if entry with the provided id does not exist. |
| getByIdRaw | Returns the raw entry from the DynamoDB table by its id. Throws 'Resource does not exist.' error if entry with the provided id does not exist. |
| getByIds | Returns the extended entries from the DynamoDB table by their ids using [AWS DynamoDB batchGet](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property). |
| getByIdsRaw | Returns the raw entries from the DynamoDB table by their ids using [AWS DynamoDB batchGet]( https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property ). |
| scanFiltered | Returns the extended entries from the DynamoDB table using [AWS DynamoDB scan](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property) recursively. |
| scanFilteredRaw | Returns the raw entries from the DynamoDB table using [AWS DynamoDB scan]( https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property ) recursively. |
| deleteById | Deletes the entry from the DynamoDB table by its id. If the base class was initiated with a deleter function, then it is called  before the item is deleted. Returns the id of the deleted entry if the delete is successful (also shadows DynamoDB 'ResourceNotFoundException' and considers the delete successful) and throws DynamoDB exceptions otherwise. |
| deleteByIds | Deletes entries from the DynamoDB table by their ids using [AWS DynamoDB batchWrite](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property). If the base class was initiated with a deleter function, then it is called  before the item is deleted. Returns the ids of the deleted entries if deletes are successful and throws DynamoDB exceptions otherwise. |
| deleteScanFiltered | Deletes entries from the DynamoDB table by filter attributes (an attribute to match a specific value or an array to contain a specific item) using [AWS DynamoDB scan](  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property  ) and [AWS DynamoDB batchWrite](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property) recursively. If the base class was initiated with a deleter function, then it is called  before the item is deleted. |
| updateById | Updates the provided attributes of an entry of a DynamoDB table by id. |
| updateByIdWithDelete | Updates and deletes the provided attributes of an entry of a DynamoDB table by id. |
| query | Returns the extended entries from the DynamoDB table that has the provided partition key using [AWS DynamoDB query](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property). |
| queryRaw | Returns the reaw entries from the  DynamoDB table that has the provided partition key using [AWS DynamoDB query](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property). |
| queryRecurse | Performs a recursive query and returns the extended entries from the DynamoDB table that has the provided partition key using [AWS DynamoDB query](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property). |
| queryRecurseRaw | Performs a recursive query and returns the raw entries from the DynamoDB table that has the provided partition key using [AWS DynamoDB query](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property). |
| queryBeginsWith | Returns the extended entries from the DynamoDB table that has the provided partition key and whose sort key begins with the provided value using [AWS DynamoDB query](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property). |
| queryBeginsWithRaw | Returns the raw entries from the DynamoDB table that has the provided partition key and whose sort key begins with the provided value using [AWS DynamoDB query](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property). |
| queryBeginsWithRecurse | Performs a recursive query and returns the extended entries from the DynamoDB table that has the provided partition key and whose sort key begins with the provided value using [AWS DynamoDB query](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property). |
| queryBeginsWithRecurseRaw | Performs a recursive query and returns the raw entries from the DynamoDB table that has the provided partition key  and whose sort key begins with the provided value  using [AWS DynamoDB query](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property). |
| combineKeys | Combines the provided DynamoDB Key object attributes by concatenating the partition key and the optional sort key by the configured separator. |

## Base class functions
| Function                  | DB | DBComposite | DBMutable | DBCompositeMutable |
|---------------------------|:--:|:-----------:|:---------:|:------------------:|
| getTableName              |  ✓ |      ✓      |     ✓     |          ✓         |
| getPartitionKeyName       |  ✓ |      ✓      |     ✓     |          ✓         |
| getSortKeyName            |  ✓ |      ✓      |     ✓     |          ✓         |
| getSortKeySeparator       |  ✓ |      ✓      |     ✓     |          ✓         |
| create                    |  ✓ |      ✓      |     ✓     |          ✓         |
| createRaw                 |  ✓ |      ✓      |     ✓     |          ✓         |
| createBatch               |  ✓ |      ✓      |     ✓     |          ✓         |
| createBatchRaw            |  ✓ |      ✓      |     ✓     |          ✓         |
| getById                   |  ✓ |      ✓      |     ✓     |          ✓         |
| getByIdRaw                |  ✓ |      ✓      |     ✓     |          ✓         |
| getByIds                  |  ✓ |      ✓      |     ✓     |          ✓         |
| getByIdsRaw               |  ✓ |      ✓      |     ✓     |          ✓         |
| scanFiltered              |  ✓ |      ✓      |     ✓     |          ✓         |
| scanFilteredRaw           |  ✓ |      ✓      |     ✓     |          ✓         |
| deleteById                |  ✓ |      ✓      |     ✓     |          ✓         |
| deleteByIds               |  ✓ |      ✓      |     ✓     |          ✓         |
| deleteScanFiltered        |  ✓ |      ✓      |     ✓     |          ✓         |
| updateById                |    |             |     ✓     |          ✓         |
| updateByIdWithDelete      |    |             |     ✓     |          ✓         |
| query                     |    |      ✓      |           |          ✓         |
| queryRaw                  |    |      ✓      |           |          ✓         |
| queryRecurse              |    |      ✓      |           |          ✓         |
| queryRecurseRaw           |    |      ✓      |           |          ✓         |
| queryBeginsWith           |    |      ✓      |           |          ✓         |
| queryBeginsWithRaw        |    |      ✓      |           |          ✓         |
| queryBeginsWithRecurse    |    |      ✓      |           |          ✓         |
| queryBeginsWithRecurseRaw |    |      ✓      |           |          ✓         |
| combineKeys               |    |      ✓      |           |          ✓         |
