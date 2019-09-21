export interface ListModel<T> {
    items: T[];
    lastEvaluatedKey?: string;
}
