import { Catalog } from "../../../../common/src/api/catalog/types";

export default interface CatalogState {
    defaultCatalog: Catalog;
    loaded: boolean;
}
