import assert from 'assert'
import viz from '../src/api/index.js'

import { camelCase } from '../src/utils.js'
import { methods_test } from './methods_by_version.js'

describe('viz.methods', () => {

    it('has all generated methods', () => {

        const methods = methods_test
            .map( m => `${camelCase(m)}`)
            .sort()

        const libMethods = Object.keys(viz.api.VIZ.prototype)
            .filter( m => !m.endsWith('With'))
            .filter( m => !m.endsWith('Async'))
            .sort()

        assert.equal(libMethods.length, methods.length)
        assert.deepEqual(libMethods, methods)
    })
})
