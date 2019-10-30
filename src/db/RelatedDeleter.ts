export type RelatedDeleter = (ids: string[]) => Promise<void>;

export const DefaultRelatedDeleter = (): Promise<void> => new Promise(res => res());
