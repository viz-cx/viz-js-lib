import assert from 'assert';
import operation from '../src/auth/serializer/src/operations.js';

describe('viz.auth: operation test', ()=> {

    it('templates', ()=> {
        for(const op in operation) {
            switch(op) {
                case 'operation' : continue
            }
            template(operation[op])
        }
    })

})

function template(op) {

    assert(op.toObject({}, {use_default: true}))
    assert(op.toObject({}, {use_default: true, annotate: true}))

    // sample json
    // const obj = op.toObject({}, {use_default: true, annotate: false})
    // console.log(' ', op.operation_name, '\t', JSON.stringify(obj), '\n')
}
