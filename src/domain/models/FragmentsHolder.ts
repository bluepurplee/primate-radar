import {BufferCursor} from "../../utils/BufferCursor";
import {FragmentInfo} from "./GamePacketModels";

export class FragmentsHolder {
    public fragments: Map<number, Buffer>;
    public fragmentsNeeded: number;

    constructor(private fragmentInfo: FragmentInfo, private fragmentBuffer: Buffer) {
        this.fragmentsNeeded = fragmentInfo.fragmentCount;
        this.fragmentBuffer = fragmentBuffer;
        this.fragments = new Map<number, Buffer>().set(fragmentInfo.fragmentNumber, fragmentBuffer);
    }

    public areFragmentsComplete(): boolean {
        return this.fragmentsNeeded === this.fragments.size;
    }

    public addFragment(fragmentNumber: number, buffer: Buffer): Map<number, Buffer> {
        this.fragments.set(fragmentNumber, buffer);
        return this.fragments;
    }

    public concatAllFragments(): BufferCursor {
        return new BufferCursor(Buffer.concat(Array.from(this.fragments.values())));
    }
}