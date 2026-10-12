import fs from 'fs';

const filePath = 'public/models/heart.glb';
const buffer = fs.readFileSync(filePath);

// Read GLB header: magic (4), version (4), length (4)
const magic = buffer.readUInt32LE(0);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);

console.log(`GLB Magic: 0x${magic.toString(16)}, Version: ${version}, Length: ${length}`);

// Chunk 0: length (4), type (4)
const chunk0Length = buffer.readUInt32LE(12);
const chunk0Type = buffer.readUInt32LE(16);
console.log(`Chunk 0 length: ${chunk0Length}, type: 0x${chunk0Type.toString(16)} (JSON)`);

const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length);
const gltf = JSON.parse(jsonStr);

console.log('--- GLTF Summary ---');
console.log(`Nodes count: ${gltf.nodes ? gltf.nodes.length : 0}`);
console.log(`Meshes count: ${gltf.meshes ? gltf.meshes.length : 0}`);
console.log(`Materials count: ${gltf.materials ? gltf.materials.length : 0}`);

console.log('\n--- Meshes ---');
if (gltf.meshes) {
  gltf.meshes.forEach((m, i) => {
    console.log(`Mesh [${i}]: name="${m.name}", primitives=${m.primitives.length}`);
  });
}

console.log('\n--- Nodes ---');
if (gltf.nodes) {
  gltf.nodes.forEach((n, i) => {
    console.log(`Node [${i}]: name="${n.name}", mesh=${n.mesh}, children=${JSON.stringify(n.children)}`);
  });
}

console.log('\n--- Materials ---');
if (gltf.materials) {
  gltf.materials.forEach((mat, i) => {
    console.log(`Material [${i}]: name="${mat.name}"`);
  });
}
