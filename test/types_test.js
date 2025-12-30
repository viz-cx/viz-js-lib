import Convert from '../src/auth/serializer/src/convert.js';
import ByteBuffer from 'bytebuffer';
import assert from 'assert';
const { equal, deepEqual } = assert;
import Types from '../src/auth/serializer/src/types.js';
const { vote_id, set: _set, bool, string, map: _map, public_key, uint16, protocol_id_type } = Types;
import precision from '../src/auth/serializer/src/precision.js';
const { _internal, to_bigint64, to_string64 } = precision;
import { error } from './test_helper.js';

describe("viz.auth: types", function() {
    it("vote_id",function() {
        var toHex=function(id){
            var vote = vote_id.fromObject(id);
            return Convert(vote_id).toHex(vote);
        };
        equal("ff000000", toHex("255:0"));
        equal("00ffffff", toHex("0:"+0xffffff));
        var out_of_range=function(id){
            try {
                toHex(id);
                return assert(false, 'should have been out of range');
            } catch (e) {
                return assert(e.message.indexOf('out of range') !== -1);
            }
        };
        out_of_range("0:"+(0xffffff+1));
        out_of_range("256:0");
    });

    it("set sort", function() {
        var bool_set = _set(bool);
        // Note, 1,0 sorts to 0,1
        equal("020001", Convert(bool_set).toHex([1,0]));
        error("duplicate (set)", function() { return Convert(bool_set).toHex([1,1]); });
    });

    it("string sort", function() {
        var setType = _set(string);
        var set = setType.fromObject(["a","z","m"])
        var setObj = setType.toObject(set)
        deepEqual(["a","m","z"], setObj, "not sorted")
    });

    it("map sort", function() {
        var bool_map = _map(bool, bool);
        // 1,1 0,0   sorts to   0,0  1,1
        equal("0200000101", Convert(bool_map).toHex([[1,1],[0,0]]));
        error("duplicate (map)", function() { return Convert(bool_map).toHex([[1,1],[1,1]]); });
    })

    it("public_key sort", function() {
        let mapType = _map(public_key, uint16)
        let map = mapType.fromObject([//not sorted
            ["VIZ56ankGHKf6qUsQe7vPsXTSEqST6Dt1ff73aV3YQbedzRua8NLQ",0],
            ["VIZ8me6d9PqzTgcoHxx6b4rnvWVTqz11kafidRAZwfacJkcJtfd75",0],
        ])
        let mapObject = mapType.toObject(map)
        deepEqual(mapObject, [ // sorted (uppercase comes first)
            ["VIZ8me6d9PqzTgcoHxx6b4rnvWVTqz11kafidRAZwfacJkcJtfd75",0],
            ["VIZ56ankGHKf6qUsQe7vPsXTSEqST6Dt1ff73aV3YQbedzRua8NLQ",0],
        ])
    })

    it("type_id sort", function() {
        // map (protocol_id_type "account"), (uint16)
        let t = _map(protocol_id_type("account"), uint16);
        deepEqual( t.fromObject([[1,1],[0,0]]), [[0,0],[1,1]], 'did not sort' )
        deepEqual( t.fromObject([[0,0],[1,1]]), [[0,0],[1,1]], 'did not sort' )
    });

    it("precision number strings", function() {
        var check=function(input_string, precision, output_string){
            return equal(
                output_string,
                _internal.decimal_precision_string(
                    input_string,
                    precision
                )
            );
        };
        check(
            "12345678901234567890123456789012345678901234567890.12345",5,
            "1234567890123456789012345678901234567890123456789012345"
        );
        check("",     0,      "0");
        check("0",    0,      "0");
        check("-0",   0,      "0");
        check("-00",  0,      "0");
        check("-0.0", 0,      "0");
        check("-",    0,      "0");
        check("1",    0,      "1");
        check("11",   0,      "11");
        overflow(function(){ return check(".1", 0, ""); });
        overflow(function(){ return check("-.1", 0, ""); });
        overflow(function(){ return check("0.1", 0, ""); });
        overflow(function(){ return check("1.1", 0, ""); });
        overflow(function(){ return check("1.11", 1, ""); });
        check("",     1,      "00");
        check("1",    1,      "10");
        check("1.1",  1,      "11");
        check("-1",   1,      "-10");
        check("-1.1", 1,      "-11");
    });

    it("precision number long", function() {
        var _precision;
        equal(
            ByteBuffer.Long.MAX_VALUE.toString(),
            to_bigint64(
                ByteBuffer.Long.MAX_VALUE.toString(), _precision = 0
            ).toString(),
            "to_bigint64 MAX_VALUE mismatch"
        );
        // Long.MAX_VALUE.toString() == 9223372036854775807
        // Long.MAX_VALUE.toString() +1 9223372036854775808
        overflow(function(){ return to_bigint64(
            '9223372036854775808', _precision = 0
        );
        });
        equal("0", to_string64(ByteBuffer.Long.ZERO, 0));
        equal("00", to_string64(ByteBuffer.Long.ZERO, 1));
        overflow(function(){ return to_bigint64(
            '92233720368547758075', _precision = 1
        );
        });
    });
});

var overflow = function(f){ return error("overflow", f); };
