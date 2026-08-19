export type GLBModel = {
    id: number;
    name: string;
    fileName: string;
    initialConfig?: {
        scale?: number
        position?: number[]
    }
    vehicleId?: number[] // associated vehicle Ids
}

export const VEHICLES: GLBModel[] = [
    {
        id: 0,
        name: "RAM 2500HD CC",
        fileName: "RAM 2500HD CC.glb",
        initialConfig: {
            scale: 1,
        },
        vehicleId: [0]
    },
    {
        id: 1,
        name: "Chevrolet express 3500",
        fileName: "Chevrolet express 3500.glb",
        initialConfig: {
            scale: 1,
        },
        vehicleId: [0]
    },
]

export const UPFITS:GLBModel[] = [
    {
        id: 0,
        name: "RAM-2500HD-CC Body",
        fileName: "RAM 2500HD CC 696j Body.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleId: [0]
    },
    {
        id: 1,
        name: "RAM-2500HD-CC Body",
        fileName: "RAM 2500HD CC 696j Utility Rack.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleId: [0]
    },
    {
        id: 2,
        name: "Chev express 3500 - KUV129SU",
        fileName: "Chev express 3500 - KUV129SU.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleId: [1]
    },
]