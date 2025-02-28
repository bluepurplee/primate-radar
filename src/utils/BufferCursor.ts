
export class BufferCursor {
    private cursorPosition: number;
    public readonly buffer: Buffer;
    public readonly length: number;

    constructor(buff: Buffer) {
        this.cursorPosition = 0;
        this.buffer = buff;
        this.length = buff.length;
    }

    private assertThatStepsMoveIsWithinLimits(step: number): void {
        //probably wrong lol
        if (this.cursorPosition + step > this.length) throw new RangeError("Trying to move beyond buffer");
    }

    private readSafelyAndMoveCursorPosition<T>(readerFunction: () => T, numberOfStepsToMove: number): T {
        this.assertThatStepsMoveIsWithinLimits(numberOfStepsToMove);
        const result = readerFunction();
        this.moveCursorPosition(numberOfStepsToMove);
        return result;
    }

    public tell(): number {
        return this.cursorPosition;
    }

    public moveCursorPosition(numberOfStepsToMove: number): void {
        this.cursorPosition = this.cursorPosition + numberOfStepsToMove;
    }

    public getBuffer(): Buffer {
        const result = Buffer.allocUnsafe(this.buffer.length - this.cursorPosition);
        this.buffer.copy(result, 0, this.cursorPosition, this.buffer.length);
        return result;
    }
    public seek(pos: number): this {
        if (pos < 0) throw new RangeError("Cannot seek before start of buffer");
        if (pos > this.length) throw new RangeError("Trying to seek beyond buffer");
        this.cursorPosition = pos;
        return this;
    }

    public subarray(length?: number): BufferCursor {
        const end = length === undefined ? this.length : this.cursorPosition + length;

        const buf = new BufferCursor(this.buffer.subarray(this.cursorPosition, end));
        this.seek(end);

        return buf;
    }

    public toString(encoding: BufferEncoding = "utf8", length?: number): string {
        const end = length === undefined ? this.length : this.cursorPosition + length;

        const ret = this.buffer.toString(encoding, this.cursorPosition, end);
        this.seek(end);
        return ret;
    }

    public copy(source: BufferCursor | Buffer, sourceStart?: number, sourceEnd?: number): this {
        if (!sourceEnd) sourceEnd = source.length;
        if (!sourceStart) sourceStart = source instanceof BufferCursor ? source.cursorPosition : 0;

        const length = sourceEnd - sourceStart;
        this.assertThatStepsMoveIsWithinLimits(length);
        const buf = source instanceof BufferCursor ? source.buffer : source;

        buf.copy(this.buffer, this.cursorPosition, sourceStart, sourceEnd);
        this.moveCursorPosition(length);
        return this;
    }

    public readUInt8(offset = 0): number {
        return this.readSafelyAndMoveCursorPosition(() => this.buffer.readUInt8(this.cursorPosition + offset), 1 + offset);
    }


    public readInt16BE(offset: number = 0): number {
        return this.readSafelyAndMoveCursorPosition(() => this.buffer.readInt16BE(this.cursorPosition + offset), 2 + offset);
    }

    public readUInt16BE(offset: number = 0): number {
        return this.readSafelyAndMoveCursorPosition(() => this.buffer.readUInt16BE(this.cursorPosition + offset), 2 + offset);
    }

    public readUInt32BE(offset: number = 0): number {
        return this.readSafelyAndMoveCursorPosition(() => this.buffer.readUInt32BE(this.cursorPosition + offset), 4 + offset);
    }


    public readInt32BE(offset= 0): number {
        return this.readSafelyAndMoveCursorPosition(() => this.buffer.readInt32BE(this.cursorPosition + offset), 4 + offset);
    }


    public readFloatBE(offset: number = 0): number {
        return this.readSafelyAndMoveCursorPosition(() => this.buffer.readFloatBE(this.cursorPosition + offset), 4 + offset);
    }


    public readDoubleBE(offset: number = 0): number {
        return this.readSafelyAndMoveCursorPosition(() => this.buffer.readDoubleBE(this.cursorPosition + offset), 8 + offset);
    }

}