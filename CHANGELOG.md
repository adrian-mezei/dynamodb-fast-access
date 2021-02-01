# [4.0.0](https://github.com/adrian-mezei/dynamodb-fast-access/compare/v3.0.4...v4.0.0) (2021-01-31)


### Features

* define partition key type and sort key type with a string instead of an enum ([adf9f9f](https://github.com/adrian-mezei/dynamodb-fast-access/commit/adf9f9f5d0ee8331ffef54f62e8de7471c772e8a))

### BREAKING CHANGES

* Define partition key type and sort key type with a string instead of an enum. This makes it easier to load configuration from a simple json object like a json file.


# [3.0.0](https://github.com/adrian-mezei/dynamodb-fast-access/compare/v2.1.1...v3.0.0) (2021-01-31)


### Bug Fixes

* remove the possibility to manually provide a dynamodb api version ([0a8113f](https://github.com/adrian-mezei/dynamodb-fast-access/commit/0a8113fd864f8a46076f5a916842edac044d4116))

### BREAKING CHANGES

* It is not allowed to provide a DynamoDB api version manually.