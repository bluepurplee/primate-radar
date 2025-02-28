import {BufferCursor} from "../../utils/BufferCursor";
import Protocol16Deserializer from "../../utils/Protocol16Deserializer";
import {FragmentsHolderCache} from "../models/FragmentsHolderCache";
import {
    AlbionPacket,
    EventGamePacketEventCode,
    FragmentInfo,
    GamePacket,
    MessageType,
    PacketType,
    PhotonCommand,
    PhotonCommandType,
    UnhandledGameEvent
} from "../models/GamePacketModels";

import {FragmentsHolder} from "../models/FragmentsHolder";
import {EventGamePacketFactory} from "./EventGamePacketFactory";
import {OperationRequestGamePacketFactory} from "./OperationRequestGamePacketFactory";
import {IPacketFactory} from "../IPacketFactory";

export type GamePacketBuilder = (parameters: Map<number, any>) => GamePacket;

export class PacketFactory implements IPacketFactory {

    private PHOTON_HEADER_LENGTH_IN_BYTES = 12;
    private fragmentsHolderCache;

    constructor(private readonly eventGamePacketFactory: EventGamePacketFactory,
                private readonly operationRequestGamePacketFactory: OperationRequestGamePacketFactory) {
        this.eventGamePacketFactory = eventGamePacketFactory;
        this.operationRequestGamePacketFactory = operationRequestGamePacketFactory;
        this.fragmentsHolderCache = new FragmentsHolderCache();
    }

    public BuildGamePacketFromPhotoCommand(command: PhotonCommand): AlbionPacket {
        switch (command.commandType) {
            case PhotonCommandType.RELIABLE_TYPE:
                return this.buildGamePacket(command.data);
            case PhotonCommandType.UNRELIABLE_TYPE:
                const test = command.data.subarray(4);
                try {
                    const number = test.getBuffer()


                    // console.log(number);
                    const result =  this.buildGamePacket(test);
                    // console.log(result);
                    return result;
                } catch(error) {
                    // console.log("fuck");
                    return new AlbionPacket(PacketType.OTHER);
                }
            case PhotonCommandType.FRAGMENT_TYPE:
                return this.handleFragmentCommand(command.data);
            default:
                return new AlbionPacket(PacketType.OTHER);
        }
    }

    public BuildPhotonCommandFromBuffer(buffer: BufferCursor): PhotonCommand {
        const photoCommandType = buffer.readUInt8();
        const commandLength = buffer.readInt32BE(3); // channelId uInt8 commandFlags uInt8 ? unknown uInt8?
        buffer.moveCursorPosition(4); // sequenceNumber 32BE ?
        return {
            commandType: photoCommandType,
            commandLength,
            data: new BufferCursor(buffer.subarray(commandLength - this.PHOTON_HEADER_LENGTH_IN_BYTES).getBuffer())
        };
    }

    public assertThatUdpPayloadIsValid(buffer: BufferCursor): boolean {
        const bufferCopy = new Buffer([]);
        const result = buffer.length > this.PHOTON_HEADER_LENGTH_IN_BYTES;
        if (result) {

            const lol = buffer.getBuffer().readInt32BE(4);
            if (lol < 0 || lol > 666) return false;
        }
        return buffer.length > this.PHOTON_HEADER_LENGTH_IN_BYTES;
    }


    private handleFragmentCommand(commandBuffer: BufferCursor): AlbionPacket {
        const fragmentInfo = this.buildFragmentInfoFromBuffer(commandBuffer);
        const holder = this.fragmentsHolderCache.getFromCache(fragmentInfo.sequenceNumber)
            .ifPresentThen((holder: FragmentsHolder) => holder.addFragment(fragmentInfo.fragmentNumber, commandBuffer.getBuffer()))
            .orElse(() => new FragmentsHolder(fragmentInfo, commandBuffer.getBuffer()));

        if (holder.areFragmentsComplete()) {
            this.fragmentsHolderCache.delete(fragmentInfo.sequenceNumber);
            return this.buildGamePacket(holder.concatAllFragments());
        } else {
            this.fragmentsHolderCache.set(fragmentInfo.sequenceNumber, holder);
            return new AlbionPacket(PacketType.FRAGMENT);
        }
    }

    private buildFragmentInfoFromBuffer(buffer: BufferCursor): FragmentInfo {
        return {
            sequenceNumber: buffer.readInt32BE(),
            fragmentCount: buffer.readInt32BE(),
            fragmentNumber: buffer.readInt32BE(),
            totalLength: buffer.readInt32BE(),
            fragmentOffset: buffer.readInt32BE()
        }
    }

    private buildGamePacket(buffer: BufferCursor): GamePacket {
        const messageType = buffer.readUInt8(1); // signature uInt8 ??

        switch (messageType) {
            case MessageType.OPERATION_REQUEST:
                return this.buildOperationRequestEvent(buffer);
            case MessageType.EVENT:
                return this.buildEventGamePacket(buffer);
            case MessageType.OTHER_OPERATION_RESPONSE:
            case MessageType.OPERATION_RESPONSE:
                return this.buildOperationResponseGameEvent(buffer);
            default:
                return new UnhandledGameEvent();
        }
    }

    private buildEventGamePacket (buffer: BufferCursor): GamePacket {
        const eventCode = buffer.readUInt8();
        const parameters = this.buildParameterMapFromBuffer(buffer);
       if (eventCode === EventGamePacketEventCode.ON_ENTITY_MOVE) parameters.set(252, 3);

        if (parameters.get(252) === 3) {
            console.log(parameters);
        }
        const builder = this.eventGamePacketFactory.findBuilderFunctionByEventCode(parameters.get(252));
        if (builder) {
            return builder(parameters);
        } else {
            return new UnhandledGameEvent(parameters);
        }
    }

    private buildOperationRequestEvent (buffer: BufferCursor): GamePacket {
        buffer.moveCursorPosition(1); // random eventCode uInt8
        const parameters = this.buildParameterMapFromBuffer(buffer);
        const eventCode = parameters.get(253);

        const builder = this.operationRequestGamePacketFactory.findBuilderFunctionByEventCode(eventCode);
        return builder?.(parameters) ?? new UnhandledGameEvent(parameters);
    }

    private buildOperationResponseGameEvent(buffer: BufferCursor): GamePacket {
        buffer.moveCursorPosition(3); // operationCode uInt8 ? operationResponseCode uInt16BE ?
        const someTypeCode = buffer.readUInt8(); // i don't really know what is
        const someValue = Protocol16Deserializer.deserialize(buffer, someTypeCode); // looks cool but unknown
        const parameters = this.buildParameterMapFromBuffer(buffer);
        // should implement builder for operation responses as parameters contains all the necessary data
        // but not necessary for now
        return new UnhandledGameEvent(parameters);
    }

    private buildParameterMapFromBuffer(eventTypeBuffer: BufferCursor): Map<number, any> {
        const parameters = new Map<number, any>();
        const parameterCount = eventTypeBuffer.readInt16BE();
        for ( let _= 0 ; _ < parameterCount ; _++ ) {
            const paramId = eventTypeBuffer.readUInt8();
            const paramType = eventTypeBuffer.readUInt8();
            parameters.set(paramId, Protocol16Deserializer.deserialize(eventTypeBuffer, paramType));
        }
        return parameters;
    }
}