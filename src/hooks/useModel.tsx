import { useGLTF } from "@react-three/drei";

const useModel = () => {
    const gltf = useGLTF('/models/RAM-2500HD-CC.glb')
    return gltf
}

export default useModel