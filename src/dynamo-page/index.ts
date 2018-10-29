import { chain, externalSchematic, Rule} from "@angular-devkit/schematics";
// const licenseText = "";

export default function(schema: any): Rule {
  return chain([
    externalSchematic("@nrwl/schematics", "library", {
      name: schema.name,
      directory: 'pages',
      routing: true
    }),
    externalSchematic("@schematics/angular", "component", {
      project: 'pages-' + schema.name,
      module: 'pages-' + schema.name + '.module.ts',
      name: schema.name,
      styleext: "scss"
    }),
    // (tree: Tree, _context: SchematicContext) => {
    // console.log(tree);
    //   tree.getDir(schema.sourceDir)
    //     .visit(filePath => {
    //       console.log(filePath)
    //       if (!filePath.endsWith(".ts")) {
    //         return;
    //       }
    //       const content = tree.read(filePath);
    //       if (!content) {
    //         return;
    //       }
    //
    //       // Prevent from writing license to files that already have one.
    //       if (content.indexOf(licenseText) === -1) {
    //         tree.overwrite(filePath, licenseText + content);
    //       }
    //     });
    //   return tree;
    // }
  ]);
}