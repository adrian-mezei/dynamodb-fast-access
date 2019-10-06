function StaticImplements<T>() {
    return <U extends T>(constructor: U) => constructor;
}

// declare type StaticImplements<T> = <TFunction extends () => void>(target: TFunction) => TFunction | void;

/*function StaticImplements<T extends {new(...args: any[]): {}}>(constructor: T) {
    return class extends constructor {
    };
}*/

export { StaticImplements as StaticImplements };
