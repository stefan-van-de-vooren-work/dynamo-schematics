import { Rule } from '@angular-devkit/schematics';
import { updateJsonInTree } from './json';

export function addIonicToPackageJson(): Rule {
    return updateJsonInTree('package.json', packageJson => {
        if (!packageJson['dependencies']) {
            packageJson['dependencies'] = {};
        }

        if (!packageJson['devDependencies']) {
            packageJson['devDependencies'] = {};
        }

        if (!packageJson['dependencies']['@ionic/angular']) {
            const deps = {
                '@ionic-native/core': '5.0.0-beta.21',
                '@ionic-native/splash-screen': '5.0.0-beta.21',
                '@ionic-native/status-bar': '5.0.0-beta.21',
                '@ionic/angular': '4.0.0-beta.13',
            };

            addDependencies(packageJson, 'dependencies', deps);
        }

        if (!packageJson['devDependencies']['@ionic/angular-toolkit']) {
            const deps = {
                '@ionic/angular-toolkit': '^1.0.0',
            };

            addDependencies(packageJson, 'devDependencies', deps);
        }

        return packageJson;
    });
}

function addDependencies(packageJson: any, depType: string, deps: any) {
    for (const dep in deps) {
        if (deps.hasOwnProperty(dep)) {
            const version = deps[dep];
            packageJson[depType][dep] = version;
        }
    }
}
