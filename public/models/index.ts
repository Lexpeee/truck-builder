export type GLBModel = {
    id: number;
    name: string;
    fileName: string;
    initialConfig?: {
        scale?: number
        position?: number[]
    }
    vehicleIds?: number[] // associated vehicle Ids
}

export const VEHICLES: GLBModel[] = [
    {
        id: 0,
        name: "RAM 2500HD CC",
        fileName: "RAM 2500HD CC.glb",
        initialConfig: {
            scale: 1,
        },
    },
    {
        id: 1,
        name: "Chevrolet express 3500",
        fileName: "Chevrolet express 3500.glb",
        initialConfig: {
            scale: 1,
        },
    },
]

export const UPFITS:GLBModel[] = [
    {
        id: 0,
        name: "RAM-2500HD-CC 696j Body",
        fileName: "RAM 2500HD CC 696j Body.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleIds: [0]
    },
    {
        id: 1,
        name: "RAM-2500HD-CC 696j Utility Rack",
        fileName: "RAM 2500HD CC 696j Utility Rack.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleIds: [0]
    },
    {
        id: 2,
        name: "Chev express 3500 - KUV129SU",
        fileName: "Chev express 3500 - KUV129SU.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleIds: [1]
    },
    {
        id: 3,
        name: "RAM-2500HD-CC 696j Hitch Recess Bumper",
        fileName: "RAM 2500HD CC 696j Hitch Recess Bumper.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleIds: [0]
    },
    {
        id: 4,
        name: "RAM 2500HD CC 696j Step Bumper",
        fileName: "RAM 2500HD CC 696j Step Bumper.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleIds: [0]
    },
    {
        id: 5,
        name: "RAM-2500HD-CC 696j Straight Bumper",
        fileName: "RAM 2500HD CC 696j Straight Bumper.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleIds: [0]
    },
    {
        id: 5,
        name: "Chev express 3500 - KUV129SU - Tri wing ladder rack",
        fileName: "Chev express 3500 - KUV129SU - Tri wing ladder rack.glb",
        initialConfig: {
            scale: 1,
            position: [0,0,0]
        },
        vehicleIds: [1]
    },

]