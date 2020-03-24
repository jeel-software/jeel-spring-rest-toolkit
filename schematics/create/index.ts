import {
  apply,
  applyTemplates,
  branchAndMerge,
  chain,
  mergeWith,
  Rule,
  SchematicContext,
  Tree,
  url
} from "@angular-devkit/schematics";
import {Schema} from "./schema";
import {strings} from "@angular-devkit/core";



export function create(_options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const folder = _options.package.split(".").join("/");


        const sourceTemplates = url("./files");

        const sourceTemplatesParametrized = apply(sourceTemplates, [
            applyTemplates({
                ..._options,
                ...strings,
                uppercase,
                lowercase,
                folder
            })
        ]);

        const rule = chain([
            branchAndMerge(chain([mergeWith(sourceTemplatesParametrized)]))
        ]);

        return rule(tree, _context);
    };

    function uppercase(string: string) {
        return string.toUpperCase();
    }

    function lowercase(string: string) {
        return string.toLowerCase();
    }

}
