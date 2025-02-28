import {AlbionPacket, PhotonCommand} from "./models/GamePacketModels";
import {BufferCursor} from "../utils/BufferCursor";


export interface IPacketFactory {

    // can probably be merged together
    // + avoid expose the technical info about photon command
    BuildPhotonCommandFromBuffer(buffer: BufferCursor): PhotonCommand;
    BuildGamePacketFromPhotoCommand(command: PhotonCommand): AlbionPacket;

    // not sure if it is the right place
    assertThatUdpPayloadIsValid(buffer: BufferCursor): boolean;
}