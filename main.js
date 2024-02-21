import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import vertex from "./shaders/vertex.glsl?raw";
import fragment from "./shaders/fragment.glsl?raw";
import GUI from "lil-gui";
import Stats from "./Stats";
import studio from "@theatre/studio";
import { getProject, types } from "@theatre/core";
import projectState from "./projectState.json";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

class Experience {
    constructor(canvas) {
        window.experience = this;

        this.canvas = canvas;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#75D963");
        this.scene2 = new THREE.Scene();
        this.scene2.background = new THREE.Color("#75CAFF");

        this.setRenderer();
        this.setMesh();
        this.setCamera();
        this.setPostPro();
        this.setLights();
        this.setEvents();
        this.setDebug();
        this.setTick();
    }

    setMesh() {
        /**
         * Scene 1
         */

        this.ground = new THREE.Mesh(
            new THREE.CircleGeometry(5, 48),
            new THREE.MeshStandardMaterial({ color: "#99d98c" })
        );

        this.ground.position.y = -1;
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;

        this.scene.add(this.ground);

        this.sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 64, 64),
            new THREE.MeshStandardMaterial({ color: "#99d98c" })
        );

        this.scene.add(this.sphere);

        this.sphereBG = new THREE.Mesh(
            new THREE.SphereGeometry(20, 64, 64),
            new THREE.MeshBasicMaterial({
                color: "#b5e48c",
                side: THREE.BackSide,
            })
        );

        // this.scene.add(this.sphereBG);

        /**
         * Portal
         */
        this.portal = new THREE.Mesh(
            new THREE.CircleGeometry(3, 64),
            new THREE.ShaderMaterial({
                vertexShader: vertex,
                fragmentShader: fragment,
                uniforms: {
                    tDiffuse: { value: null },
                    uResolution: {
                        value: new THREE.Vector2(
                            window.innerWidth,
                            window.innerHeight
                        ),
                    },
                },
            })
        );

        this.portal.position.z = -5;
        this.portal.position.y = 1;
        this.scene.add(this.portal);

        /**
         * Scene 2
         */

        this.ground2 = new THREE.Mesh(
            new THREE.CircleGeometry(5, 48),
            new THREE.MeshStandardMaterial({ color: "skyblue" })
        );

        this.ground2.position.y = -1;
        this.ground2.position.z = -20;
        this.ground2.rotation.x = -Math.PI / 2;
        this.ground2.receiveShadow = true;

        this.scene2.add(this.ground2);

        this.sphere2 = this.sphere.clone();
        this.scene2.add(this.sphere2);
    }

    setCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 5);

        this.camera2 = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera2.position.set(0, 0, 5);
    }

    setLights() {
        this.dir = new THREE.DirectionalLight();
        this.dir.position.set(1.76, 2.26, 2.38);
        this.dir.castShadow = true;
        this.dir.shadow.mapSize = new THREE.Vector2(1024 * 2, 1024 * 2);
        this.scene.add(this.dir);

        this.ambient = new THREE.AmbientLight();
        this.scene.add(this.ambient);

        /**
         * Scene 2
         */

        this.dir2 = new THREE.DirectionalLight();
        this.dir2.position.set(1.76, 2.26, 2.38);
        this.dir2.castShadow = true;
        this.dir2.shadow.mapSize = new THREE.Vector2(1024 * 2, 1024 * 2);
        this.scene2.add(this.dir2);

        this.ambient2 = new THREE.AmbientLight();
        this.scene2.add(this.ambient2);
    }

    setEvents() {
        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderTarget.setSize(window.innerWidth, window.innerHeight);
    }

    setRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;

        this.renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            {
                samples: 3,
            }
        );
    }

    setPostPro() {
        const rt = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            { samples: 3 }
        );
        this.composer = new EffectComposer(this.renderer, rt);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    setTick() {
        /**
         * Stats
         */
        this.stats = new Stats();
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);

        /**
         * RAF
         */
        this.previousTime = 0;

        this.tick = this.tick.bind(this);
        requestAnimationFrame(this.tick);
    }

    tick(t) {
        this.stats.begin();

        this.elapsedTime = t / 1000;
        this.deltaTime = this.elapsedTime - this.previousTime;
        this.previousTime = this.elapsedTime;

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene2, this.camera);
        this.portal.material.uniforms.tDiffuse.value =
            this.renderTarget.texture;
        this.renderer.setRenderTarget(null);

        if (this.camera.position.z < -3.5) {
            this.renderPass.scene = this.scene2;
        } else {
            this.renderPass.scene = this.scene;
        }
        this.composer.render();

        this.sphere.position.set(0, 0, this.camera.position.z - 8);
        this.sphere2.position.set(0, 0, this.camera.position.z - 8);

        this.stats.end();
        requestAnimationFrame(this.tick);
    }

    setDebug() {
        const gui = new GUI();

        studio.initialize();

        // Create a project for the animation
        const project = getProject("THREE.js x Theatre.js", {
            state: projectState,
        });

        // Create a sheet
        const sheet = project.sheet("Animated scene");

        const cameraObj = sheet.object("Camera", {
            position: { z: this.camera.position.z },
            rotation: types.compound({
                x: types.number(0, { range: [-2, 2] }),
            }),
        });

        cameraObj.onValuesChange(({ position, rotation }) => {
            this.camera.position.z = position.z;
            this.camera.rotation.x = rotation.x;
        });
    }
}

const experience = new Experience(document.querySelector("canvas"));
