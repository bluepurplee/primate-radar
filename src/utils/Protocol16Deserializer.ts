import {BufferCursor} from "./BufferCursor";

type ParameterTable = { [key: number]: any };
type OperationRequest = { operationCode: number, parameters: ParameterTable };
type OperationResponse = { operationCode: number, returnCode: number, debugMessage: any, parameters: ParameterTable };
type EventData = { code: number, parameters: ParameterTable };

enum Protocol16Type {
    "Unknown" = 0,
    "Null" = 42,
    "Dictionary" = 68,
    "StringArray" = 97,
    "Byte" = 98,
    "Double" = 100,
    "Float" = 102,
    "Integer" = 105,
    "Hashtable" = 104,
    "Short" = 107,
    "Long" = 108,
    "IntegerArray" = 110,
    "Boolean" = 111,
    "OperationResponse" = 112,
    "OperationRequest" = 113,
    "String" = 115,
    "ByteArray" = 120,
    "Array" = 121,
    "ObjectArray" = 122
}

class Protocol16Deserializer {

    static deserialize(input: BufferCursor, typeCode: number): any {
        switch (typeCode) {
            case Protocol16Type.Unknown:
            case Protocol16Type.Null:
                return null;
            case Protocol16Type.Byte:
                return this.deserializeByte(input);
            case Protocol16Type.Boolean:
                return this.deserializeBoolean(input);
            case Protocol16Type.Short:
                return this.deserializeShort(input);
            case Protocol16Type.Integer:
                return this.deserializeInteger(input);
            case Protocol16Type.IntegerArray:
                return this.deserializeIntegerArray(input);
            case Protocol16Type.Double:
                return this.deserializeDouble(input);
            case Protocol16Type.Long:
                return this.deserializeLong(input);
            case Protocol16Type.Float:
                return this.deserializeFloat(input);
            case Protocol16Type.String:
                return this.deserializeString(input);
            case Protocol16Type.StringArray:
                return this.deserializeStringArray(input);
            case Protocol16Type.ByteArray:
                return this.deserializeByteArray(input);
            case Protocol16Type.Dictionary:
                return this.deserializeDictionary(input);
            case Protocol16Type.Array:
                return this.deserializeArray(input);
            case Protocol16Type.OperationResponse:
                return this.deserializeOperationResponse(input);
            case Protocol16Type.OperationRequest:
                return this.deserializeOperationRequest(input);
            case Protocol16Type.Hashtable:
                return this.deserializeHashtable(input);
            case Protocol16Type.ObjectArray:
                return this.deserializeObjectArray(input);
            default:
                throw new Error(`Type code: ${input} not implemented.`);
        }
    }

    static deserializeByte(input: BufferCursor): number {
        return input.readUInt8();
    }

    static deserializeBoolean(input: BufferCursor): boolean {
        return input.readUInt8() !== 0;
    }

    static deserializeInteger(input: BufferCursor): number {
        return input.readInt32BE();
    }

    static deserializeIntegerArray(input: BufferCursor): number[] {
        const size = this.deserializeInteger(input);
        const res = [];
        for (let i = 0; i < size; i++) {
            res.push(this.deserializeInteger(input));
        }
        return res;
    }

    static deserializeShort(input: BufferCursor): number {
        return input.readUInt16BE();
    }

    static deserializeDouble(input: BufferCursor): number {
        return input.readDoubleBE();
    }

    static deserializeLong(input: BufferCursor): bigint {
        const res = input.buffer.readBigInt64BE(input.tell());
        input.seek(input.tell() + 8);
        return res;
    }

    static deserializeFloat(input: BufferCursor): number {
        return input.readFloatBE();
    }

    static deserializeString(input: BufferCursor): string {
        const stringSize = this.deserializeShort(input);
        return stringSize === 0 ? "" : input.toString('utf8', stringSize);
    }

    static deserializeByteArray(input: BufferCursor): ArrayBufferLike {
        const arraySize = input.readUInt32BE();
        return input.subarray(arraySize).buffer;
    }

    static deserializeArray(input: BufferCursor): any[] {
        const size = this.deserializeShort(input);
        const typeCode = this.deserializeByte(input);
        const res = [];
        for (let i = 0; i < size; i++) {
            const value = this.deserialize(input, typeCode);
            res.push(value);
        }
        return res;
    }

    public static deserializeStringArray(input: BufferCursor): string[] {
        const size = this.deserializeShort(input);
        const res = [];
        for (let i = 0; i < size; i++) {
            res.push(this.deserializeString(input));
        }
        return res;
    }

    static deserializeObjectArray(input: BufferCursor): any[] {
        const tableSize = this.deserializeShort(input);
        const output = [];
        for (let i = 0; i < tableSize; i++) {
            const typeCode = this.deserializeByte(input);
            output[i] = this.deserialize(input, typeCode);
        }
        return output;
    }

    static deserializeHashtable(input: BufferCursor): any {
        const tableSize = this.deserializeShort(input);
        return this.deserializeDictionaryElements(input, tableSize, 0, 0);
    }

    static deserializeDictionary(input: BufferCursor): any {
        const keyTypeCode = this.deserializeByte(input);
        const valueTypeCode = this.deserializeByte(input);
        const dictionarySize = this.deserializeShort(input);
        return this.deserializeDictionaryElements(input, dictionarySize, keyTypeCode, valueTypeCode);
    }

    static deserializeDictionaryElements(input: BufferCursor, dictionarySize: number, keyTypeCode: number, valueTypeCode: number): { [key: string]: any } {
        const output: { [key: string]: any } = {};
        for (let i = 0; i < dictionarySize; i++) {
            const key = this.deserialize(input, (keyTypeCode === Protocol16Type.Null || keyTypeCode === Protocol16Type.Unknown) ? this.deserializeByte(input) : keyTypeCode);
            const value = this.deserialize(input, (valueTypeCode === Protocol16Type.Null || valueTypeCode === Protocol16Type.Unknown) ? this.deserializeByte(input) : valueTypeCode);
            output[key] = value;
        }
        return output;
    }

    static deserializeOperationRequest(input: BufferCursor): OperationRequest {
        const operationCode = this.deserializeByte(input);
        const parameters = this.deserializeParameterTable(input);
        return { operationCode, parameters };
    }

    static deserializeOperationResponse(input: BufferCursor): OperationResponse {
        const operationCode = this.deserializeByte(input);
        const returnCode = this.deserializeShort(input);
        const debugMessage = this.deserialize(input, this.deserializeByte(input));
        const parameters = this.deserializeParameterTable(input);
        return { operationCode, returnCode, debugMessage, parameters };
    }

    static deserializeParameterTable(input: BufferCursor): ParameterTable {
        const tableSize = input.readUInt16BE(1);
        const table: ParameterTable = {};
        let offset = 3;

        for (let i = 0; i < tableSize; i++) {
            const key = input.readUInt8(offset);
            const valueTypeCode = input.readUInt8(offset + 1);
            const value = this.deserialize(input, valueTypeCode);
            table[key] = value;
        }
        return table;
    }
}

export default Protocol16Deserializer;