import {
    GamePacket,
    OperationRequestGamePacketEventCode,
    OperationRequestSelfUserMoveGamePacket
} from "../models/GamePacketModels";
import {GamePacketBuilder} from "./PacketFactory";

// should avoid to use index to get item, im not sure about how safe it is
export class OperationRequestGamePacketFactory {

    private operationRequestGamePacketBuildersByEventCode = new Map<OperationRequestGamePacketEventCode, GamePacketBuilder>([
        [OperationRequestGamePacketEventCode.ON_USER_MOVE, OperationRequestGamePacketFactory.buildOperationRequestOnMoveUser]
    ]);

    public findBuilderFunctionByEventCode(eventCode: OperationRequestGamePacketEventCode) {
        return this.operationRequestGamePacketBuildersByEventCode.get(eventCode);
    }

    static buildOperationRequestOnMoveUser(parameters: Map<number, any>): GamePacket {
        const positionX = (parameters.get(1))?.at(0);
        const positionY = (parameters.get(1))?.at(1);
        console.log("on move" + positionX + " " + positionY);
        return new OperationRequestSelfUserMoveGamePacket(positionX, positionY);
    }

}
