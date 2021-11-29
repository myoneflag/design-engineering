import { SupportedLocales } from "../locale";
import { auCatalog } from "./initial-catalog/au-catalog";
import { ukCatalog } from "./initial-catalog/uk-catalog";
import { usCatalog } from "./initial-catalog/us-catalog";

export const CatalogsByLocale = {
    [SupportedLocales.AU]: auCatalog,
    [SupportedLocales.UK]: ukCatalog,
    [SupportedLocales.US]: usCatalog
};
