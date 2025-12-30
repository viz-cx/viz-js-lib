import Convert from '../src/auth/serializer/src/convert.js';
import ByteBuffer from 'bytebuffer';
import assert from 'assert';
const { equal, deepEqual } = assert;
import Types from '../src/auth/serializer/src/types.js';
const { vote_id, set: _set, bool, string, map: _map, public_key, uint16, protocol_id_type } = Types;
import pre from '../src/auth/serializer/src/precision.js';
const { _internal, to_bigint64, to_string64 } = pre;
import { error } from './test_helper.js';

describe('viz.auth: types', () => {
    it('vote_id',() => {
        const toHex=function(id){
            const vote = vote_id.fromObject(id);
            return Convert(vote_id).toHex(vote);
        };
        equal('ff000000', toHex('255:0'));
        equal('00ffffff', toHex(`0:${0xffffff}`));
        const out_of_range=function(id){
            try {
                toHex(id);
                return assert(false, 'should have been out of range');
            } catch (e) {
                return assert(e.message.indexOf('out of range') !== -1);
            }
        };
        out_of_range(`0:${0xffffff+1}`);
        out_of_range('256:0');
    });

    it('set sort', () => {
        const bool_set = _set(bool);
        // Note, 1,0 sorts to 0,1
        equal('020001', Convert(bool_set).toHex([1,0]));
        error('duplicate (set)', () => { return Convert(bool_set).toHex([1,1]); });
    });

    it('string sort', () => {
        const setType = _set(string);
        const set = setType.fromObject(['a','z','m'])
        const setObj = setType.toObject(set)
        deepEqual(['a','m','z'], setObj, 'not sorted')
    });

    it('map sort', () => {
        const bool_map = _map(bool, bool);
        // 1,1 0,0   sorts to   0,0  1,1
        equal('0200000101', Convert(bool_map).toHex([[1,1],[0,0]]));
        error('duplicate (map)', () => { return Convert(bool_map).toHex([[1,1],[1,1]]); });
    })

    it('public_key sort', () => {
        const mapType = _map(public_key, uint16)
        const map = mapType.fromObject([//not sorted
            ['VIZ56ankGHKf6qUsQe7vPsXTSEqST6Dt1ff73aV3YQbedzRua8NLQ',0],
            ['VIZ8me6d9PqzTgcoHxx6b4rnvWVTqz11kafidRAZwfacJkcJtfd75',0],
        ])
        const mapObject = mapType.toObject(map)
        deepEqual(mapObject, [ // sorted (uppercase comes first)
            ['VIZ8me6d9PqzTgcoHxx6b4rnvWVTqz11kafidRAZwfacJkcJtfd75',0],
            ['VIZ56ankGHKf6qUsQe7vPsXTSEqST6Dt1ff73aV3YQbedzRua8NLQ',0],
        ])
    })

    it('type_id sort', () => {
        // map (protocol_id_type "account"), (uint16)
        const t = _map(protocol_id_type('account'), uint16);
        deepEqual( t.fromObject([[1,1],[0,0]]), [[0,0],[1,1]], 'did not sort' )
        deepEqual( t.fromObject([[0,0],[1,1]]), [[0,0],[1,1]], 'did not sort' )
    });

    it('precision number strings', () => {
        const check=function(input_string, precision, output_string){
            return equal(
                output_string,
                _internal.decimal_precision_string(
                    input_string,
                    precision
                )
            );
        };
        check(
            '12345678901234567890123456789012345678901234567890.12345',5,
            '1234567890123456789012345678901234567890123456789012345'
        );
        check('',     0,      '0');
        check('0',    0,      '0');
        check('-0',   0,      '0');
        check('-00',  0,      '0');
        check('-0.0', 0,      '0');
        check('-',    0,      '0');
        check('1',    0,      '1');
        check('11',   0,      '11');
        overflow(() =>{ return check('.1', 0, ''); });
        overflow(() =>{ return check('-.1', 0, ''); });
        overflow(() =>{ return check('0.1', 0, ''); });
        overflow(() =>{ return check('1.1', 0, ''); });
        overflow(() =>{ return check('1.11', 1, ''); });
        check('',     1,      '00');
        check('1',    1,      '10');
        check('1.1',  1,      '11');
        check('-1',   1,      '-10');
        check('-1.1', 1,      '-11');
    });

    it('precision number long', () => {
        let _precision;
        equal(
            ByteBuffer.Long.MAX_VALUE.toString(),
            to_bigint64(
                ByteBuffer.Long.MAX_VALUE.toString(), _precision = 0
            ).toString(),
            'to_bigint64 MAX_VALUE mismatch'
        );
        // Long.MAX_VALUE.toString() == 9223372036854775807
        // Long.MAX_VALUE.toString() +1 9223372036854775808
        overflow(() =>{ return to_bigint64(
            '9223372036854775808', _precision = 0
        );
        });
        equal('0', to_string64(ByteBuffer.Long.ZERO, 0));
        equal('00', to_string64(ByteBuffer.Long.ZERO, 1));
        overflow(() =>{ return to_bigint64(
            '92233720368547758075', _precision = 1
        );
        });
    });
});

const overflow = function(f){ return error('overflow', f); };
