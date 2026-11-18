declare module 'three' {
  export const SRGBColorSpace: string;
  export const NoToneMapping: number;
  export const DoubleSide: number;
  export const FrontSide: number;
  export const BackSide: number;
  export const LinearFilter: number;
  export const LinearMipmapLinearFilter: number;

  export class Vector2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
  }

  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
  }

  export class Euler {
    x: number;
    y: number;
    z: number;
    order: string;
    set(x: number, y: number, z: number, order?: string): this;
  }

  export class Object3D {
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    visible: boolean;
    renderOrder: number;
    children: Object3D[];
    userData: Record<string, unknown>;
    add(...object: Object3D[]): this;
    remove(...object: Object3D[]): this;
  }

  export class Group extends Object3D {}

  export class Scene extends Object3D {
    environment: Texture | null;
  }

  export class PerspectiveCamera extends Object3D {
    fov: number;
    aspect: number;
    near: number;
    far: number;
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    updateProjectionMatrix(): void;
  }

  export class Texture {
    colorSpace: string;
    anisotropy: number;
    minFilter: number;
    magFilter: number;
    needsUpdate: boolean;
    dispose(): void;
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement);
  }

  export class BufferAttribute {
    count: number;
    getX(index: number): number;
    getY(index: number): number;
    getZ(index: number): number;
    setX(index: number, x: number): this;
    setY(index: number, y: number): this;
    setZ(index: number, z: number): this;
    setXYZ(index: number, x: number, y: number, z: number): this;
    needsUpdate: boolean;
  }

  export class BufferGeometry {
    attributes: {
      position: BufferAttribute;
      uv: BufferAttribute;
      normal: BufferAttribute;
      [key: string]: BufferAttribute;
    };
    index: BufferAttribute | null;
    computeVertexNormals(): void;
    dispose(): void;
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number);
  }

  export class Material {
    transparent: boolean;
    opacity: number;
    alphaTest: number;
    depthWrite: boolean;
    side: number;
    needsUpdate: boolean;
    dispose(): void;
  }

  export class MeshBasicMaterial extends Material {
    map: Texture | null;
    constructor(params?: Record<string, unknown>);
  }

  export class MeshPhysicalMaterial extends Material {
    map: Texture | null;
    roughness: number;
    metalness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    envMapIntensity: number;
    constructor(params?: Record<string, unknown>);
  }

  export class Mesh extends Object3D {
    geometry: BufferGeometry;
    material: Material;
    constructor(geometry?: BufferGeometry, material?: Material);
  }

  export class AmbientLight extends Object3D {
    constructor(color?: number | string, intensity?: number);
  }

  export class DirectionalLight extends Object3D {
    constructor(color?: number | string, intensity?: number);
  }

  export class WebGLRenderTarget {
    texture: Texture;
    dispose(): void;
  }

  export class PMREMGenerator {
    constructor(renderer: WebGLRenderer);
    fromScene(scene: Scene, sigma?: number): WebGLRenderTarget;
    dispose(): void;
  }

  export class WebGLRenderer {
    domElement: HTMLCanvasElement;
    outputColorSpace: string;
    toneMapping: number;
    capabilities: {
      getMaxAnisotropy(): number;
    };
    constructor(params?: Record<string, unknown>);
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setPixelRatio(value: number): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    getContext(): WebGLRenderingContext | WebGL2RenderingContext;
    dispose(): void;
  }

  export class Raycaster {
    setFromCamera(coords: Vector2, camera: PerspectiveCamera): void;
    intersectObjects(objects: Object3D[], recursive?: boolean): Array<{ object: Object3D }>;
  }
}

declare module 'three/addons/environments/RoomEnvironment.js' {
  import type { Scene } from 'three';
  export class RoomEnvironment extends Scene {
    constructor();
  }
}
