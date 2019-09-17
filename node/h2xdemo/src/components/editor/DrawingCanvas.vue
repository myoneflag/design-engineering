<template>
    <div ref="canvasFrame" class="fullFrame">
        <drop
            @drop="onDrop"
        >
            <canvas ref="drawingCanvas" v-bind:style="{ backgroundColor: 'aliceblue', cursor: currentCursor}">

            </canvas>

            <ModeButtons
                    :mode.sync="mode"
                    v-if="currentTool.modesVisible"
            />

            <HydraulicsInsertPanel
                v-if="mode === 1"
                :flow-systems="document.drawing.flowSystems"
                @insert="hydraulicsInsert"
            />

            <PropertiesWindow
                    :selected-entity="selectedEntity"
                    :selected-object="selectedObject"
                    v-if="selectedObject && currentTool.propertiesVisible"
                    :mode="mode"
                    :on-change="scheduleDraw"
                    :on-delete="deleteSelected"
            >

            </PropertiesWindow>

            <Toolbar :current-tool-config="currentTool" :on-tool-click="changeTool"></Toolbar>
        </drop>
        <resize-observer @notify="draw"/>

    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {ViewPort} from '@/htmlcanvas/viewport';
    import {
        Background,
        ConnectableEntity,
        Coord,
        DocumentState,
        DrawableEntity,
        FlowSystemParameters,
    } from '@/store/document/types';
    import {drawPaperScale} from '@/htmlcanvas/scale';
    import ModeButtons from '@/components/editor/ModeButtons.vue';
    import PropertiesWindow from '@/components/editor/property-window/PropertiesWindow.vue';
    import {DrawingMode, MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
    import BackgroundLayer from '@/htmlcanvas/layers/background-layer';
    import * as TM from 'transformation-matrix';
    import {decomposeMatrix} from '@/htmlcanvas/utils';
    import Toolbar from '@/components/editor/Toolbar.vue';
    import LoadingScreen from '@/views/LoadingScreen.vue';
    import {MainEventBus} from '@/store/main-event-bus';
    import {ToolConfig} from '@/store/tools/types';
    import {DEFAULT_TOOL, ToolHandler} from '@/htmlcanvas/tools/tool';
    import uuid from 'uuid';
    import {renderPdf} from '@/api/pdf';
    import HydraulicsLayer from '@/htmlcanvas/layers/hydraulics-layer';
    import Layer from '@/htmlcanvas/layers/layer';
    import HydraulicsInsertPanel from '@/components/editor/HydraulicsInsertPanel.vue';
    import PointTool from '@/htmlcanvas/tools/point-tool';
    import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
    import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
    import * as _ from 'lodash';
    import ValveEntity from '@/store/document/entities/valveEntity';
    import PipeEntity from '@/store/document/entities/pipeEntity';
    import Flatten from '@flatten-js/core';
    import Connectable from '@/htmlcanvas/lib/object-traits/connectable';
    import Pipe from '@/htmlcanvas/objects/pipe';
    import {EntityType} from '@/store/document/entities/types';
    import {Interaction, InteractionType} from '@/htmlcanvas/tools/interaction';
    import {Catalog} from "@/store/catalog/types";

    @Component({
        components: {
            LoadingScreen,
            HydraulicsInsertPanel, Overlay: LoadingScreen, Toolbar, PropertiesWindow, ModeButtons},
    })
    export default class DrawingCanvas extends Vue {

        ctx: CanvasRenderingContext2D | null = null;

        grabbedPoint: Coord | null = null;
        hasDragged: boolean = false;

        viewPort: ViewPort = new ViewPort(TM.transform(TM.translate(0, 0), TM.scale(100)), 10000, 10000);
        internalMode: DrawingMode = DrawingMode.FloorPlan;

        // The layers
        backgroundLayer!: BackgroundLayer;
        hydraulicsLayer!: HydraulicsLayer;
        allLayers: Layer[] = [];


        toolHandler: ToolHandler | null = null;
        currentCursor: string = 'auto';

        shouldDraw: boolean = true;
        lastDraw: number = 0;


        // The currently hovered element ready for interaction.
        interactive: BackedDrawableObject<DrawableEntity> | null = null;

        objectStore: Map<string, BackedDrawableObject<DrawableEntity>> =
            new Map<string, BackedDrawableObject<DrawableEntity>>();

        updating: boolean = false;

        mounted() {
            this.ctx = (this.$refs.drawingCanvas as any).getContext('2d');

            MainEventBus.$on('ot-applied', this.onOT);
            MainEventBus.$on('set-tool-handler', this.setToolHandler);

            (this.$refs.drawingCanvas as any).onmousedown = this.onMouseDown;
            (this.$refs.drawingCanvas as any).onmousemove = this.onMouseMove;
            (this.$refs.drawingCanvas as any).onmouseup = this.onMouseUp;
            (this.$refs.drawingCanvas as any).onwheel = this.onWheel;

            this.backgroundLayer = new BackgroundLayer(
                this.objectStore,
                () => {
                    this.scheduleDraw();
                },
                (object, drawable) => {
                    this.scheduleDraw();
                },
                () => { // onCommit
                    this.$store.dispatch('document/commit');
                },
            );
            this.hydraulicsLayer = new HydraulicsLayer(
                this.objectStore,
                () => {
                    this.scheduleDraw();
                },
                (selectedObject: BackedDrawableObject<DrawableEntity> | null) => {
                    this.scheduleDraw();
                },
                () => {
                    this.$store.dispatch('document/commit');
                },
            );

            this.allLayers.push(this.backgroundLayer, this.hydraulicsLayer);
            this.processDocument();

            setInterval(this.drawLoop, 20);
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get activeLayer(): Layer | null {
            if (this.mode === DrawingMode.FloorPlan) {
                return this.backgroundLayer;
            } else if (this.mode === DrawingMode.Hydraulics) {
                return this.hydraulicsLayer;
            }
            return null;
        }


        get currentTool(): ToolConfig {
            if (this.toolHandler) {
                return this.toolHandler.config;
            } else {
                return DEFAULT_TOOL;
            }
        }

        get mode() {
            return this.internalMode;
        }
        set mode(value) {
            this.internalMode = value;
            this.processDocument();
        }

        onOT(redraw: boolean = true) {
            this.processDocument(redraw);
        }

        setToolHandler(toolHandler: ToolHandler) {
            this.toolHandler = toolHandler;
            this.scheduleDraw();
        }

        get selectedEntity() {
            if (this.mode === DrawingMode.FloorPlan) {
                if (this.backgroundLayer) {
                    return this.backgroundLayer.selectedEntity;
                } else {
                    return null;
                }
            } else if (this.mode === DrawingMode.Hydraulics) {
                if (this.hydraulicsLayer) {
                    return this.hydraulicsLayer.selectedEntity;
                } else {
                    return null;
                }
            }
            return null;
        }

        get selectedObject() {
            if (this.mode === DrawingMode.FloorPlan) {
                if (this.backgroundLayer) {
                    return this.backgroundLayer.selectedObject;
                } else {
                    return null;
                }
            } else if (this.mode === DrawingMode.Hydraulics) {
                if (this.hydraulicsLayer) {
                    return this.hydraulicsLayer.selectedObject;
                } else {
                    return null;
                }
            }
            return null;
        }

        deleteFromHydraulicsLayerSoft(object: BackedDrawableObject<DrawableEntity>) {
            const toDelete = object.prepareDelete();
            toDelete.forEach((drawableObject) => {
                const index = this.document.drawing.entities.findIndex((b) => b.uid === drawableObject.uid);
                this.document.drawing.entities.splice(index, 1);
            });
        }

        deleteSelected() {
            if (this.mode === DrawingMode.FloorPlan) {
                const background: Background = this.selectedEntity as Background;
                const index = this.document.drawing.backgrounds.findIndex((b) => b.uid === background.uid);
                this.document.drawing.backgrounds.splice(index, 1);
                this.$store.dispatch('document/commit');
            } else if (this.mode === DrawingMode.Hydraulics) {
                if (this.selectedObject) {
                    this.deleteFromHydraulicsLayerSoft(this.selectedObject as BackedDrawableObject<DrawableEntity>);
                    this.$store.dispatch('document/commit');
                } else {
                    throw new Error('Delete was called but we didn\'t select anything');
                }
            }
        }

        changeTool(tool: ToolConfig) {
            if (tool.name === DEFAULT_TOOL.name) {
                this.$emit('set-tool-handler', null);
            }
        }

        processDocument(redraw: boolean = true) {
            this.updating = true;
            this.allLayers.forEach((l) => l.update(this.document));
            this.updating = false;
            // finally, draw
            if (redraw) {
                this.scheduleDraw();
            }
        }

        scheduleDraw() {
            if (Date.now() - this.lastDraw < 25) {
                this.shouldDraw = true;
            } else if (this.updating) {
                this.shouldDraw = true;
            } else if (this.shouldDraw) {
                this.shouldDraw = true;
            } else { // throttle rendering.
                this.draw();
            }
        }

        drawLoop() {
            if (this.shouldDraw) {
                this.shouldDraw = false;
                try {
                    this.draw();
                } catch {
                    //
                }
            }
        }

        insertFlowSource(system: FlowSystemParameters) {
            MainEventBus.$emit('set-tool-handler', new PointTool(
                () => {
                    MainEventBus.$emit('set-tool-handler', null);
                },
                (wc: Coord) => {
                    // Preview
                },
                (wc: Coord) => {
                    const doc = this.document as DocumentState;

                    // Maybe we drew onto a background
                    const floor = this.backgroundLayer.getBackgroundAt(wc, this.objectStore);
                    let parentUid: string | null = null;
                    let oc = _.cloneDeep(wc);
                    if (floor != null) {
                        parentUid = floor.stateObject.uid;
                        oc = floor.toObjectCoord(wc);
                    }

                    const newEntity: FlowSourceEntity = {
                        connections: [],
                        center: oc,
                        color: null,
                        heightAboveFloorM: 0,
                        material: null,
                        maximumVelocityMS: null,
                        parentUid,
                        pressureKPA: 0,
                        diameterMM: 100,
                        spareCapacity: null,
                        systemUid: system.uid,
                        temperatureC: null,
                        type: EntityType.FLOW_SOURCE,
                        uid: uuid(),
                    };
                    doc.drawing.entities.push(newEntity);
                    this.$store.dispatch('document/commit');
                },
            ));
        }

        insertFlowSink(system: FlowSystemParameters) {
            window.alert('No can do returns just yet');
        }

        insertPipes(system: FlowSystemParameters) {
            // strategy:
            // 1. create new pipe at click point
            // 2. endpoint of pipe is at 2nd click point and follows the move in order to preview
            // 3. clicking creates new pipe with start point the same as endpoint.
            MainEventBus.$emit('set-tool-handler', new PointTool(
                (interrupted) => {
                    MainEventBus.$emit('set-tool-handler', null);
                },
                (wc: Coord, event: MouseEvent) => {
                    // Preview
                    this.offerInteraction(
                        {
                            type: InteractionType.STARTING_PIPE,
                            wc,
                        },
                        (object) => {
                            return object.stateObject.type === EntityType.VALVE
                                || object.stateObject.type === EntityType.FLOW_SOURCE
                                || object.stateObject.type === EntityType.FLOW_SINK;
                        },
                    );
                },
                (wc: Coord, event: MouseEvent) => {
                    // Create a valve. It will only have a single pipe, and thus be a dead-leg.
                    const doc = this.document as DocumentState;

                    // maybe we drew onto an existing node.
                    let entity: ConnectableEntity | ValveEntity;
                    if (this.interactive && this.interactive.type !== EntityType.BACKGROUND_IMAGE) {
                        entity = this.interactive.stateObject as ConnectableEntity;
                        this.hydraulicsLayer.onSelected(this.interactive);
                    } else {
                        // Maybe we drew onto a background
                        const [parentUid, oc] = this.getInsertCoordsAt(wc);

                        // Nope, we landed on nothing. We create new valve here.
                        entity = {
                            center: oc,
                            color: null,
                            connections: [],
                            parentUid,
                            systemUid: system.uid,
                            type: EntityType.VALVE,
                            uid: uuid(),
                            // These names should come from databases.
                            valveType: 'fitting',
                        };
                        doc.drawing.entities.push(entity);
                    }

                    this.$store.dispatch('document/commit').then(() => {
                        this.interactive = null;
                        this.insertPipeChain(entity, system.uid);
                    });
                },
            ));
        }

        getInsertCoordsAt(wc: Coord): [string | null, Coord] {
            const floor = this.backgroundLayer.getBackgroundAt(wc, this.objectStore);
            let parentUid: string | null = null;
            let oc = _.cloneDeep(wc);
            if (floor != null) {
                parentUid = floor.stateObject.uid;
                oc = floor.toObjectCoord(wc);
            }
            return [parentUid, oc];
        }

        insertPipeChain(lastAttachment: ConnectableEntity, systemUid: string) {
            let nextEntity: ConnectableEntity | ValveEntity;
            let nextEntityWasNew: boolean = false;
            let pipe: PipeEntity;
            const pipeUid = uuid();
            MainEventBus.$emit('set-tool-handler', new PointTool(
                (interrupted) => {
                    MainEventBus.$emit('set-tool-handler', null);
                    if (interrupted) {
                        // revert changes.
                        this.$store.dispatch('document/revert').then(() => {

                            // it's possible that we are drawing the first connection, in which case we will have an
                            // orphaned valve. Delete it.
                            if (lastAttachment.connections.length === 0) {
                                const index = this.document.drawing.entities.findIndex((b) => b.uid === lastAttachment.uid);
                                this.document.drawing.entities.splice(index, 1);
                            }
                            this.$store.dispatch('document/commit');
                        });
                    }
                },
                (wc: Coord, event: MouseEvent) => {

                    let needUpdate: boolean = false;

                    // create pipe
                    if (!pipe) {
                        pipe = {
                            color: null,
                            diameterMM: null,
                            lengthM: null,
                            endpointUid: [lastAttachment.uid, lastAttachment.uid],
                            heightAboveFloorM: 0.7,
                            material: null,
                            maximumVelocityMS: null,
                            parentUid: null,
                            systemUid,
                            type: EntityType.PIPE,
                            uid: pipeUid,
                        };
                        this.document.drawing.entities.push(pipe);
                        (this.document.drawing.entities.find((e) => e.uid === lastAttachment.uid) as ConnectableEntity)
                            .connections.push(pipe.uid);
                        // this.processDocument();
                        needUpdate = true;
                    }


                    // maybe we drew onto an existing node.
                    const exclude = [];
                    if (nextEntityWasNew && nextEntity) {
                        exclude.push(nextEntity.uid);
                    }
                    const object = this.hydraulicsLayer.getObjectAt(wc, exclude) as BackedDrawableObject<DrawableEntity>;
                    if (object &&
                        (
                            object.stateObject.type === EntityType.VALVE
                            || object.stateObject.type === EntityType.FLOW_SOURCE
                            || object.stateObject.type === EntityType.FLOW_SINK
                        )
                    ) {
                        if (nextEntityWasNew && nextEntity !== null) {
                            // delete the no longer needed new phantom pipe
                            const index = this.document.drawing.entities.findIndex((e) => e.uid === nextEntity.uid);
                            this.document.drawing.entities.splice(index, 1);
                            needUpdate = true;
                        }

                        if (!nextEntityWasNew) {
                            if (nextEntity) {
                                nextEntity.connections.splice(nextEntity.connections.indexOf(pipeUid), 1);
                            }
                        }

                        nextEntity = object.stateObject as ConnectableEntity;
                        nextEntity.connections.push(pipeUid);
                        this.hydraulicsLayer.selectedObject = object;
                        nextEntityWasNew = false;
                    } else {
                        this.hydraulicsLayer.selectedObject = null;
                        if (!event.shiftKey) {
                            // Snap onto a direction.

                            const bases = [Flatten.vector(0, 1)];
                            const connectable = this.objectStore.get(lastAttachment.uid) as
                                (BackedDrawableObject<ConnectableEntity> & Connectable);

                            const lawc = connectable.fromParentToWorldCoord(lastAttachment.center);
                            const lawcp = Flatten.point(lawc.x, lawc.y);
                            const wcp = Flatten.point(wc.x, wc.y);
                            connectable.getRadials(pipeUid).forEach(([radialWc, obj]) => {
                                // right now, we don't need a uid check because we are guaranteed that the state was
                                // reset.
                                bases.push(Flatten.vector(lawcp, Flatten.point(radialWc.x, radialWc.y)));
                            });


                            let bestPoint: [number, Flatten.Point] = [Infinity, wcp];
                            bases.forEach((dirVec) => {
                                for (let i = 0; i < 4; i++) {
                                    const thisPoint = wcp.projectionOn(Flatten.line(lawcp, dirVec));
                                    const dist = thisPoint.distanceTo(wcp)[0];
                                    if (dist < bestPoint[0]) {
                                        bestPoint = [dist, thisPoint];
                                    }
                                    dirVec = dirVec.rotate90CCW();
                                }
                            });

                            wc.x = bestPoint[1].x;
                            wc.y = bestPoint[1].y;

                        }

                        // Maybe we drew onto a background
                        const floor = this.backgroundLayer.getBackgroundAt(wc, this.objectStore);
                        let parentUid: string | null = null;
                        let oc = _.cloneDeep(wc);
                        if (floor != null) {
                            parentUid = floor.stateObject.uid;
                            oc = floor.toObjectCoord(wc);
                        }

                        if (nextEntityWasNew) {
                            const oldpar = nextEntity.parentUid;
                            nextEntity.center = oc;
                            nextEntity.parentUid = parentUid;
                            if (oldpar !== parentUid) {
                                needUpdate = true;
                            }
                        } else {
                            if (nextEntity) {
                                nextEntity.connections.splice(nextEntity.connections.indexOf(pipeUid), 1);
                            }

                            // Create 2nd valve
                            nextEntity = {
                                center: oc,
                                color: null,
                                connections: [pipeUid],
                                parentUid,
                                systemUid,
                                type: EntityType.VALVE,
                                uid: uuid(),
                                // These names should come from databases.
                                valveType: 'fitting',
                            };
                            this.document.drawing.entities.push(nextEntity);
                            needUpdate = true;
                        }

                        nextEntityWasNew = true;
                    }

                    pipe.endpointUid.splice(1, 1, nextEntity.uid);

                    if (needUpdate) {
                        this.processDocument();
                    } else {
                        this.scheduleDraw();
                    }
                },

                (wc: Coord) => {
                    this.interactive = null;
                    // committed to the point. And also create new pipe, continue the chain.
                    if (nextEntity && lastAttachment.uid !== nextEntity.uid) {
                        this.$store.dispatch('document/commit').then(() => {
                            this.insertPipeChain(nextEntity, systemUid);
                        });
                    } else {
                        // end
                        this.$store.dispatch('document/revert').then(() => {
                            // it's possible that we are drawing the first connection, in which case we will have an
                            // orphaned valve. Delete it.
                            if (lastAttachment.connections.length === 0) {
                                const index = this.document.drawing.entities.findIndex((b) => b.uid === lastAttachment.uid);
                                this.document.drawing.entities.splice(index, 1);
                            }
                            this.$store.dispatch('document/commit');
                        });
                    }
                },
            ));
        }

        offerInteraction(
            interaction: Interaction,
            filter?: (object: BackedDrawableObject<DrawableEntity>) => boolean,
        ): BackedDrawableObject<DrawableEntity> | null {
            for (let i = this.allLayers.length - 1; i >= 0; i--) {
                this.interactive = this.allLayers[i].offerInteraction(interaction, filter);
                if (this.interactive) {
                    this.scheduleDraw();
                    return this.interactive;
                }
            }
            this.scheduleDraw();
            return this.interactive;
        }

        insertValve(system: FlowSystemParameters) {

            let pipe: Pipe | null = null;

            MainEventBus.$emit('set-tool-handler', new PointTool(
                (interrupted) => {
                    if (interrupted) {
                        this.$store.dispatch('document/revert').then(() => {
                            MainEventBus.$emit('set-tool-handler', null);
                            this.$store.dispatch('document/commit');
                        });
                    }
                },
                (wc, event) => {
                    this.$store.dispatch('document/revert', false).then(() => {

                        this.offerInteraction(
                            {
                                type: InteractionType.INSERT,
                                wc,
                            },
                            (drawable) => {
                                return drawable.type === EntityType.PIPE;
                            },
                        );

                        if (this.interactive) {
                            pipe = this.interactive as Pipe;
                            // Project onto pipe

                            wc = pipe.project(wc);

                            // Maybe we drew onto a background
                            const floor = this.backgroundLayer.getBackgroundAt(wc, this.objectStore);
                            let parentUid: string | null = null;
                            let oc = _.cloneDeep(wc);
                            if (floor != null) {
                                parentUid = floor.stateObject.uid;
                                oc = floor.toObjectCoord(wc);
                            }

                            const pipe1uid = uuid();
                            const pipe2uid = uuid();

                            const newValve: ValveEntity = {
                                center: oc,
                                color: null,
                                connections: [pipe1uid, pipe2uid],
                                parentUid,
                                systemUid: system.uid,
                                type: EntityType.VALVE,
                                uid: uuid(),
                                valveType: 'fitting',
                            };

                            const newPipe1: PipeEntity = {
                                color: pipe.stateObject.color,
                                diameterMM: pipe.stateObject.diameterMM,
                                endpointUid: [newValve.uid, pipe.stateObject.endpointUid[0]],
                                heightAboveFloorM: pipe.stateObject.heightAboveFloorM,
                                lengthM: null,
                                material: pipe.stateObject.material,
                                maximumVelocityMS: pipe.stateObject.maximumVelocityMS,
                                parentUid: null,
                                systemUid: pipe.stateObject.systemUid,
                                type: EntityType.PIPE,
                                uid: pipe1uid,
                            };

                            const newPipe2: PipeEntity = {
                                color: pipe.stateObject.color,
                                diameterMM: pipe.stateObject.diameterMM,
                                endpointUid: [newValve.uid, pipe.stateObject.endpointUid[1]],
                                heightAboveFloorM: pipe.stateObject.heightAboveFloorM,
                                lengthM: null,
                                material: pipe.stateObject.material,
                                maximumVelocityMS: pipe.stateObject.maximumVelocityMS,
                                parentUid: null,
                                systemUid: pipe.stateObject.systemUid,
                                type: EntityType.PIPE,
                                uid: pipe2uid,
                            };

                            (this.document.drawing.entities.find(
                                (o) => o.uid === pipe!.stateObject.endpointUid[0]) as ConnectableEntity
                            ).connections.push(newPipe1.uid);
                            (this.document.drawing.entities.find(
                                (o) => o.uid === pipe!.stateObject.endpointUid[1]) as ConnectableEntity
                            ).connections.push(newPipe2.uid);

                            this.document.drawing.entities.push(newValve, newPipe1, newPipe2);
                            this.processDocument();
                        } else {
                            pipe = null;
                        }
                    });
                },
                (worldCoord, event) => {
                    this.interactive = null;
                    MainEventBus.$emit('set-tool-handler', null);
                    if (pipe) {
                        this.deleteFromHydraulicsLayerSoft(pipe);
                    }
                    this.$store.dispatch('document/commit');
                },
            ));
        }


        hydraulicsInsert({entityName, system}: {entityName: string, system: FlowSystemParameters}) {

            this.hydraulicsLayer.onSelected(null);

            if (entityName === EntityType.FLOW_SOURCE) {
                this.insertFlowSource(system);
            } else if (entityName === EntityType.FLOW_SINK) {
                this.insertFlowSink(system);
            } else if (entityName === EntityType.PIPE) {
                this.insertPipes(system);
            } else if (entityName === EntityType.VALVE) {
                this.insertValve(system);
            }
        }

        // For this to work, there is to be no local state at all. All state is to be stored in the vue store,
        // which is serialised by snapshots and operation transforms.
        draw() {
            this.lastDraw = Date.now();
            if (this.ctx != null && (this.$refs.canvasFrame as any) != null) {
                const ctx: CanvasRenderingContext2D = this.ctx;

                const width = (this.$refs.canvasFrame as any).clientWidth - 1;
                const height = (this.$refs.canvasFrame as any).clientHeight;
                ctx.canvas.width = width;
                ctx.canvas.height = height;

                this.viewPort.width = width;
                this.viewPort.height = height;

                this.backgroundLayer.draw(ctx, this.viewPort, this.mode === DrawingMode.FloorPlan, this.currentTool);
                this.hydraulicsLayer.draw(ctx, this.viewPort, this.mode === DrawingMode.Hydraulics);

                // Draw hydraulics layer

                // Draw selection layers
                if (this.activeLayer) {
                    this.activeLayer.drawSelectionLayer(ctx, this.viewPort, this.interactive);
                }

                drawPaperScale(ctx, 1 / decomposeMatrix(this.viewPort.position).sx);
            }
        }

        onDrop(value: any, event: DragEvent) {
            if (event.dataTransfer) {
                event.preventDefault();
                for (let i = 0; i < event.dataTransfer.files.length; i++) {
                    if (!(event.dataTransfer.files.item(i) as File).name.endsWith('pdf')) {
                        continue;
                    }


                    const w = this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});

                    renderPdf(
                        event.dataTransfer.files.item(i) as File,
                        ({paperSize, scale, scaleName, uri, totalPages},
                        ) => {

                        const width = paperSize.widthMM / scale;
                        const height = paperSize.heightMM / scale;
                        // We create the operation here, not the server.
                        const background: Background = {
                            parentUid: null,
                            type: EntityType.BACKGROUND_IMAGE,
                            center: w,
                            crop: {x: -width / 2, y: -height / 2, w: width, h: height},
                            offset: {x: 0, y: 0},
                            page: 1,
                            paperSize,
                            pointA: null,
                            pointB: null,
                            rotation: 0,
                            scaleFactor: 1,
                            scaleName,
                            uid: uuid(),
                            totalPages,
                            uri,
                        };

                        this.$store.dispatch('document/addBackground', {background});
                        this.$store.dispatch('document/commit');
                    });
                }
            }
        }

        onMouseDown(event: MouseEvent): boolean {
            if (this.toolHandler) {
                if (this.toolHandler.onMouseDown(event, this.viewPort)) {
                    return true;
                }
            } else {

                // Pass the event down to layers below
                if (this.activeLayer) {

                    if (this.activeLayer.onMouseDown(event, this.viewPort)) {
                        return true;
                    }
                }
            }

            // If no objects or tools wanted the events, we can always drag and shit.
            this.grabbedPoint = this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});
            this.hasDragged = false;
            return true;
        }

        onMouseMove(event: MouseEvent): boolean {
            if (event.movementX === 0 && event.movementY === 0) {
                return true; // Phantom movement - damn it chrome
            }
            const res = this.onMouseMoveInternal(event);
            if (res.cursor) {
                this.currentCursor = res.cursor;
            } else {
                this.currentCursor = this.currentTool.defaultCursor;
            }
            return res.handled;
        }

        onMouseMoveInternal(event: MouseEvent): MouseMoveResult {
            if (this.toolHandler) {
                const res = this.toolHandler.onMouseMove(event, this.viewPort);
                if (res.handled) {
                    return res;
                }
            } else {
                // Pass the event down to layers below
                if (this.activeLayer) {
                    const res = this.activeLayer.onMouseMove(event, this.viewPort);
                    if (res.handled) {
                        return res;
                    }
                }
            }

            if (event.buttons && 1) {
                if (this.grabbedPoint != null) {
                    const s = this.viewPort.toScreenCoord(this.grabbedPoint);
                    this.hasDragged = true;
                    this.viewPort.panAbs(s.x - event.offsetX, s.y - event.offsetY);
                    this.scheduleDraw();
                    return {handled: true, cursor: 'Move'};
                } else {
                    return UNHANDLED;
                }
            } else {
                this.grabbedPoint = null;
                this.hasDragged = false;
                return UNHANDLED;
            }
        }

        onMouseUp(event: MouseEvent): boolean {

            if (this.grabbedPoint) {
                this.grabbedPoint = null;
                const wasDragged = this.hasDragged;
                this.hasDragged = false;
                if (wasDragged) {
                    return true;
                }
            }

            if (this.toolHandler) {
                if (this.toolHandler.onMouseUp(event, this.viewPort)) {
                    return true;
                }
            } else {
                // Pass the event down to layers below
                if (this.activeLayer) {
                    if (this.activeLayer.onMouseUp(event, this.viewPort)) {
                        return true;
                    }
                }
            }
            return false;
        }

        onWheel(event: WheelEvent) {
            event.preventDefault();
            let delta = 1 + event.deltaY / 500;
            if (event.deltaY < 0) {
                delta = 1 / (1 - event.deltaY / 500);
            }
            this.viewPort.rescale(delta, event.offsetX, event.offsetY);
            this.scheduleDraw();
        }
    }

</script>

<style lang="css">
    body {
        height: 100%;
        overflow: hidden;
    }

    .fullFrame {
        width:100%;
        height: -webkit-calc(100vh - 65px);
    }
</style>
