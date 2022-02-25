import { Drawing, DrawingStatus } from "../../../common/src/models/Drawing";

export class DrawingRepository {
    static async findCurrentDrawing(documentId: number): Promise<Drawing> {
        return await Drawing.getRepository().findOneOrFail({
            where: {
                documentId,
                status: DrawingStatus.CURRENT,
          },
       });
    }

    static async findSnapshotDrawingsSorted(documentId: number): Promise<Drawing[]> {
        return await Drawing.getRepository().find({
            where: {
                documentId,
                status: DrawingStatus.SNAPSHOT,
            },
            order: {
                orderIndex: "ASC",
            },
       });
    }
}
