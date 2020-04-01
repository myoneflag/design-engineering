import { Document, DocumentStatus } from "../../common/src/models/Document";
import { initialDrawing } from "../../common/src/api/document/drawing";
import { cloneSimple } from "../../common/src/lib/utils";
import { Operation } from "../../common/src/models/Operation";
import { OPERATION_NAMES } from "../../common/src/api/document/operation-transforms";
import { applyDiffNative } from "../../common/src/api/document/state-ot-apply";
import {
    CURRENT_VERSION, upgrade10to11,
    upgrade4to5,
    upgrade5to6,
    upgrade6to7,
    upgrade7to8,
    upgrade8to9,
    upgrade9to10
} from "../../common/src/api/upgrade";
import { diffState } from "../../common/src/api/document/state-differ";
import stringify from "json-stable-stringify";

export async function upgradeDocument(doc: Document) {
    const drawing = getInitialDrawing(doc);
    let upgraded = getInitialDrawing();

    if (doc.version >= CURRENT_VERSION) {
        return;
    }




    const ops = await Operation.createQueryBuilder('operation')
        .leftJoinAndSelect('operation.blame', 'user')
        .where('operation.document = :document', {document: doc.id})
        .orderBy('operation.orderIndex', "ASC")
        .getMany();

    if (doc.state === DocumentStatus.DELETED) {
        console.log("skipping deleted document (" + doc.id + ") " + doc.metadata.title + ' with ' + ops.length + ' ops');
        return;
    }
    console.log("Upgrading document (" + doc.id + ") " + doc.metadata.title + " from version "  + doc.version + '. Has ops ' + ops.length + ' ');

    let opsUpgraded = 0;
    for (const op of ops) {
        switch (op.operation.type) {
            case OPERATION_NAMES.DIFF_OPERATION:
                applyDiffNative(drawing, op.operation.diff);

                const newUpgraded = cloneSimple(drawing);
                let updated = false;
                switch (doc.version) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        throw new Error('Version too old');
                    // noinspection FallThroughInSwitchStatementJS
                    case 4:
                        upgrade4to5(newUpgraded);
                    // noinspection FallThroughInSwitchStatementJS
                    case 5:
                        upgrade5to6(newUpgraded);
                    // noinspection FallThroughInSwitchStatementJS
                    case 6:
                    // noinspection FallThroughInSwitchStatementJS
                        upgrade6to7(newUpgraded);
                    // noinspection FallThroughInSwitchStatementJS
                    case 7:
                        upgrade7to8(newUpgraded);
                    // noinspection FallThroughInSwitchStatementJS
                    case 8:
                        upgrade8to9(newUpgraded);
                        break;
                    case 9:
                        upgrade9to10(newUpgraded);
                        break;
                    case 10:
                        upgrade10to11(newUpgraded);
                        break;
                    case CURRENT_VERSION:
                        break;
                }

                const upgradedOps = cloneSimple(diffState(upgraded, newUpgraded, undefined));
                upgraded = newUpgraded;
                if (upgradedOps.length) {
                    if (upgradedOps[0].type === OPERATION_NAMES.DIFF_OPERATION) {
                        if (stringify(op.operation) !== stringify(upgradedOps[0]) ) {
                            opsUpgraded ++;
                            op.operation = upgradedOps[0];
                            await op.save();
                        }
                    } else {
                        throw new Error('diffState returned something unusual');
                    }
                } else {
                    await op.remove();
                }
                break;
            case OPERATION_NAMES.COMMITTED_OPERATION:
                break;
        }
    }

    if (opsUpgraded) {
        console.log("upgraded " + opsUpgraded + " operations");
    } else {
        console.log("All good, no changes made");
    }

    // upgrade
    doc.version = CURRENT_VERSION;

    doc.metadata = drawing.metadata.generalInfo;
    await doc.save();
}

export function getInitialDrawing(doc?: Document) {
    return cloneSimple(initialDrawing);
}


