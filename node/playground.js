import fs from "fs";

const importObj = {
    Math: {
        random: () => Math.random(),
    }
};

const data = fs.readFileSync("../target/wasm32-unknown-unknown/release/playground.wasm");
const {instance} = await WebAssembly.instantiate(data, importObj);

console.log(instance.exports.add(40, 2));
