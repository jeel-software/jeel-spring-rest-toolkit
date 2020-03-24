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
import {Attribute} from "./attribute";
import generateFake  from './data-generator'


export function restScaffold(_options: Schema): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        let attributes: Attribute[] = [];

        if (_options.attributes) {
            const items = _options.attributes.split(",");
            attributes = items.map(item => {
                let [name, type, nullable, label] = item.split(":");
                return {
                    name,
                    type,
                    nullable: nullable.toLowerCase() === "true",
                    label
                };
            });
        }
        
        const folder = _options.package.split(".").join("/");

        updateRepositoryFactory(tree, folder)

        updateMessageProperties(tree, attributes, _options)

        const sourceTemplates = url("./files");

        const sourceTemplatesParametrized = apply(sourceTemplates, [
            applyTemplates({
                ..._options,
                ...strings,
                uppercase,
                lowercase,
                generateFake,
                folder,
                attributes
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

    function updateMessageProperties(tree: Tree, attributes: Attribute[], _options: Schema) {
        const messagePropertiesPath = `./src/main/resources/messages.properties`;
        const messageProperties: Buffer | null = tree.read(messagePropertiesPath);
        let messagePropertiesContent: string = "";
        if (messageProperties)
            messagePropertiesContent = messageProperties.toString();

        let linesToAppend = `model.${strings.underscore(_options.entity)}=${strings.capitalize(_options.title)}\n`;

        if (attributes) {

            attributes.forEach(attribute => {
                if (attribute.nullable == false) {
                    linesToAppend += `validation.${strings.underscore(_options.entity)}.${strings.underscore(attribute.name)}.not_null=O campo ${attribute.label} é de preenchimento obrigatório\n`
                }

                if (attribute.type == 'String') {
                    linesToAppend += `validation.${strings.underscore(_options.entity)}.${strings.underscore(attribute.name)}.max=O campo ${attribute.label} não pode exceder 255 caracteres\n`
                }
            })

            messagePropertiesContent += linesToAppend

            tree.overwrite(messagePropertiesPath, messagePropertiesContent);
        }


    }

    function updateRepositoryFactory(tree: Tree, folder: string) {
        const repositoryFactoryPath = `./src/main/java/${folder}/repository/RepositoryFactory.java`;
        const defaultRepositoryFactoryPath = `./src/main/java/${folder}/repository/DefaultRepositoryFactory.java`;

        const repositoryFactory: Buffer | null = tree.read(repositoryFactoryPath);
        const defaultRepositoryFactory: Buffer | null = tree.read(
            defaultRepositoryFactoryPath
        );

        let repositoryFactoryContent: string = "";
        let defaultRepositoryFactoryContent: string = "";
        let linesToAppend = "";
        let appendIndex;

        if (repositoryFactory)
            repositoryFactoryContent = repositoryFactory.toString();

        appendIndex = repositoryFactoryContent.indexOf("}");

        linesToAppend = `${strings.classify(
            _options.entity
        )}Repository get${strings.classify(_options.entity)}Repository();\n`;
        const updatedRepositoryFactoryContent = `${repositoryFactoryContent.slice(
            0,
            appendIndex
        )}
      ${linesToAppend}
      ${repositoryFactoryContent.slice(appendIndex)}`;

        if (defaultRepositoryFactory)
            defaultRepositoryFactoryContent = defaultRepositoryFactory.toString();

        appendIndex = defaultRepositoryFactoryContent.indexOf("}");

        linesToAppend = ` @Autowired
       private ${strings.classify(
            _options.entity
        )}Repository ${strings.camelize(_options.entity)}Repository;\n`;

        const updatedDefaultRepositoryFactoryContent = `${defaultRepositoryFactoryContent.slice(
            0,
            appendIndex
        )}
     ${linesToAppend}
     ${defaultRepositoryFactoryContent.slice(appendIndex)}`;

        tree.overwrite(repositoryFactoryPath, updatedRepositoryFactoryContent);
        tree.overwrite(
            defaultRepositoryFactoryPath,
            updatedDefaultRepositoryFactoryContent
        );
    }
}
