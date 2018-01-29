import { context } from 'ember-environment';
import { run } from 'ember-metal';
import Engine from '../../system/engine';
import { Object as EmberObject } from 'ember-runtime';
import { privatize as P } from 'container';
import {
  verifyInjection,
  verifyRegistration
} from '../test-helpers/registry-check';
import {
  moduleFor,
  AbstractTestCase as TestCase
} from 'internal-test-helpers';


let engine;
let originalLookup = context.lookup;
let lookup;

moduleFor('Engine', class extends TestCase {
  constructor() {
    super();

    lookup = context.lookup = {};
    engine = run(() => Engine.create());
  }

  teardown() {
    context.lookup = originalLookup;
    if (engine) {
      run(engine, 'destroy');
    }
  }

  ['@test acts like a namespace'](assert) {
    engine = run(() => lookup.TestEngine = Engine.create());

    engine.Foo = EmberObject.extend();
    assert.equal(engine.Foo.toString(), 'TestEngine.Foo', 'Classes pick up their parent namespace');
  }

  ['@test builds a registry'](assert) {
    assert.strictEqual(engine.resolveRegistration('application:main'), engine, `application:main is registered`);
    assert.deepEqual(engine.registeredOptionsForType('component'), { singleton: false }, `optionsForType 'component'`);
    assert.deepEqual(engine.registeredOptionsForType('view'), { singleton: false }, `optionsForType 'view'`);
    verifyRegistration(assert, engine, 'controller:basic');
    verifyInjection(assert, engine, 'view', '_viewRegistry', '-view-registry:main');
    verifyInjection(assert, engine, 'route', '_topLevelViewTemplate', 'template:-outlet');
    verifyInjection(assert, engine, 'view:-outlet', 'namespace', 'application:main');

    verifyInjection(assert, engine, 'controller', 'target', 'router:main');
    verifyInjection(assert, engine, 'controller', 'namespace', 'application:main');

    verifyInjection(assert, engine, 'router', '_bucketCache', P`-bucket-cache:main`);
    verifyInjection(assert, engine, 'route', '_bucketCache', P`-bucket-cache:main`);

    verifyInjection(assert, engine, 'route', 'router', 'router:main');

    verifyRegistration(assert, engine, 'component:-text-field');
    verifyRegistration(assert, engine, 'component:-text-area');
    verifyRegistration(assert, engine, 'component:-checkbox');
    verifyRegistration(assert, engine, 'component:link-to');

    verifyRegistration(assert, engine, 'service:-routing');
    verifyInjection(assert, engine, 'service:-routing', 'router', 'router:main');

    // DEBUGGING
    verifyRegistration(assert, engine, 'resolver-for-debugging:main');
    verifyInjection(assert, engine, 'container-debug-adapter:main', 'resolver', 'resolver-for-debugging:main');
    verifyInjection(assert, engine, 'data-adapter:main', 'containerDebugAdapter', 'container-debug-adapter:main');
    verifyRegistration(assert, engine, 'container-debug-adapter:main');
    verifyRegistration(assert, engine, 'component-lookup:main');

    verifyInjection(assert, engine, 'service:-dom-changes', 'document', 'service:-document');
    verifyInjection(assert, engine, 'service:-dom-tree-construction', 'document', 'service:-document');
    verifyRegistration(assert, engine, 'view:-outlet');
    verifyRegistration(assert, engine, P`template:components/-default`);
    verifyRegistration(assert, engine, 'template:-outlet');
    verifyInjection(assert, engine, 'view:-outlet', 'template', 'template:-outlet');
    verifyInjection(assert, engine, 'template', 'options', P`template-options:main`);
    assert.deepEqual(engine.registeredOptionsForType('helper'), { instantiate: false }, `optionsForType 'helper'`);
  }
});
