// Mojang's data pack JSON omits the "minecraft:" namespace on vanilla ids in some places (bare
// item/tag references) but not others (result.id) - normalizing everything to the namespaced
// form here means nothing downstream has to guess which shape it received.
export function namespaced(id: string): string {
    return id.includes(':') ? id : `minecraft:${id}`;
}
