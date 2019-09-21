function staticImplements<T>() {
    return <U extends T>(constructor: U) => constructor;
}

export { staticImplements as StaticImplements };
