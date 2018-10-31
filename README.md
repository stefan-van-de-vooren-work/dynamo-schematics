# Getting Started With Schematics

This repository is a basic Schematic implementation that serves as a starting point to create and publish Schematics to NPM.

### Testing

To test locally, install `@angular-devkit/schematics-cli` globally and use the `schematics` command line tool. That tool acts the same as the `generate` command of the Angular CLI, but also has a debug mode.

Check the documentation with
```bash
schematics --help
```

### Unit Testing

`npm run test` will run the unit tests, using Jasmine as a runner and test framework.

### Publishing

To publish, simply do:

```bash
npm run build
npm publish
```

### Developing
To run a schematic locally use:
```bash
 schematics .:<name-schematic> --params
``` 
 for example: `schematics .:dynamo-page --name=new-app`

If you want to test the schematics in another project, use npm link on that project
```bash
    npm link <path-to-scheamtics-project>
```

### Debugging
for debugging a schematic use:
```bash 
 node --inspect-brk $(which schematics) .:<name-schematic> --params
 ```
 you could add `debugger;` to your script to break, or setup VS or WebStorm debug session and add breakpoints in your script 
